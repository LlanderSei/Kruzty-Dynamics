import { useState, useEffect } from 'react'
import type { ActivityType, DiscordStatus } from '../../types'

const SETTINGS_STORAGE_KEY = 'kd_app_settings'
const IMAGE_CACHE_KEY = 'kd_asset_cache'

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

  const [cachedImageCount, setCachedImageCount] = useState<number>(() => {
    try {
      const cached = localStorage.getItem(IMAGE_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        return Array.isArray(parsed) ? parsed.length : 0
      }
    } catch {
      // Fallback
    }
    return 14 // Demo initial count if empty
  })

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage unavailable
    }
  }, [settings])

  const setLanguage = (language: string) => {
    setSettings(prev => ({ ...prev, language }))
  }

  const setCustomImgbbKey = (customImgbbKey: string) => {
    setSettings(prev => ({ ...prev, customImgbbKey: customImgbbKey.trim() }))
  }

  const setCustomDiscordAppId = (customDiscordAppId: string) => {
    setSettings(prev => ({ ...prev, customDiscordAppId: customDiscordAppId.trim() }))
  }

  const setGlobalActivityType = (globalActivityType: ActivityType) => {
    setSettings(prev => ({ ...prev, globalActivityType }))
  }

  const setGlobalActivityStatus = (globalActivityStatus: DiscordStatus) => {
    setSettings(prev => ({ ...prev, globalActivityStatus }))
  }

  const clearImageCache = () => {
    try {
      localStorage.removeItem(IMAGE_CACHE_KEY)
      setCachedImageCount(0)
    } catch {
      // Fallback
    }
  }

  return {
    settings,
    cachedImageCount,
    setLanguage,
    setCustomImgbbKey,
    setCustomDiscordAppId,
    setGlobalActivityType,
    setGlobalActivityStatus,
    clearImageCache,
  }
}
