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
  return JSON.stringify({
    profiles: read('kd_app_profiles'),
    appConfig: read('kd_app_presence_config'),
    mediaConfig: read('kd_media_presence_config'),
    appFields: read('kd_app_field_templates'),
    mediaFields: read('kd_media_field_templates'),
    appSettings: read('kd_app_settings'),
    language: read('kd_app_settings').language || 'English (US)',
    imageLinks: read('kd_presence_image_links'),
    activeAccountId: activeAccountId || '',
  })
}
