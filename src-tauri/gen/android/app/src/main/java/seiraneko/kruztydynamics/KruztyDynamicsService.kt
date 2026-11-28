package seiraneko.kruztydynamics

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.media.MediaMetadata
import android.media.session.MediaSessionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Base64
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject

class KruztyDynamicsService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var config = JSONObject()
  private var wakeLock: PowerManager.WakeLock? = null
  private var lastFingerprint = ""
  private var lastState: JSONObject? = null
  private var foregroundPackage = ""
  private var lastUsageEventTime = 0L
  private var foregroundStartedAt = 0L
  private val appStartedAtByPackage = mutableMapOf<String, Long>()
  private val stoppedPackages = mutableSetOf<String>()
  private var serviceStartedAt = 0L

  private val poll = object : Runnable {
    override fun run() {
      try {
        updateDetectedState()
      } catch (error: Exception) {
        emitLog("warn", "Detection cycle failed: ${error.javaClass.simpleName}")
      }
      handler.postDelayed(this, POLL_INTERVAL_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    createChannel()
    acquireWakeLock()
    isRunning = true
    MainActivity.updateServiceShortcut(this)
    serviceStartedAt = System.currentTimeMillis()
    runCatching {
      config = JSONObject(getSharedPreferences(PREFS, MODE_PRIVATE).getString(EXTRA_CONFIG, "{}") ?: "{}")
    }
    getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove(LAST_STATUS).apply()
    startForeground(NOTIFICATION_ID, buildNotification(NativeStrings.text(this, "running"), null, null))
    MainActivity.dispatchServiceEvent(
      "dynamicsStatusUpdated",
      JSONObject().put("domain", "idle").put("title", NativeStrings.text(this, "running")).put("active", false),
    )
    DiscordSocialPublisher.publish(this, config, JSONObject().put("domain", "idle").put("active", false))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    if (intent?.action == ACTION_RESTART) {
      val restartConfig = config.toString()
      DiscordSocialPublisher.stop()
      stopSelfResult(startId)
      Handler(Looper.getMainLooper()).postDelayed({
        val restartIntent = Intent(applicationContext, KruztyDynamicsService::class.java)
          .setAction(ACTION_START)
          .putExtra(EXTRA_CONFIG, restartConfig)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          applicationContext.startForegroundService(restartIntent)
        } else {
          applicationContext.startService(restartIntent)
        }
      }, 250L)
      return START_NOT_STICKY
    }
    intent?.getStringExtra(EXTRA_CONFIG)?.let { raw ->
      runCatching {
        config = JSONObject(raw)
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(EXTRA_CONFIG, raw).apply()
        // Do not clear the presence here: config reloads (including redundant
        // restarts from the WebView) must not reset the published activity.
        // The next poll re-evaluates and republishes only when the resolved
        // fingerprint actually changes.
      }
        .onFailure { emitLog("warn", "Could not load service configuration") }
    }
    logStartupConfiguration()
    handler.removeCallbacks(poll)
    handler.post(poll)
    MainActivity.dispatchServiceEvent("dynamicsServiceStarted", JSONObject())
    if (intent?.getBooleanExtra(EXTRA_SHOW_SHORTCUT_TOAST, false) == true) {
      android.widget.Toast.makeText(this, NativeStrings.text(this, "started"), android.widget.Toast.LENGTH_SHORT).show()
    }
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(poll)
    releaseWakeLock()
    isRunning = false
    MainActivity.updateServiceShortcut(this)
    emitLog("info", "Service stopped")
    DiscordSocialPublisher.stop()
    getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove(LAST_STATUS).apply()
    MainActivity.dispatchServiceEvent("dynamicsServiceStopped", JSONObject())
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun updateDetectedState() {
    val profiles = config.optJSONArray("profiles") ?: JSONArray()
    val enabledProfiles = (0 until profiles.length()).mapNotNull { index ->
      profiles.optJSONObject(index)?.takeIf { it.optBoolean("enabled") }
    }
    val mediaSettings = config.optJSONObject("mediaConfig") ?: JSONObject()
    val appPackage = detectForegroundPackage()
    val activeMedia = detectMedia(appPackage)?.let { media ->
      val pausedResolution = mediaSettings.optString("pausedResolution", "show-paused")
      if (media.state == "Paused" && pausedResolution != "show-paused") null else media
    }
    if (activeMedia != null) stoppedPackages.remove(activeMedia.packageName)
    stoppedPackages.forEach { stoppedPackage ->
      if (activeMedia?.packageName != stoppedPackage) appStartedAtByPackage.remove(stoppedPackage)
    }
    stoppedPackages.clear()
    val previousMediaPackage = lastState?.takeIf { it.optString("domain") == "media" }?.optString("packageName")
    if (activeMedia == null && !previousMediaPackage.isNullOrBlank()) appStartedAtByPackage.remove(previousMediaPackage)
    val mediaFirst = mediaSettings.optString("priorityMode", "priority-media") == "priority-media"
    val mediaMatch = activeMedia?.let { media ->
      val profile = enabledProfiles.firstOrNull { it.optString("packageName") == media.packageName }
      val scope = mediaSettings.optString("mediaScope", "all")
      if (scope == "enabled-only" && profile == null) null else media to profile
    }
    val appProfile = enabledProfiles.firstOrNull { it.optString("packageName") == appPackage }
    val selectedMedia = if (mediaFirst) mediaMatch else null

    if (appProfile == null && mediaMatch == null &&
      (config.optJSONObject("appConfig") ?: JSONObject()).optString("outsidePolicy", "freeze") == "freeze") {
      val previous = lastState
      val previousPackage = previous?.optString("packageName").orEmpty()
      val previouslyDisabledApp = previous?.optString("domain") == "app" &&
        enabledProfiles.none { it.optString("packageName") == previousPackage }
      val mediaSessionEnded = previous?.optString("domain") == "media"
      if (previouslyDisabledApp || mediaSessionEnded) {
        val outsidePolicy = (config.optJSONObject("appConfig") ?: JSONObject()).optString("outsidePolicy", "freeze")
        val idleState = if (outsidePolicy == "custom") resolveOutside() else JSONObject().put("domain", "idle").put("title", NativeStrings.text(this, "running")).put("active", false)
        publishState(idleState)
      }
      return
    }

    val state = when {
      selectedMedia != null -> resolveMedia(selectedMedia.first, selectedMedia.second)
      appProfile != null -> resolveApp(appProfile)
      mediaMatch != null -> resolveMedia(mediaMatch.first, mediaMatch.second)
      else -> resolveOutside()
    }
    if (state.optString("domain") == "app") {
      val appPackageName = state.optString("packageName")
      state.put(
        "sessionStartedAt",
        appStartedAtByPackage[appPackageName]?.takeIf { it > 0L }
          ?: savedAppStartTimestamp()
          ?: foregroundStartedAt.takeIf { it > 0L }
          ?: System.currentTimeMillis(),
      )
    }
    if (state.optString("domain") == "media") {
      val media = (selectedMedia ?: mediaMatch)?.first
      if (media != null) {
        state.put("sessionStartedAt", media.appStartedAt)
        state.put("mediaPositionMs", media.positionMs)
        state.put("mediaDurationMs", media.durationMs)
        state.put("mediaUpdatedAt", System.currentTimeMillis())
        state.put("mediaType", media.mediaType)
        state.put("appName", media.appName)
        state.put("artist", media.artist)
        state.put("album", media.album)
        state.put("playbackRate", media.playbackRate.toDouble())
      }
    }
    val artwork = if (state.optString("domain") == "media") (selectedMedia ?: mediaMatch)?.first?.artwork else null
    publishState(state, artwork)
  }

  private fun publishState(state: JSONObject, mediaArtwork: Bitmap? = null) {
    val fingerprint = listOf(
      state.optString("domain"), state.optString("packageName"), state.optString("title"),
      state.optString("details"), state.optString("state"), state.optString("playbackState"),
      state.optString("sessionStartedAt"), state.optString("activityType"), state.optString("iconUrl"),
      state.optString("smallText"), state.optString("smallImage"), state.optString("bigText"), state.optString("appName"),
      state.optString("discordStatus"), state.optString("platform"),
      state.optString("mediaType"), state.optString("buttons"),
      config.optString("activeAccountId"),
    ).joinToString("|")
    if (fingerprint == lastFingerprint) return
    lastFingerprint = fingerprint
    val notificationFields = config.optJSONObject("notificationFields") ?: JSONObject()
    val isMedia = state.optString("domain") == "media"
    val fieldValues = JSONObject()
      .put("AppActivityType", activityTypeName(state.optInt("activityType", 0)))
      .put("AppTitle", state.optString("title"))
      .put("AppDetails", state.optString("details"))
      .put("AppState", state.optString("state"))
      .put("AppBigText", state.optString("bigText"))
      .put("MediaDetails", state.optString("details"))
      .put("MediaState", state.optString("state"))
      .put("MediaBigText", state.optString("bigText"))
    val titleTemplate = notificationFields.optString(
      if (isMedia) "mediaTitle" else "appTitle",
      if (isMedia) "{{getFieldCfgStr(\"MediaDetails\")}}"
      else "{{AppActivityType == \"Playing\" ?? getFieldCfgStr(\"AppTitle\") : getFieldCfgStr(\"AppDetails\")}}",
    )
    val subtitleTemplate = notificationFields.optString(
      if (isMedia) "mediaSubtitle" else "appSubtitle",
      if (isMedia) "{{joinNonBlank(getFieldCfgStr(\"MediaState\"), getFieldCfgStr(\"MediaBigText\"))}}"
      else "{{AppActivityType == \"Playing\" ?? joinNonBlank(getFieldCfgStr(\"AppDetails\"), getFieldCfgStr(\"AppState\")) : joinNonBlank(getFieldCfgStr(\"AppState\"), getFieldCfgStr(\"AppBigText\"))}}",
    )
    val title = render(titleTemplate, fieldValues).ifBlank { state.optString("title") }
      .ifBlank { NativeStrings.text(this, "running") }
    val content = render(subtitleTemplate, fieldValues).ifBlank { null }
    val iconUrl = state.optString("iconUrl")
    val packageName = state.optString("packageName")
    if (mediaArtwork != null) state.put("iconData", bitmapDataUrl(mediaArtwork))
    val icon = mediaArtwork ?: if (iconUrl.startsWith("http")) null else loadIcon(iconUrl, packageName)
    val notification = buildNotification(title, content, icon)
    getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    if (iconUrl.startsWith("http")) {
      Thread {
        loadIcon(iconUrl, packageName)?.let { bitmap ->
          handler.post {
            if (fingerprint == lastFingerprint) {
              getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(title, content, bitmap))
            }
          }
        }
      }.start()
    }
    if (!state.has("active")) state.put("active", true)
    state.put("iconUrl", state.optString("iconUrl"))
    if (!state.has("iconData")) {
      val imagePackage = state.optString("packageName").ifBlank { packageName }
      loadIcon("", imagePackage)?.let { bitmap ->
        state.put("iconData", bitmapDataUrl(bitmap))
        bitmap.recycle()
      }
    }
    lastState = JSONObject(state.toString())
    getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(LAST_STATUS, state.toString()).apply()
    MainActivity.dispatchServiceEvent("dynamicsStatusUpdated", state)
    DiscordSocialPublisher.publish(this, config, state)
    emitLog("info", formatDetectedState(state))
  }

  private fun detectForegroundPackage(): String {
    val manager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    if (lastUsageEventTime == 0L) lastUsageEventTime = now - 86_400_000L
    val events = manager.queryEvents(lastUsageEventTime, now)
    val event = UsageEvents.Event()
    var current = foregroundPackage
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.timeStamp > lastUsageEventTime) lastUsageEventTime = event.timeStamp
      val resumed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        event.eventType == UsageEvents.Event.ACTIVITY_RESUMED
      } else {
        @Suppress("DEPRECATION")
        event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
      }
      val paused = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        event.eventType == UsageEvents.Event.ACTIVITY_PAUSED || event.eventType == UsageEvents.Event.ACTIVITY_STOPPED
      } else {
        @Suppress("DEPRECATION")
        event.eventType == UsageEvents.Event.MOVE_TO_BACKGROUND
      }
      if (resumed) {
        val resumedPackage = event.packageName.orEmpty()
        if (resumedPackage != current) foregroundStartedAt = event.timeStamp
        if (resumedPackage.isNotBlank()) {
          appStartedAtByPackage[resumedPackage] = resolveAppStartTimestamp(event.timeStamp)
        }
        current = resumedPackage
      }
      val stopped = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && event.eventType == UsageEvents.Event.ACTIVITY_STOPPED
      if (stopped) event.packageName?.let(stoppedPackages::add)
      if (paused && event.packageName == current) {
        current = ""
        foregroundStartedAt = 0L
      }
    }
    foregroundPackage = current
    return current
  }

  private data class MediaInfo(
    val packageName: String,
    val title: String,
    val artist: String,
    val album: String,
    val description: String,
    val state: String,
    val artwork: Bitmap?,
    val appName: String,
    val mediaType: String,
    val positionMs: Long,
    val durationMs: Long,
    val playbackRate: Float,
    val appStartedAt: Long,
  )

  private fun detectMedia(foregroundPackage: String): MediaInfo? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return null
    return try {
      val component = ComponentName(this, MediaNotificationListenerService::class.java)
      val sessions = (getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager)
        .getActiveSessions(component)
      val usableSessions = sessions.filterNot { controller ->
        val notification = MediaNotificationListenerService.getNotificationDetails(controller.packageName)
        notification != null && notification.removedAt > notification.postedAt
      }
      val nowElapsed = android.os.SystemClock.elapsedRealtime()
      val session = usableSessions.firstOrNull { it.playbackState?.state == android.media.session.PlaybackState.STATE_PLAYING }
        ?: usableSessions.firstOrNull {
          val playback = it.playbackState
          val isPaused = playback?.state == android.media.session.PlaybackState.STATE_PAUSED
          val lastPositionUpdate = playback?.lastPositionUpdateTime ?: nowElapsed
          val oldInBackground = isPaused && it.packageName != foregroundPackage &&
            nowElapsed - lastPositionUpdate > PAUSED_SESSION_MAX_AGE_MS
          isPaused && !oldInBackground
        }
        ?: return null
      val metadata = session.metadata ?: MediaMetadata.Builder().build()
      val notification = MediaNotificationListenerService.getNotificationDetails(session.packageName)
      val notificationParts = notification?.text?.split(" • ", " – ", " - ")?.map(String::trim).orEmpty()
      val state = when (session.playbackState?.state) {
        android.media.session.PlaybackState.STATE_PLAYING -> "Playing"
        android.media.session.PlaybackState.STATE_PAUSED -> "Paused"
        else -> "Stopped"
      }
      val title = firstNonBlank(
        metadata.getString(MediaMetadata.METADATA_KEY_TITLE),
        metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE),
        notification?.title,
      )
      val artist = firstNonBlank(
        metadata.getString(MediaMetadata.METADATA_KEY_ARTIST),
        metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST),
        metadata.getString(MediaMetadata.METADATA_KEY_AUTHOR),
        metadata.getString(MediaMetadata.METADATA_KEY_WRITER),
        metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE),
        notificationParts.getOrNull(0),
        notification?.subText,
      )
      val album = firstNonBlank(
        metadata.getString(MediaMetadata.METADATA_KEY_ALBUM),
        metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION),
        notificationParts.getOrNull(1),
        notification?.bigText,
      )
      val appName = runCatching {
        packageManager.getApplicationLabel(packageManager.getApplicationInfo(session.packageName, 0)).toString()
      }.getOrDefault(session.packageName)
      val playback = session.playbackState
      val basePosition = playback?.position?.coerceAtLeast(0L) ?: 0L
      val position = if (state == "Playing" && playback != null && playback.lastPositionUpdateTime > 0L) {
        basePosition + ((SystemClock.elapsedRealtime() - playback.lastPositionUpdateTime).coerceAtLeast(0L) * playback.playbackSpeed).toLong()
      } else basePosition
      val duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION)
        .takeIf { it > 0L }
        ?: notification?.durationMs?.takeIf { it > 0L }
        ?: metadata.getLong("android.media.metadata.DURATION").coerceAtLeast(0L)
      val mediaType = inferMediaType(session.packageName, metadata.getString(MediaMetadata.METADATA_KEY_GENRE))
      val titleValue = title.ifBlank { appName }
      MediaInfo(
        session.packageName,
        titleValue,
        artist,
        album,
        firstNonBlank(metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION), notification?.bigText, notification?.text),
        state,
        metadata.getBitmap(MediaMetadata.METADATA_KEY_ART) ?: metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART),
        appName,
        mediaType,
        position,
        duration,
        playback?.playbackSpeed ?: 0f,
        appStartedAtByPackage[session.packageName]
          ?: savedAppStartTimestamp()
          ?: notification?.postedAt?.takeIf { it > 0L }
          ?: System.currentTimeMillis(),
      )
    } catch (_: SecurityException) {
      null
    }
  }

  private fun resolveApp(profile: JSONObject): JSONObject {
    val packageName = profile.optString("packageName")
    val appName = profile.optString("systemLabel").ifBlank { packageName }
    val projectedName = profile.optString("projectedName").ifBlank { appName }
    val icon = profile.optString("iconOverride").ifBlank {
      imageLink("app", packageName).ifBlank { packageName }
    }
    val fields = config.optJSONObject("appFields") ?: JSONObject()
    val appSettings = config.optJSONObject("appSettings") ?: JSONObject()
    val customDetailsEnabled = profile.optBoolean("customDetailsEnabled")
    val customSmallEnabled = profile.optBoolean("customSmallEnabled")
    val activityType = resolveActivityType(profile.optString("activityType", "global"), appSettings.optInt("globalActivityType", 0))
    val platform = profile.optString("platform").ifBlank { "Android" }
    val values = JSONObject().put("AppName", projectedName).put("OriginalAppName", appName).put("ProjectedName", projectedName)
      .put("PackageName", packageName).put("AppImageUrl", icon)
      .put("AppActivityType", activityTypeName(activityType)).put("AppPlatformType", platform)
      .put("AppDetails", if (customDetailsEnabled) profile.optString("customDetails") else "")
      .put("AppState", if (customDetailsEnabled) profile.optString("customState") else "")
      .put("AppSmallText", if (customSmallEnabled) profile.optString("customSmallText") else "")
      .put("AppSmallUrl", if (customSmallEnabled) profile.optString("customSmallUrl") else "")
    val discordStatus = resolveDiscordStatus(profile, appSettings)
    val bigImage = render(fields.optString("bigImage", "{{AppImageUrl}}"), values).ifBlank { icon }
    return JSONObject().put("domain", "app").put("packageName", packageName)
      .put("appName", projectedName)
      .put("title", render(fields.optString("title", "{{AppActivityType == \"Playing\" ?? AppName : AppPlatformType}}"), values).ifBlank { projectedName })
      .put("details", render(fields.optString("details", "{{AppActivityType == \"Playing\" ?? AppDetails : AppName}}"), values))
      .put("state", render(fields.optString("state", "{{AppActivityType == \"Playing\" ?? AppState : AppDetails}}"), values))
      .put("activityType", activityType)
      .put("discordStatus", discordStatus)
      .put("platform", platform)
      .put("smallText", render(fields.optString("smallText", "{{AppSmallText}}"), values))
      .put("smallImage", render(fields.optString("smallImage", "{{AppSmallUrl}}"), values))
      .put("bigText", render(fields.optString("bigText", "{{AppActivityType == \"Playing\" ?? AppName : AppState}}"), values))
      .put("bigImage", bigImage)
      .put("iconUrl", bigImage)
      .put("buttons", profile.optJSONArray("buttons") ?: JSONArray())
  }

  private fun resolveMedia(media: MediaInfo, profile: JSONObject?): JSONObject {
    val appName = profile?.optString("projectedName")?.ifBlank { media.appName } ?: media.appName
    val fields = config.optJSONObject("mediaFields") ?: JSONObject()
    val icon = profile?.optString("iconOverride")?.ifBlank {
      imageLink("app", media.packageName).ifBlank { media.packageName }
    } ?: imageLink("app", media.packageName).ifBlank { media.packageName }
    val mediaImage = imageLink("media", media.packageName)
    val values = JSONObject().put("AppName", appName).put("AppImageUrl", icon)
      .put("PackageName", media.packageName).put("MediaTitle", media.title.ifBlank { appName })
      .put("MediaArtist", media.artist).put("MediaAlbum", media.album)
      .put("MediaImageUrl", mediaImage)
      .put("MediaDescription", media.description).put("PlaybackState", media.state)
      .put("PlaybackStateImageUrl", if (media.state == "Playing") "mediaplay" else "mediapause")
    val appSettings = config.optJSONObject("appSettings") ?: JSONObject()
    val discordStatus = resolveDiscordStatus(profile, appSettings)
    val platform = profile?.optString("platform")?.ifBlank { "Android" } ?: "Android"
    val mediaSettings = config.optJSONObject("mediaConfig") ?: JSONObject()
    val activityType = if (mediaSettings.optString("activityTypeMode", "auto-adaptive") == "app-profile-override" && profile != null) {
      resolveActivityType(profile.optString("activityType", "global"), appSettings.optInt("globalActivityType", 0))
    } else if (media.mediaType == "video") 3 else 2
    val bigImage = render(fields.optString("bigImage", "{{HasMediaImage ?? MediaImageUrl : AppImageUrl}}"), values).ifBlank { icon }
    return JSONObject().put("domain", "media").put("packageName", media.packageName)
      .put("title", render(fields.optString("title", "{{AppName}}"), values).ifBlank { appName })
      .put("appName", appName)
      .put("details", render(fields.optString("details", "{{MediaTitle ?? AppName}}"), values))
      .put("state", render(fields.optString("state", "{{MediaArtist ?? MediaDescription}}"), values))
      .put("discordStatus", discordStatus).put("platform", platform)
      .put("iconUrl", bigImage)
      .put("activityType", activityType).put("smallText", render(fields.optString("smallText", "{{PlaybackState}}"), values))
      .put("smallImage", render(fields.optString("smallImage", "{{HasDetectablePlaybackState ?? PlaybackStateImageUrl : AppImageUrl}}"), values))
      .put("bigText", render(fields.optString("bigText", "{{MediaAlbum ?? MediaDescription}}"), values)).put("bigImage", bigImage)
      .put("mediaPlaying", media.state == "Playing").put("playbackState", media.state).put("mediaType", media.mediaType)
      .put("mediaImageUrl", mediaImage).put("appImageUrl", icon)
      .put("mediaPositionMs", media.positionMs).put("mediaDurationMs", media.durationMs)
      .put("mediaDescription", media.description).put("buttons", resolveMediaButtons(fields))
  }

  private fun imageLink(domain: String, packageName: String): String =
    config.optJSONObject("imageLinks")?.optString("$domain:$packageName").orEmpty()

  private fun resolveOutside(): JSONObject {
    val appConfig = config.optJSONObject("appConfig") ?: JSONObject()
    val policy = appConfig.optString("outsidePolicy", "freeze")
    if (policy == "freeze" && lastFingerprint.isNotBlank()) return JSONObject()
    if (policy == "drop") return JSONObject().put("domain", "idle").put("title", NativeStrings.text(this, "running"))
    val fields = appConfig
    val title = fields.optString("customName", fields.optString("name", "Chilling on Phone"))
    val appSettings = config.optJSONObject("appSettings") ?: JSONObject()
    val bigImage = fields.optString("customBigImage").ifBlank { fields.optString("largeImage", "kruztydynamicsicon") }
    return JSONObject().put("domain", "custom-fallback").put("title", title)
      .put("discordStatus", appSettings.optString("globalActivityStatus", "online"))
      .put("details", fields.optString("customDetails", fields.optString("details", "")))
      .put("state", fields.optString("customState", fields.optString("state", "")))
      .put("activityType", resolveActivityType("global", appSettings.optInt("globalActivityType", 0)))
      .put("smallText", fields.optString("customSmallText"))
      .put("smallImage", fields.optString("customSmallImage"))
      .put("bigText", fields.optString("customBigText"))
      .put("bigImage", bigImage).put("iconUrl", bigImage)
  }

  private fun render(template: String, values: JSONObject): String {
    if (template.isBlank()) return ""
    var result = template
    val tokens = Regex("\\{\\{([^{}]+)\\}\\}")
    repeat(3) {
      result = tokens.replace(result) { match ->
        evaluateExpression(match.groupValues[1].trim(), values)
      }
    }
    return result.replace(Regex("\\s{2,}"), " ").trim()
  }

  private fun evaluateExpression(expression: String, values: JSONObject): String {
    val conditional = Regex("^(.+?)\\s*(==|!=)\\s*(.+?)\\s*\\?\\?\\s*(.*?):(.*)$").matchEntire(expression)
    if (conditional != null) {
      val left = resolveExpressionValue(conditional.groupValues[1], values)
      val right = resolveExpressionValue(conditional.groupValues[3], values)
      val equal = left == right
      val branch = if ((conditional.groupValues[2] == "==") == equal) conditional.groupValues[4] else conditional.groupValues[5]
      return resolveExpressionValue(branch, values)
    }
    val parts = expression.split("??", limit = 2)
    val value = resolveExpressionValue(parts[0], values)
    if (value.isNotBlank() || parts.size == 1) return value
    return resolveExpressionValue(parts[1].substringBefore(":"), values)
  }

  private fun resolveExpressionValue(raw: String, values: JSONObject): String {
    val value = raw.trim()
    if (value.length >= 2 && value.first() == '\"' && value.last() == '\"') return value.substring(1, value.length - 1)
    val fieldReference = Regex("""^getFieldCfgStr\("([^"]+)"\)$""").matchEntire(value)
    if (fieldReference != null) return values.optString(fieldReference.groupValues[1])
    val joinedFields = Regex("""^joinNonBlank\((.*),\s*(.*)\)$""").matchEntire(value)
    if (joinedFields != null) {
      return listOf(
        resolveExpressionValue(joinedFields.groupValues[1], values),
        resolveExpressionValue(joinedFields.groupValues[2], values),
      ).filter { it.isNotBlank() }.joinToString(" • ")
    }
    return if (values.has(value)) values.optString(value) else ""
  }

  private fun resolveActivityType(selection: String, global: Int): Int {
    val resolved = selection.toIntOrNull() ?: global
    return if (resolved == 1) 0 else resolved
  }

  private fun resolveDiscordStatus(profile: JSONObject?, appSettings: JSONObject): String {
    val selected = profile?.optString("activityStatus", "global")
      ?.takeUnless { it == "global" }
      ?: appSettings.optString("globalActivityStatus", "online")
    val profileHasLegacyStreaming = profile?.optString("activityType") == "1"
    val globalHasLegacyStreaming = appSettings.optInt("globalActivityType", 0) == 1
    return if (profileHasLegacyStreaming || (globalHasLegacyStreaming && (profile == null || profile.optString("activityStatus", "global") == "global"))) {
      "streaming"
    } else selected
  }

  private fun activityTypeName(type: Int): String = when (type) {
    1 -> "Streaming"
    2 -> "Listening"
    3 -> "Watching"
    5 -> "Competing"
    else -> "Playing"
  }

  private fun resolveAppStartTimestamp(resumedAt: Long): Long {
    val appConfig = config.optJSONObject("appConfig") ?: JSONObject()
    return when (appConfig.optString("timestampStrategy", "persistent")) {
      "reset" -> resumedAt
      "custom" -> parseCustomTimestamp(appConfig.optString("customDateTime")) ?: resumedAt
      else -> serviceStartedAt
    }
  }

  private fun savedAppStartTimestamp(): Long? {
    val appConfig = config.optJSONObject("appConfig") ?: JSONObject()
    return when (appConfig.optString("timestampStrategy", "persistent")) {
      "custom" -> parseCustomTimestamp(appConfig.optString("customDateTime"))
      "persistent" -> serviceStartedAt.takeIf { it > 0L }
      else -> null
    }
  }

  private fun parseCustomTimestamp(value: String): Long? {
    if (value.isBlank()) return null
    return runCatching {
      java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault())
        .parse(value)?.time
    }.getOrNull()
  }

  private fun firstNonBlank(vararg values: String?): String = values.firstOrNull { !it.isNullOrBlank() }?.trim().orEmpty()

  private fun inferMediaType(packageName: String, genre: String?): String {
    val source = "$packageName ${genre.orEmpty()}".lowercase()
    if (source.contains("youtube music") || source.contains("youtube.music")) return "music"
    return if (listOf("youtube", "netflix", "video", "twitch", "vimeo", "streaming").any(source::contains)) "video" else "music"
  }

  private fun resolveMediaButtons(fields: JSONObject): JSONArray {
    val buttons = JSONArray()
    if (!fields.optBoolean("customButtonsEnabled")) return buttons
    for (index in 1..2) {
      val label = fields.optString("button${index}Label").trim()
      val url = fields.optString("button${index}Url").trim()
      if (label.isNotBlank() && (url.startsWith("https://") || url.startsWith("http://"))) {
        buttons.put(JSONObject().put("label", label).put("url", url))
      }
    }
    return buttons
  }

  private fun bitmapDataUrl(bitmap: Bitmap): String {
    val scaled = Bitmap.createScaledBitmap(bitmap, 256, 256, true)
    val bytes = java.io.ByteArrayOutputStream().use { output ->
      scaled.compress(Bitmap.CompressFormat.PNG, 100, output)
      output.toByteArray()
    }
    if (scaled !== bitmap) scaled.recycle()
    return "data:image/png;base64,${Base64.encodeToString(bytes, Base64.NO_WRAP)}"
  }

  private fun loadIcon(source: String, packageName: String): Bitmap? {
    return try {
      if (source.startsWith("http://") || source.startsWith("https://")) {
        val connection = java.net.URL(source).openConnection().apply { connectTimeout = 2500; readTimeout = 2500 }
        connection.getInputStream().use { android.graphics.BitmapFactory.decodeStream(it) }
      } else if (packageName.isNotBlank()) {
        val drawable = packageManager.getApplicationIcon(packageName)
        val bitmap = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        bitmap
      } else null
    } catch (_: Exception) {
      null
    }
  }

  private fun buildNotification(title: String, content: String?, largeIcon: Bitmap?): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val contentIntent = launchIntent?.let {
      android.app.PendingIntent.getActivity(this, 0, it, android.app.PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag())
    }
    val stopIntent = Intent(this, KruztyDynamicsService::class.java).setAction(ACTION_STOP)
    val stopPending = android.app.PendingIntent.getService(this, 1, stopIntent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag())
    val restartIntent = Intent(this, KruztyDynamicsService::class.java).setAction(ACTION_RESTART)
    val restartPending = android.app.PendingIntent.getService(this, 2, restartIntent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag())
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .addAction(0, NativeStrings.text(this, "restart"), restartPending)
      .addAction(0, NativeStrings.text(this, "stop"), stopPending)
    if (contentIntent != null) builder.setContentIntent(contentIntent)
    if (!content.isNullOrBlank()) builder.setContentText(content)
    if (largeIcon != null) builder.setLargeIcon(largeIcon)
    return builder.build()
  }

  private fun immutableFlag(): Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) android.app.PendingIntent.FLAG_IMMUTABLE else 0

  private fun acquireWakeLock() {
    if (wakeLock != null) return
    runCatching {
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "KruztyDynamics:PresenceDetection").apply {
        setReferenceCounted(false)
        acquire()
      }
    }.onFailure { emitLog("warn", "Could not acquire wake lock: ${it.javaClass.simpleName}") }
  }

  private fun releaseWakeLock() {
    runCatching { wakeLock?.let { if (it.isHeld) it.release() } }
    wakeLock = null
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, NativeStrings.text(this, "channel"), NotificationManager.IMPORTANCE_LOW)
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  private fun logStartupConfiguration() {
    val profiles = config.optJSONArray("profiles") ?: JSONArray()
    val enabled = (0 until profiles.length()).count { profiles.optJSONObject(it)?.optBoolean("enabled") == true }
    val appFields = config.optJSONObject("appFields") ?: JSONObject()
    val mediaFields = config.optJSONObject("mediaFields") ?: JSONObject()
    val notificationFields = config.optJSONObject("notificationFields") ?: JSONObject()
    val appConfig = config.optJSONObject("appConfig") ?: JSONObject()
    val mediaConfig = config.optJSONObject("mediaConfig") ?: JSONObject()
    val settings = config.optJSONObject("appSettings") ?: JSONObject()
    emitLog("info", "Service configuration loaded: enabledProfiles=$enabled totalProfiles=${profiles.length()} mediaEnabled=${mediaConfig.optBoolean("enabled", true)} mediaScope=${mediaConfig.optString("mediaScope", "all")} mediaPriority=${mediaConfig.optString("priorityMode", "priority-media")} activityType=${activityTypeName(settings.optInt("globalActivityType", 0))} activityStatus=${settings.optString("globalActivityStatus", "online")} accountSelected=${settings.optString("activeAccountId").isNotBlank()}")
    emitLog("info", "App presence config: outsidePolicy=${appConfig.optString("outsidePolicy", "freeze")} timestampStrategy=${appConfig.optString("timestampStrategy", "persistent")} fields=${appFields.toSafeTemplateSummary()}")
    emitLog("info", "Media presence config: enabled=${mediaConfig.optBoolean("enabled", true)} priority=${mediaConfig.optString("priorityMode", "priority-media")} pausedResolution=${mediaConfig.optString("pausedResolution", "show-paused")} activityTypeMode=${mediaConfig.optString("activityTypeMode", "auto-adaptive")} fields=${mediaFields.toSafeTemplateSummary()}")
    emitLog("info", "Notification projection config: fields=${notificationFields.toSafeTemplateSummary()}")
  }

  private fun formatDetectedState(state: JSONObject): String {
    val domain = state.optString("domain")
    val packageName = state.optString("packageName")
    val profiles = config.optJSONArray("profiles") ?: JSONArray()
    val profile = (0 until profiles.length()).mapNotNull { profiles.optJSONObject(it) }
      .firstOrNull { it.optString("packageName") == packageName }
    val cached = state.optString("iconUrl").startsWith("http")
    if (domain == "media") {
      return "Media detected: title='${state.optString("title")}' artist='${state.optString("artist")}' album='${state.optString("album")}' appName='${state.optString("appName")}' packageName='$packageName' mediaType=${state.optString("mediaType")} playbackState=${state.optString("playbackState")} resolvedImageCached=$cached resolvedImageUrl='${state.optString("iconUrl")}' mediaArtCached=${state.optString("mediaImageUrl").startsWith("http")} mediaArtUrl='${state.optString("mediaImageUrl")}' appIconCached=${state.optString("appImageUrl").startsWith("http")} appIconUrl='${state.optString("appImageUrl")}' titleHeader='${state.optString("title")}' details='${state.optString("details")}' state='${state.optString("state")}' bigText='${state.optString("bigText")}'"
    }
    val profileSummary = profile?.let {
      "enabled=${it.optBoolean("enabled")},projectedName='${it.optString("projectedName")}',customDetailsEnabled=${it.optBoolean("customDetailsEnabled")},customDetails='${it.optString("customDetails")}',customState='${it.optString("customState")}',activityType=${it.optString("activityType")},activityStatus=${it.optString("activityStatus")},platform=${it.optString("platform")},customIcon=${it.optString("iconOverride").isNotBlank()}"
    } ?: "missing"
    return "App detected: systemName='${state.optString("appName")}' projectedName='${state.optString("appName")}' titleHeader='${state.optString("title")}' packageName='$packageName' profile={$profileSummary} imageCached=$cached imageUrl='${state.optString("iconUrl")}' details='${state.optString("details")}' state='${state.optString("state")}' bigText='${state.optString("bigText")}' activityType=${activityTypeName(state.optInt("activityType", 0))} discordStatus=${state.optString("discordStatus")} platform='${state.optString("platform")}'"
  }

  private fun JSONObject.toSafeTemplateSummary(): String = keys().asSequence()
    .filter { it !in setOf("button1Url", "button2Url") }
    .joinToString(",", "{", "}") { key -> "$key='${optString(key).take(120)}'" }

  private fun emitLog(level: String, message: String) {
    val safeMessage = message
      .replace(Regex("(?i)(api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|client[_-]?secret)([=:\\s]+)[^\\s,;]+")) { match ->
        "${match.groupValues[1]}${match.groupValues[2]}[REDACTED]"
      }
      .replace(Regex("(?i)([?&](?:key|api_key|access_token|refresh_token)=)[^&#\\s]+")) { match -> "${match.groupValues[1]}[REDACTED]" }
      .replace(Regex("(?i)Bearer\\s+[A-Za-z0-9._-]{20,}"), "Bearer [REDACTED]")
      .replace(Regex("[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{6,}\\.[A-Za-z0-9_-]{20,}"), "[REDACTED]")
    when (level.lowercase()) {
      "error" -> Log.e("KruztyDynamics", safeMessage)
      "warn" -> Log.w("KruztyDynamics", safeMessage)
      else -> Log.i("KruztyDynamics", safeMessage)
    }
    MainActivity.dispatchServiceEvent("dynamicsLog", JSONObject().put("level", level).put("message", safeMessage))
  }

  companion object {
    const val ACTION_START = "seiraneko.kruztydynamics.START"
    const val ACTION_STOP = "seiraneko.kruztydynamics.STOP"
    const val ACTION_RESTART = "seiraneko.kruztydynamics.RESTART"
    const val EXTRA_CONFIG = "config"
    const val EXTRA_SHOW_SHORTCUT_TOAST = "show_shortcut_toast"
    private const val CHANNEL_ID = "kruzty_dynamics_presence"
    private const val PREFS = "kd_presence_runtime"
    const val LAST_STATUS = "last_status"
    private const val NOTIFICATION_ID = 4201
    private const val POLL_INTERVAL_MS = 1800L
    private const val PAUSED_SESSION_MAX_AGE_MS = 90_000L
    @Volatile var isRunning = false
  }
}
