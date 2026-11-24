import {
  normalizeAppFieldTemplates,
  normalizeMediaFieldTemplates,
  normalizeNotificationProjectionTemplates,
} from '../templates/fieldTemplates'

export function notifyServiceConfigChanged() {
  window.dispatchEvent(new Event('kd-presence-config-changed'))
}

export function collectPresenceConfig(activeAccountId?: string) {
  const read = (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}')
    } catch {
      return {}
    }
  }
  const profiles = read('kd_app_profiles')
  const appSettings = read('kd_app_settings')
  let migrated = false
  const normalizedProfiles = Array.isArray(profiles) ? profiles.map((profile: Record<string, unknown>) => {
    if (Number(profile.activityType) !== 1) return profile
    migrated = true
    return { ...profile, activityType: 'global', activityStatus: 'streaming' }
  }) : profiles
  if (Number(appSettings.globalActivityType) === 1) {
    appSettings.globalActivityType = 0
    appSettings.globalActivityStatus = 'streaming'
    migrated = true
  }
  if (migrated) {
    try {
      localStorage.setItem('kd_app_profiles', JSON.stringify(normalizedProfiles))
      localStorage.setItem('kd_app_settings', JSON.stringify(appSettings))
    } catch {
      // Continue with migrated in-memory configuration if storage is unavailable.
    }
  }
  return JSON.stringify({
    profiles: normalizedProfiles,
    appConfig: read('kd_app_presence_config'),
    mediaConfig: read('kd_media_presence_config'),
    appFields: normalizeAppFieldTemplates(read('kd_app_field_templates')),
    mediaFields: normalizeMediaFieldTemplates(read('kd_media_field_templates')),
    notificationFields: normalizeNotificationProjectionTemplates(read('kd_notification_field_templates')),
    appSettings,
    language: appSettings.language || 'English (US)',
    imageLinks: read('kd_presence_image_links'),
    activeAccountId: activeAccountId || '',
  })
}
