package seiraneko.kruztydynamics

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class MediaNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    super.onNotificationPosted(sbn)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    super.onNotificationRemoved(sbn)
  }
}
