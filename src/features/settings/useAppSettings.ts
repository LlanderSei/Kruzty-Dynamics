import { useState, useEffect } from 'react'
import type { ActivityType, DiscordStatus } from '../../types'

const SETTINGS_STORAGE_KEY = 'kd_app_settings'
const IMAGE_CACHE_KEY = 'kd_asset_cache'
const IMAGE_LINKS_KEY = 'kd_presence_image_links'
const APP_PROFILES_KEY = 'kd_app_profiles'
const IMAGE_CACHE_UPDATED_EVENT = 'kd-image-cache-updated'
const APP_SETTINGS_UPDATED_EVENT = 'kd-app-settings-updated'

interface ImageCacheSummary {
  total: number
  customIcons: number
}

function readImageCacheSummary(): ImageCacheSummary {
  const urls = new Set<string>()
  const customIconUrls = new Set<string>()
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY)
    const entries: unknown = cached ? JSON.parse(cached) : []
    if (Array.isArray(entries)) {
      for (const entry of entries as Array<Record<string, unknown>>) {
        if (typeof entry?.remoteUrl !== 'string' || !entry.remoteUrl) continue
        urls.add(entry.remoteUrl)
        if (entry.sourceType === 'custom_icon') customIconUrls.add(entry.remoteUrl)
      }
    }
  } catch {
    // Ignore invalid or unavailable storage.
  }

  try {
    const savedProfiles = localStorage.getItem(APP_PROFILES_KEY)
    const profiles: unknown = savedProfiles ? JSON.parse(savedProfiles) : []
    if (Array.isArray(profiles)) {
      for (const profile of profiles as Array<Record<string, unknown>>) {
        if (typeof profile?.iconOverride !== 'string' || !profile.iconOverride) continue
        urls.add(profile.iconOverride)
        customIconUrls.add(profile.iconOverride)
      }
    }
  } catch {
    // Ignore invalid or unavailable storage.
  }

  return { total: urls.size, customIcons: customIconUrls.size }
}

export interface AppSettings {
  language: string
  customImgbbKey: string
  customDiscordAppId: string
  globalActivityType: ActivityType
  globalActivityStatus: DiscordStatus
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'System Default',
  customImgbbKey: '',
  customDiscordAppId: '',
  globalActivityType: 0, // Playing
  globalActivityStatus: 'online',
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS
  })

  const [imageCacheSummary, setImageCacheSummary] = useState<ImageCacheSummary>(readImageCacheSummary)

  const updateSettings = (updater: (previous: AppSettings) => AppSettings) => {
    const next = updater(settings)
    setSettings(next)
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable
    }
    window.dispatchEvent(new CustomEvent<AppSettings>(APP_SETTINGS_UPDATED_EVENT, { detail: next }))
  }

  useEffect(() => {
    const refresh = () => setImageCacheSummary(readImageCacheSummary())
    const refreshSettings = (event?: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as AppSettings | undefined : undefined
      if (detail) {
        setSettings(detail)
        return
      }
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
      } catch {
        // Ignore invalid or unavailable storage.
      }
    }
    window.addEventListener(IMAGE_CACHE_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener(APP_SETTINGS_UPDATED_EVENT, refreshSettings)
    window.addEventListener('storage', refreshSettings)
    return () => {
      window.removeEventListener(IMAGE_CACHE_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener(APP_SETTINGS_UPDATED_EVENT, refreshSettings)
      window.removeEventListener('storage', refreshSettings)
    }
  }, [])

  useEffect(() => {
    window.dispatchEvent(new Event('kd-presence-config-changed'))
  }, [settings.globalActivityStatus])

  const setLanguage = (language: string) => {
    updateSettings(prev => ({ ...prev, language }))
  }

  const setCustomImgbbKey = (customImgbbKey: string) => {
    updateSettings(prev => ({ ...prev, customImgbbKey: customImgbbKey.trim() }))
  }

  const setCustomDiscordAppId = (customDiscordAppId: string) => {
    updateSettings(prev => ({ ...prev, customDiscordAppId: customDiscordAppId.trim() }))
  }

  const setGlobalActivityType = (globalActivityType: ActivityType) => {
    updateSettings(prev => ({ ...prev, globalActivityType }))
  }

  const setGlobalActivityStatus = (globalActivityStatus: DiscordStatus) => {
    updateSettings(prev => ({ ...prev, globalActivityStatus }))
  }

  const clearImageCache = (includeCustomIcons = false) => {
    try {
      const cached = localStorage.getItem(IMAGE_CACHE_KEY)
      const entries: unknown = cached ? JSON.parse(cached) : []
      const preservedEntries = !includeCustomIcons && Array.isArray(entries)
        ? (entries as Array<Record<string, unknown>>).filter(entry => entry.sourceType === 'custom_icon')
        : []
      if (preservedEntries.length > 0) {
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(preservedEntries))
      } else {
        localStorage.removeItem(IMAGE_CACHE_KEY)
      }

      if (includeCustomIcons) {
        const savedProfiles = localStorage.getItem(APP_PROFILES_KEY)
        const profiles: unknown = savedProfiles ? JSON.parse(savedProfiles) : []
        if (Array.isArray(profiles)) {
          localStorage.setItem(
            APP_PROFILES_KEY,
            JSON.stringify((profiles as Array<Record<string, unknown>>).map(profile => ({ ...profile, iconOverride: undefined })))
          )
        }
      }
      localStorage.removeItem(IMAGE_LINKS_KEY)
      setImageCacheSummary(readImageCacheSummary())
      window.dispatchEvent(new Event(IMAGE_CACHE_UPDATED_EVENT))
      window.dispatchEvent(new Event('kd-presence-config-changed'))
    } catch {
      // Fallback
    }
  }

  return {
    settings,
    cachedImageCount: imageCacheSummary.total,
    customIconCount: imageCacheSummary.customIcons,
    setLanguage,
    setCustomImgbbKey,
    setCustomDiscordAppId,
    setGlobalActivityType,
    setGlobalActivityStatus,
    clearImageCache,
  }
}
