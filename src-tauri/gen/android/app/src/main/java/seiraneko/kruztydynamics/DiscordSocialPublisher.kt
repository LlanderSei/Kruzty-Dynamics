package seiraneko.kruztydynamics

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

internal object DiscordSocialPublisher {
  private const val TAG = "KruztyDynamics"
  private val executor = Executors.newSingleThreadExecutor()
  private var connectedAccountId = ""
  private var connectedAccessToken = ""
  private var warnedMissingSdk = false

  fun publish(context: Context, config: JSONObject, state: JSONObject) {
    if (!BuildConfig.DISCORD_SOCIAL_SDK_AVAILABLE) {
      if (!warnedMissingSdk) {
        Log.i(TAG, "Discord Social SDK Android package is not installed; presence publishing is unavailable")
        warnedMissingSdk = true
      }
      return
    }
    val accountId = config.optString("activeAccountId")
    if (accountId.isBlank()) {
      executor.execute {
        runCatching { DiscordSocialSdkNative.clearPresence() }
        connectedAccountId = ""
      }
      return
    }
    executor.execute {
      try {
        val token = DiscordSocialAuth.getFreshAccessToken(context.applicationContext, accountId)
        if (token.isNullOrBlank()) {
          Log.w(TAG, "Selected Discord account has no valid Social SDK authorization")
          return@execute
        }
        if (connectedAccountId != accountId || connectedAccessToken != token) {
          log("info", "Discord SDK connection requested: accountId=$accountId token=Bearer [REDACTED]")
          runCatching { DiscordSocialSdkNative.clearPresence() }
          DiscordSocialSdkNative.initialize(DiscordSocialAuth.APPLICATION_ID.toLong())
          DiscordSocialSdkNative.connect(token)
          connectedAccountId = accountId
          connectedAccessToken = token
        }
        val appSettings = config.optJSONObject("appSettings") ?: JSONObject()
        val status = state.optString("discordStatus")
          .ifBlank { appSettings.optString("globalActivityStatus", "online") }
        val statusCode = when (status.lowercase()) {
          "online" -> 0
          "offline" -> 1
          "idle" -> 3
          "dnd" -> 4
          "invisible" -> 5
          "streaming" -> 6
          else -> -1
        }
        if (statusCode >= 0) {
          log("info", "Discord online status send: value=$status sdkCode=$statusCode")
          DiscordSocialSdkNative.setOnlineStatus(statusCode)
        }
        if (!state.optBoolean("active", true) || state.optString("domain") == "idle") {
          DiscordSocialSdkNative.clearPresence()
          return@execute
        }
        val mediaDuration = state.optLong("mediaDurationMs", 0L)
        val mediaPosition = state.optLong("mediaPositionMs", 0L)
        val isPlaying = state.optString("domain") == "media" && state.optString("playbackState") == "Playing"
        val mediaStartedAt = System.currentTimeMillis() - mediaPosition.coerceAtLeast(0L)
        val start = if (isPlaying) mediaStartedAt / 1000L else state.optLong("sessionStartedAt", 0L) / 1000L
        val end = if (isPlaying && mediaDuration > 0L) {
          (mediaStartedAt + mediaDuration) / 1000L
        } else 0L
        val buttons = state.optJSONArray("buttons") ?: JSONArray()
        val serializedButtons = Array(minOf(buttons.length(), 2)) { index ->
          val button = buttons.optJSONObject(index) ?: JSONObject()
          button.optString("label") + "\n" + button.optString("url")
        }
        val packageName = state.optString("packageName")
        val isMedia = state.optString("domain") == "media"
        val activityName = state.optString("title").ifBlank { state.optString("appName") }.limitPresenceText()
        val activityDetails = state.optString("details").limitPresenceText()
        val activityState = state.optString("state").limitPresenceText()
        val largeText = state.optString("bigText")
        val configuredBigImage = state.optString("bigImage")
        val bigImage = if (
          configuredBigImage.isBlank() || configuredBigImage == packageName
        ) "kruztydynamicsicon" else configuredBigImage
        DiscordSocialSdkNative.updatePresence(
          activityName,
          activityDetails,
          activityState,
          bigImage,
          largeText,
          state.optString("smallImage"),
          state.optString("smallText"),
          state.optInt("activityType", 0),
          state.optString("platform", "Android"),
          start,
          end,
          serializedButtons,
        )
        log("info", "Discord presence send: domain=${state.optString("domain")} activityType=${state.optInt("activityType", 0)} platform=${state.optString("platform", "Android")} header='${activityName}' title='${activityDetails}' state='${activityState}' assetTooltip='${largeText}' imageConfigured=${bigImage.isNotBlank()} buttons=${serializedButtons.size}")
      } catch (error: Exception) {
        log("error", "Discord Social SDK presence send failed: ${error.javaClass.simpleName}: ${error.message ?: "no details"}")
      }
    }
  }

  private fun log(level: String, message: String) {
    val safeMessage = message
      .replace(Regex("(?i)(api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|client[_-]?secret)([=:\\s]+)[^\\s,;]+")) { match ->
        "${match.groupValues[1]}${match.groupValues[2]}[REDACTED]"
      }
      .replace(Regex("(?i)([?&](?:key|api_key|access_token|refresh_token)=)[^&#\\s]+")) { match -> "${match.groupValues[1]}[REDACTED]" }
      .replace(Regex("(?i)Bearer\\s+[A-Za-z0-9._-]{20,}"), "Bearer [REDACTED]")
      .replace(Regex("[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{6,}\\.[A-Za-z0-9_-]{20,}"), "[REDACTED]")
    when (level) {
      "error" -> Log.e(TAG, safeMessage)
      "warn" -> Log.w(TAG, safeMessage)
      else -> Log.i(TAG, safeMessage)
    }
    MainActivity.dispatchServiceEvent("dynamicsLog", JSONObject().put("level", level).put("message", safeMessage))
  }

  fun stop() {
    if (!BuildConfig.DISCORD_SOCIAL_SDK_AVAILABLE) return
    executor.execute {
      runCatching { DiscordSocialSdkNative.clearPresence() }
      runCatching { DiscordSocialSdkNative.disconnect() }
      connectedAccountId = ""
      connectedAccessToken = ""
    }
  }

  private fun String.limitPresenceText(): String {
    if (codePointCount(0, length) <= 128) return this
    val end = offsetByCodePoints(0, 125)
    return substring(0, end) + "..."
  }
}
