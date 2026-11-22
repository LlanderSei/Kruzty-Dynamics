#include <jni.h>
#include <android/log.h>
#define DISCORDPP_IMPLEMENTATION
#include <discordpp.h>
#include <algorithm>
#include <atomic>
#include <chrono>
#include <memory>
#include <mutex>
#include <regex>
#include <string>
#include <thread>
#include <vector>

namespace {
constexpr const char* kTag = "KruztyDynamicsSDK";
std::mutex gMutex;
std::unique_ptr<discordpp::Client> gClient;
std::thread gCallbackThread;
std::atomic<bool> gCallbacksRunning{false};
std::atomic<bool> gReady{false};
discordpp::Activity gPendingActivity{};
bool gHasPendingActivity = false;

std::string safeError(std::string error) {
  static const std::regex tokenPattern(R"((Bearer\s+)?[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}|mfa\.[A-Za-z0-9_-]{50,})", std::regex::icase);
  return std::regex_replace(error, tokenPattern, "[redacted]");
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
  gCallbackThread = std::thread([] {
    while (gCallbacksRunning.load()) {
      discordpp::RunCallbacks();
      std::this_thread::sleep_for(std::chrono::milliseconds(16));
    }
  });
}

void updatePending() {
  if (gClient && gReady.load() && gHasPendingActivity) {
    gClient->UpdateRichPresence(gPendingActivity, [](discordpp::ClientResult result) {
      if (!result.Successful()) {
        const auto message = std::string("Rich presence update failed: type=") +
          std::to_string(static_cast<int>(result.Type())) +
          " status=" + std::to_string(static_cast<int>(result.Status())) +
          " code=" + std::to_string(result.ErrorCode()) +
          " retryable=" + (result.Retryable() ? "true" : "false") +
          " error=" + safeError(result.Error());
        __android_log_write(ANDROID_LOG_WARN, kTag, message.c_str());
      }
    });
  }
}
}

extern "C" JNIEXPORT void JNICALL
Java_seiraneko_kruztydynamics_DiscordSocialSdkNative_initialize(JNIEnv*, jobject, jlong applicationId) {
  std::lock_guard<std::mutex> lock(gMutex);
  if (!gClient) {
    gClient = std::make_unique<discordpp::Client>();
    gClient->SetApplicationId(static_cast<uint64_t>(applicationId));
    gClient->SetStatusChangedCallback([](discordpp::Client::Status status, discordpp::Client::Error error, int32_t detail) {
      gReady.store(status == discordpp::Client::Status::Ready);
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
  jint activityType, jlong startTimestamp, jlong endTimestamp, jobjectArray buttonValues) {
  discordpp::Activity activity{};
  activity.SetType(static_cast<discordpp::ActivityTypes>(std::clamp(activityType, 0, 5)));
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
