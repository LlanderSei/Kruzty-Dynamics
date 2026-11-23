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
          else -> -1
        }
        if (statusCode >= 0) DiscordSocialSdkNative.setOnlineStatus(statusCode)
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
        val activityName = (if (isMedia) state.optString("header").ifBlank { state.optString("appName").ifBlank { state.optString("title") } } else state.optString("title")).limitPresenceText()
        val activityDetails = (if (isMedia) state.optString("title") else state.optString("line1")).limitPresenceText()
        val activityState = (if (isMedia) state.optString("line1") else state.optString("line2")).limitPresenceText()
        val largeText = if (isMedia) state.optString("line2").ifBlank { state.optString("bigText") } else state.optString("bigText")
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
      } catch (error: Exception) {
        Log.w(TAG, "Discord Social SDK presence update failed (${error.javaClass.simpleName})")
      }
    }
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
