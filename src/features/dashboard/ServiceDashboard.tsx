import React, { useEffect, useState } from 'react'
import {
  LayoutGrid,
  FileEdit,
  SlidersHorizontal,
  PowerOff,
  Radio,
  ShieldCheck,
} from 'lucide-react'
import { Switch } from '../../components/Switch'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { usePermissions } from '../permissions/usePermissions'

const SERVICE_STATE_STORAGE_KEY = 'kd_presence_service_enabled'

interface ServiceDashboardProps {
  onNavigateToCatalogue?: () => void
  onNavigateToAppStatusFields?: () => void
  onNavigateToAppPresenceConfig?: () => void
  onNavigateToMediaStatusFields?: () => void
  onNavigateToMediaPresenceConfig?: () => void
}

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  onNavigateToCatalogue,
  onNavigateToAppStatusFields,
  onNavigateToAppPresenceConfig,
  onNavigateToMediaStatusFields,
  onNavigateToMediaPresenceConfig,
}) => {
  const { permissions, requestPermission } = usePermissions()
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [isServiceEnabled, setIsServiceEnabled] = useState(() => {
    try {
      return localStorage.getItem(SERVICE_STATE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SERVICE_STATE_STORAGE_KEY, String(isServiceEnabled))
    } catch {
      // Keep the service toggle usable for this session if storage is unavailable.
    }
  }, [isServiceEnabled])

  useEffect(() => {
    const hasRequiredPermissions =
      permissions.usageStats && permissions.notificationListener && permissions.postNotifications
    if (isServiceEnabled && !hasRequiredPermissions) {
      setIsServiceEnabled(false)
      setShowPermissionsModal(true)
    }
  }, [isServiceEnabled, permissions])

  const handleToggleService = (nextState: boolean) => {
    if (nextState && !(permissions.usageStats && permissions.notificationListener && permissions.postNotifications)) {
      setShowPermissionsModal(true)
      return
    }
    setIsServiceEnabled(nextState)
  }

  const missingPermissions = [
    {
      key: 'usageStats' as const,
      label: 'Usage Access',
      description: 'Required to detect which app is currently in the foreground.',
    },
    {
      key: 'notificationListener' as const,
      label: 'Notification Access',
      description: 'Required to detect media playback and its metadata.',
    },
    {
      key: 'postNotifications' as const,
      label: 'Foreground Service Notifications',
      description: 'Allows Android to show the service notification while it runs.',
    },
  ].filter(permission => !permissions[permission.key])

  return (
    <div className="space-y-4 pb-4 select-none">
      {/* ======================================================== */}
      {/* UPPER SECTION: Master Service Card + Presence Hub Cards */}
      {/* ======================================================== */}

      {/* 1. Master Service Card */}
      <div
        onClick={() => handleToggleService(!isServiceEnabled)}
        className="w-full text-left p-4 rounded-2xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99] flex items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: isServiceEnabled ? 'var(--color-accent-border)' : 'var(--color-border)',
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight">Kruzty Dynamics Service</h2>
            {isServiceEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <p
            className="text-xs mt-1 font-medium transition-colors"
            style={{
              color: isServiceEnabled ? '#22c55e' : 'var(--color-text-muted)',
            }}
          >
            {isServiceEnabled ? 'Service is enabled locally.' : 'Service not started.'}
          </p>
        </div>

        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          <Switch
            checked={isServiceEnabled}
            onChange={handleToggleService}
            aria-label="Toggle Kruzty Dynamics Service"
          />
        </div>
      </div>

      {/* 2. Presence Hub Cards (2 columns / cards) */}
      <div className="space-y-2.5">
        {/* Card 1: Application Presence */}
        <div
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-xs font-bold tracking-tight">Application Presence</h3>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              Configure app profiles for local presence detection
            </p>
          </div>

          {/* 3 Right-anchored Icon Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateToCatalogue}
              className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              title="Application Catalogue"
              aria-label="Application Catalogue"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNavigateToAppStatusFields}
              className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              title="Status Field Config"
              aria-label="Status Field Config"
            >
              <FileEdit className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNavigateToAppPresenceConfig}
              className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              title="Presence Configuration"
              aria-label="Presence Configuration"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Media Presence */}
        <div
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-xs font-bold tracking-tight">Media Presence</h3>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              Configure media behavior and status templates
            </p>
          </div>

          {/* 2 Right-anchored Icon Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateToMediaStatusFields}
              className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              title="Status Field Config"
              aria-label="Status Field Config"
            >
              <FileEdit className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNavigateToMediaPresenceConfig}
              className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              title="Presence Configuration"
              aria-label="Presence Configuration"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state until app and media detection is connected. */}
      <div className="pt-2">
        {!isServiceEnabled ? (
          <div
            className="p-8 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2.5"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <PowerOff className="w-5 h-5" />
            </div>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Service is stopped. Turn it on to enable local presence detection when it becomes available.
            </p>
          </div>
        ) : (
          <div
            className="p-6 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              <Radio className="w-5 h-5" />
            </div>
            <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Service is enabled locally. App and media detection are not connected yet, so no activity is being projected.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title="Permissions required"
        subtitle="Grant these Android permissions before starting the service."
        footer={
          <Button size="sm" variant="outline" onClick={() => setShowPermissionsModal(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3">
          {missingPermissions.length === 0 ? (
            <div
              className="flex items-center gap-2 rounded-xl border p-3 text-xs text-emerald-400"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              All required permissions are granted. Turn on the service to continue.
            </div>
          ) : (
            missingPermissions.map(permission => (
              <div
                key={permission.key}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{permission.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {permission.description}
                  </p>
                </div>
                <Button size="sm" onClick={() => requestPermission(permission.key)}>
                  Grant
                </Button>
              </div>
            ))
          )}
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            After granting access in Android Settings, return here and enable the service.
          </p>
        </div>
      </Modal>

    </div>
  )
}
