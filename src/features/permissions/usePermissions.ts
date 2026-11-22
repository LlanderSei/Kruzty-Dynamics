import { useState, useEffect, useCallback } from 'react'
import type { PermissionState } from '../../types'

declare global {
  interface Window {
    AndroidNativeBridge?: {
      setStatusBarTheme?: (mode: string) => void
      setCanGoBack?: (canGoBack: boolean) => void
      openExternalUrl?: (url: string) => void
      checkAllPermissions?: () => string
      requestPermission?: (key: string) => void
      openDiscordLoginPortal?: () => void
      removeDiscordSocialAccount?: (accountId: string) => void
    }
  }
}

const PERMISSIONS_STORAGE_KEY = 'kd_permissions_state'

const DEFAULT_PERMISSIONS: PermissionState = {
  usageStats: false,
  notificationListener: false,
  postNotifications: false,
  batteryOptimizationsIgnored: false,
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>(() => {
    try {
      const saved = localStorage.getItem(PERMISSIONS_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_PERMISSIONS
  })

  // Synchronize with native Android system
  const syncWithNative = useCallback(() => {
    try {
      if (window.AndroidNativeBridge?.checkAllPermissions) {
        const raw = window.AndroidNativeBridge.checkAllPermissions()
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PermissionState>
          setPermissions(prev => ({
            ...prev,
            ...parsed,
          }))
          return
        }
      }
    } catch (e) {
      console.warn('Failed to query native permissions:', e)
    }
  }, [])

  useEffect(() => {
    syncWithNative()

    const handleUpdate = () => {
      syncWithNative()
    }

    window.addEventListener('androidPermissionsUpdated', handleUpdate)
    window.addEventListener('focus', handleUpdate)
    document.addEventListener('visibilitychange', handleUpdate)

    return () => {
      window.removeEventListener('androidPermissionsUpdated', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
      document.removeEventListener('visibilitychange', handleUpdate)
    }
  }, [syncWithNative])

  useEffect(() => {
    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions))
    } catch {}
  }, [permissions])

  const setPermission = (key: keyof PermissionState, granted: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: granted,
    }))
  }

  const requestPermission = async (key: keyof PermissionState) => {
    try {
      if (window.AndroidNativeBridge?.requestPermission) {
        window.AndroidNativeBridge.requestPermission(key)
        return
      }

      // Fallback intent launch via openExternalUrl if bridge method is missing
      const intentMap: Record<keyof PermissionState, string> = {
        usageStats: 'intent:#Intent;action=android.settings.USAGE_ACCESS_SETTINGS;end',
        notificationListener: 'intent:#Intent;action=android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS;end',
        batteryOptimizationsIgnored: 'intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end',
        postNotifications: 'intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=seiraneko.kruztydynamics;end',
      }

      if (window.AndroidNativeBridge?.openExternalUrl && intentMap[key]) {
        window.AndroidNativeBridge.openExternalUrl(intentMap[key])
        return
      }

      // In browser simulation
      setPermission(key, true)
    } catch (err) {
      console.error(`Failed to request permission: ${key}`, err)
    }
  }

  const allCrucialGranted = Boolean(permissions.usageStats && permissions.notificationListener)

  return {
    permissions,
    setPermission,
    requestPermission,
    refreshPermissions: syncWithNative,
    allCrucialGranted,
  }
}
