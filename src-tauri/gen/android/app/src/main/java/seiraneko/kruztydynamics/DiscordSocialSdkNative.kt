package seiraneko.kruztydynamics

internal object DiscordSocialSdkNative {
  init {
    System.loadLibrary("discord_social_bridge")
  }

  external fun initialize(applicationId: Long)
  external fun connect(accessToken: String)
  external fun updatePresence(
    name: String,
    details: String,
    state: String,
    largeImage: String,
    largeText: String,
    smallImage: String,
    smallText: String,
    activityType: Int,
    startTimestamp: Long,
    endTimestamp: Long,
    buttons: Array<String>,
  )
  external fun clearPresence()
  external fun disconnect()
}
