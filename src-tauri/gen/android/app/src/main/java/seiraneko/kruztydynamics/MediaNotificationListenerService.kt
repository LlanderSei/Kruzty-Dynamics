package seiraneko.kruztydynamics

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.app.Notification
import android.os.Bundle
import android.text.TextUtils
import android.media.MediaMetadata
import java.util.concurrent.ConcurrentHashMap

class MediaNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    super.onNotificationPosted(sbn)
    if (sbn == null || sbn.packageName == packageName) return
    val extras = sbn.notification?.extras ?: Bundle.EMPTY
    if (!isMediaNotification(sbn.notification?.category, extras)) return
    val title = extras.text("android.title")
    val text = extras.text("android.text")
    val subText = extras.text("android.subText")
    val bigText = extras.text("android.bigText")
    notificationDetails[sbn.packageName] = NotificationDetails(
      title = title,
      text = text,
      subText = subText,
      bigText = bigText,
      durationMs = extras.getLong(MediaMetadata.METADATA_KEY_DURATION, 0L),
      postedAt = sbn.postTime,
      removedAt = 0L,
    )
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    super.onNotificationRemoved(sbn)
    if (sbn == null) return
    val extras = sbn.notification?.extras ?: Bundle.EMPTY
    if (!isMediaNotification(sbn.notification?.category, extras)) return
    val prior = notificationDetails[sbn.packageName] ?: NotificationDetails()
    notificationDetails[sbn.packageName] = prior.copy(removedAt = System.currentTimeMillis())
  }

  private fun Bundle.text(key: String): String? {
    val value = runCatching { getCharSequence(key)?.toString() }.getOrNull()
    return value?.takeIf { !TextUtils.isEmpty(it) }
  }

  private fun isMediaNotification(category: String?, extras: Bundle): Boolean {
    return category == Notification.CATEGORY_TRANSPORT ||
      extras.containsKey("android.mediaSession") ||
      extras.getString("android.template").orEmpty().contains("MediaStyle", ignoreCase = true)
  }

  data class NotificationDetails(
    val title: String? = null,
    val text: String? = null,
    val subText: String? = null,
    val bigText: String? = null,
    val durationMs: Long = 0L,
    val postedAt: Long = 0L,
    val removedAt: Long = 0L,
  )

  companion object {
    private val notificationDetails = ConcurrentHashMap<String, NotificationDetails>()

    fun getNotificationDetails(packageName: String): NotificationDetails? = notificationDetails[packageName]
  }
}
