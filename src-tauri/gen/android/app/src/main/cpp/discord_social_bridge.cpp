#include <jni.h>
#include <android/log.h>
#define DISCORDPP_IMPLEMENTATION
#include <discordpp.h>
#include <algorithm>
#include <atomic>
#include <chrono>
#include <memory>
#include <mutex>
#include <optional>
#include <regex>
#include <string>
#include <thread>
#include <vector>

namespace {
constexpr const char* kTag = "KruztyDynamicsSDK";
std::mutex gMutex;
std::unique_ptr<discordpp::Client> gClient;
JavaVM* gJavaVm = nullptr;
jclass gMainActivityClass = nullptr;
jmethodID gDispatchSdkLog = nullptr;
std::thread gCallbackThread;
std::atomic<bool> gCallbacksRunning{false};
std::atomic<bool> gReady{false};
discordpp::Activity gPendingActivity{};
bool gHasPendingActivity = false;
std::optional<discordpp::StatusType> gPendingOnlineStatus;
std::string safeError(std::string error);

void emitDiagnostic(const char* level, const std::string& message) {
  const int priority = std::string(level) == "error" ? ANDROID_LOG_ERROR :
    std::string(level) == "warn" ? ANDROID_LOG_WARN : ANDROID_LOG_INFO;
  __android_log_write(priority, kTag, message.c_str());
  if (gJavaVm == nullptr) return;
  JNIEnv* env = nullptr;
  bool attached = false;
  const jint status = gJavaVm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6);
  if (status == JNI_EDETACHED) {
    if (gJavaVm->AttachCurrentThread(&env, nullptr) != JNI_OK) return;
    attached = true;
  } else if (status != JNI_OK) {
    return;
  }
  if (gMainActivityClass != nullptr && gDispatchSdkLog != nullptr) {
    jstring javaLevel = env->NewStringUTF(level);
    jstring javaMessage = env->NewStringUTF(message.c_str());
    env->CallStaticVoidMethod(gMainActivityClass, gDispatchSdkLog, javaLevel, javaMessage);
    env->DeleteLocalRef(javaLevel);
    env->DeleteLocalRef(javaMessage);
  }
  if (env->ExceptionCheck()) env->ExceptionClear();
  if (attached) gJavaVm->DetachCurrentThread();
}

void setOnlineStatus(discordpp::StatusType status) {
  if (!gClient || !gReady.load()) return;
  gClient->SetOnlineStatus(status, [](discordpp::ClientResult result) {
    if (!result.Successful()) {
      const auto message = std::string("Online status update failed: type=") +
        std::to_string(static_cast<int>(result.Type())) +
        " status=" + std::to_string(static_cast<int>(result.Status())) +
        " code=" + std::to_string(result.ErrorCode()) +
        " response=" + safeError(result.Error());
      emitDiagnostic("warn", message);
    } else {
      emitDiagnostic("info", "Discord SDK online status accepted: status=" +
        std::to_string(static_cast<int>(result.Status())) + " response=" + safeError(result.ResponseBody()));
    }
  });
}

std::string safeError(std::string error) {
  static const std::regex tokenPattern(R"((Bearer\s+)?[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}|mfa\.[A-Za-z0-9_-]{50,})", std::regex::icase);
  static const std::regex keyPattern(R"(([?&](api_key|key|access_token|refresh_token)=)[^&#\s]+)", std::regex::icase);
  return std::regex_replace(std::regex_replace(error, tokenPattern, "[redacted]"), keyPattern, "$1[redacted]");
}

std::string toString(JNIEnv* env, jstring value) {
  if (value == nullptr) return {};
  const char* chars = env->GetStringUTFChars(value, nullptr);
  if (chars == nullptr) return {};
  std::string result(chars);
  env->ReleaseStringUTFChars(value, chars);
  return result;
}

void startCallbacks() {
  if (gCallbacksRunning.exchange(true)) return;
  emitDiagnostic("info", "Discord SDK callback pump started; polling interval=16ms");
  gCallbackThread = std::thread([] {
    while (gCallbacksRunning.load()) {
      discordpp::RunCallbacks();
      std::this_thread::sleep_for(std::chrono::milliseconds(16));
    }
  });
}

void updatePending() {
  if (gClient && gReady.load() && gPendingOnlineStatus.has_value()) {
    setOnlineStatus(*gPendingOnlineStatus);
    gPendingOnlineStatus.reset();
  }
  if (gClient && gReady.load() && gHasPendingActivity) {
    emitDiagnostic("info", "Discord SDK gateway ready; sending rich presence update");
    gClient->UpdateRichPresence(gPendingActivity, [](discordpp::ClientResult result) {
      if (!result.Successful()) {
        const auto message = std::string("Rich presence update failed: type=") +
          std::to_string(static_cast<int>(result.Type())) +
          " status=" + std::to_string(static_cast<int>(result.Status())) +
          " code=" + std::to_string(result.ErrorCode()) +
          " retryable=" + (result.Retryable() ? "true" : "false") +
          " error=" + safeError(result.Error());
        emitDiagnostic("warn", message);
      } else {
        emitDiagnostic("info", "Discord SDK presence accepted: status=" +
          std::to_string(static_cast<int>(result.Status())) + " response=" + safeError(result.ResponseBody()));
      }
    });
  }
}

}

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  gJavaVm = vm;
  JNIEnv* env = nullptr;
  if (vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) == JNI_OK) {
    jclass localClass = env->FindClass("seiraneko/kruztydynamics/MainActivity");
    if (localClass != nullptr) {
      gMainActivityClass = static_cast<jclass>(env->NewGlobalRef(localClass));
      gDispatchSdkLog = env->GetStaticMethodID(gMainActivityClass, "dispatchSdkLog", "(Ljava/lang/String;Ljava/lang/String;)V");
      env->DeleteLocalRef(localClass);
    }
    if (env->ExceptionCheck()) env->ExceptionClear();
  }
  return JNI_VERSION_1_6;
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_initialize(JNIEnv*, jobject, jlong applicationId) {
  std::lock_guard<std::mutex> lock(gMutex);
  if (!gClient) {
    gClient = std::make_unique<discordpp::Client>();
    gClient->SetApplicationId(static_cast<uint64_t>(applicationId));
    gClient->SetStatusChangedCallback([](discordpp::Client::Status status, discordpp::Client::Error error, int32_t detail) {
      gReady.store(status == discordpp::Client::Status::Ready);
      emitDiagnostic("info", std::string("Discord SDK gateway state changed: state=") +
        std::to_string(static_cast<int>(status)) + " ready=" + (gReady.load() ? "true" : "false") +
        " error=" + std::to_string(static_cast<int>(error)) + " detail=" + std::to_string(detail));
      if (error != discordpp::Client::Error::None) {
        const auto message = std::string("Discord SDK status error: error=") +
          std::to_string(static_cast<int>(error)) + " detail=" + std::to_string(detail);
        __android_log_write(ANDROID_LOG_WARN, kTag, message.c_str());
      }
      std::lock_guard<std::mutex> callbackLock(gMutex);
      updatePending();
    });
  }
  startCallbacks();
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_connect(JNIEnv* env, jobject, jstring accessToken) {
  const std::string token = toString(env, accessToken);
  std::lock_guard<std::mutex> lock(gMutex);
  if (!gClient || token.empty()) return;
  gClient->UpdateToken(discordpp::AuthorizationTokenType::Bearer, token, [](discordpp::ClientResult result) {
    if (!result.Successful()) {
      const auto message = std::string("Discord authorization token rejected: type=") +
        std::to_string(static_cast<int>(result.Type())) +
        " status=" + std::to_string(static_cast<int>(result.Status())) +
        " code=" + std::to_string(result.ErrorCode());
      __android_log_write(ANDROID_LOG_WARN, kTag, message.c_str());
      return;
    }
    std::lock_guard<std::mutex> callbackLock(gMutex);
    if (gClient) gClient->Connect();
  });
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_updatePresence(
  JNIEnv* env, jobject, jstring name, jstring details, jstring state,
  jstring largeImage, jstring largeText, jstring smallImage, jstring smallText,
  jint activityType, jstring supportedPlatform, jlong startTimestamp, jlong endTimestamp, jobjectArray buttonValues) {
  discordpp::Activity activity{};
  activity.SetType(static_cast<discordpp::ActivityTypes>(std::clamp(activityType, 0, 5)));
  const auto platform = toString(env, supportedPlatform);
  discordpp::ActivityGamePlatforms platformValue{};
  if (platform == "Android") platformValue = discordpp::ActivityGamePlatforms::Android;
  else if (platform == "PC") platformValue = discordpp::ActivityGamePlatforms::Desktop;
  else if (platform == "PlayStation") platformValue = discordpp::ActivityGamePlatforms::PS5;
  else if (platform == "Xbox") platformValue = discordpp::ActivityGamePlatforms::Xbox;
  if (platformValue != discordpp::ActivityGamePlatforms{}) activity.SetSupportedPlatforms(platformValue);
  const auto nameText = toString(env, name);
  const auto detailsText = toString(env, details);
  const auto stateText = toString(env, state);
  if (!nameText.empty()) activity.SetName(nameText);
  if (!detailsText.empty()) activity.SetDetails(detailsText);
  if (!stateText.empty()) activity.SetState(stateText);

  discordpp::ActivityAssets assets{};
  const auto large = toString(env, largeImage);
  const auto largeTip = toString(env, largeText);
  const auto small = toString(env, smallImage);
  const auto smallTip = toString(env, smallText);
  if (!large.empty()) assets.SetLargeImage(large);
  if (!largeTip.empty()) assets.SetLargeText(largeTip);
  if (!small.empty()) assets.SetSmallImage(small);
  if (!smallTip.empty()) assets.SetSmallText(smallTip);
  if (!large.empty() || !largeTip.empty() || !small.empty() || !smallTip.empty()) activity.SetAssets(assets);

  if (startTimestamp > 0 || endTimestamp > 0) {
    discordpp::ActivityTimestamps timestamps{};
    if (startTimestamp > 0) timestamps.SetStart(static_cast<uint64_t>(startTimestamp));
    if (endTimestamp > 0) timestamps.SetEnd(static_cast<uint64_t>(endTimestamp));
    activity.SetTimestamps(timestamps);
  }
  if (buttonValues != nullptr) {
    const jsize count = std::min<jsize>(env->GetArrayLength(buttonValues), 2);
    for (jsize index = 0; index < count; ++index) {
      auto value = static_cast<jstring>(env->GetObjectArrayElement(buttonValues, index));
      const auto serialized = toString(env, value);
      env->DeleteLocalRef(value);
      const auto separator = serialized.find('\n');
      if (separator == std::string::npos) continue;
      discordpp::ActivityButton button{};
      button.SetLabel(serialized.substr(0, separator));
      button.SetUrl(serialized.substr(separator + 1));
      activity.AddButton(button);
    }
  }

  std::lock_guard<std::mutex> lock(gMutex);
  gPendingActivity = std::move(activity);
  gHasPendingActivity = true;
  updatePending();
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_setOnlineStatus(JNIEnv*, jobject, jint status) {
  std::lock_guard<std::mutex> lock(gMutex);
  const auto boundedStatus = std::clamp(status, 0, 6);
  gPendingOnlineStatus = static_cast<discordpp::StatusType>(boundedStatus);
  updatePending();
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_clearPresence(JNIEnv*, jobject) {
  std::lock_guard<std::mutex> lock(gMutex);
  gHasPendingActivity = false;
  if (gClient && gReady.load()) gClient->ClearRichPresence();
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_disconnect(JNIEnv*, jobject) {
  {
    std::lock_guard<std::mutex> lock(gMutex);
    gHasPendingActivity = false;
    gReady.store(false);
    if (gClient) {
      gClient->ClearRichPresence();
      gClient->Disconnect();
    }
  }
}
