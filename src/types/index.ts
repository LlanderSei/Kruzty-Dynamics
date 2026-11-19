export type ActivityType = 0 | 1 | 2 | 3 | 5 // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 5: Competing
export type MediaType = 'music' | 'video' | 'audio' | 'unknown'
export type PlaybackState = 'playing' | 'paused' | 'stopped' | 'buffering' | 'none'

export interface ActivityTimestamps {
  start?: number
  end?: number
}

export interface ActivityAssets {
  large_image?: string
  large_text?: string
  small_image?: string
  small_text?: string
}

export interface ActivityButton {
  label: string
  url: string
}

export interface DiscordActivity {
  name: string
  type: ActivityType
  details?: string
  state?: string
  timestamps?: ActivityTimestamps
  assets?: ActivityAssets
  buttons?: ActivityButton[]
}

export interface DiscordAccount {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  token: string
  isActive: boolean
}

export type OutsideAppBehavior = 'freeze' | 'custom' | 'drop'
export type AppTimestampMode = 'persistent' | 'reset' | 'custom'
export type PriorityMode = 'priority-media' | 'switches-between'
export type MediaDetectionScope = 'all' | 'enabled-only'

export type MediaActivityTypeMode = 'auto-adaptive' | 'app-profile-override' // auto-adaptive: 2 (Listening) for music/audio, 3 (Watching) for video

export interface CustomFallbackConfig {
  name: string
  details?: string
  state?: string
  largeImage?: string
  largeText?: string
}

export interface AppFieldTemplates {
  title: string
  line1?: string
  line2?: string
  smallText?: string
  smallImage?: string
  bigText?: string
  bigImage?: string
}

export interface MediaFieldTemplates {
  title: string
  line1?: string
  line2?: string
  smallText?: string
  smallImage?: string
  bigText?: string
  bigImage?: string
}

export interface DynamicsConfig {
  enabled: boolean
  priorityMode: PriorityMode
  mediaScope: MediaDetectionScope
  mediaActivityTypeMode: MediaActivityTypeMode
  outsideBehavior: OutsideAppBehavior
  customFallback?: CustomFallbackConfig
  timestampMode: AppTimestampMode
  customTimestampOffset?: number
  appFields: AppFieldTemplates
  mediaFields: MediaFieldTemplates
}

export interface AppProfile {
  packageName: string
  systemLabel: string
  projectedName: string
  iconOverride?: string
  activityType: ActivityType
  enabled: boolean
  isMediaApp?: boolean
}

export interface PermissionState {
  usageStats: boolean
  notificationListener: boolean // Special App Access > Notification Access
  postNotifications: boolean // Runtime notification permission (Android 13+)
  batteryOptimizationsIgnored: boolean
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  customAccentColor: string
}

export interface AssetCacheEntry {
  hash: string // SHA-256 of icon/art binary bytes
  sourceType: 'app_icon' | 'media_art' | 'custom_icon'
  remoteUrl: string // Uploaded ImgBB URL
  uploadedAt: number
}

export interface DynamicsStatus {
  active: boolean
  currentAccount?: DiscordAccount
  currentActivity?: DiscordActivity
  activeDomain: 'media' | 'app' | 'custom-fallback' | 'idle'
  detectedPackage?: string
  mediaPlaying?: boolean
  mediaType?: MediaType
  mediaDescription?: string
}
