import React, { useEffect, useState } from 'react'
import {
  LayoutGrid,
  FileEdit,
  SlidersHorizontal,
  PowerOff,
  Radio,
  ShieldCheck,
  Ellipsis,
  Gamepad2,
  Pause,
  Play,
  AppWindow,
  MonitorPlay,
  Music2,
} from 'lucide-react'
import { Switch } from '../../components/Switch'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { usePermissions } from '../permissions/usePermissions'
import { collectPresenceConfig } from './serviceConfig'
import { useTranslation } from '../../i18n/useTranslation'

const SERVICE_STATE_STORAGE_KEY = 'kd_presence_service_enabled'

interface ServiceDashboardProps {
  activeAccountId?: string
  onNavigateToCatalogue?: () => void
  onNavigateToAppStatusFields?: () => void
  onNavigateToAppPresenceConfig?: () => void
  onNavigateToMediaStatusFields?: () => void
  onNavigateToMediaPresenceConfig?: () => void
  status?: {
    active?: boolean
    title?: string
    details?: string
    state?: string
    domain?: string
    activityType?: number
    playbackState?: string
    appName?: string
    mediaType?: string
    mediaPositionMs?: number
    mediaDurationMs?: number
    mediaUpdatedAt?: number
    playbackRate?: number
    sessionStartedAt?: number
    smallText?: string
    smallImage?: string
    bigText?: string
    bigImage?: string
    iconUrl?: string
    iconData?: string
    buttons?: Array<{ label: string; url: string }>
  } | null
}

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  activeAccountId,
  onNavigateToCatalogue,
  onNavigateToAppStatusFields,
  onNavigateToAppPresenceConfig,
  onNavigateToMediaStatusFields,
  onNavigateToMediaPresenceConfig,
  status,
}) => {
  const { t } = useTranslation()
  const { permissions, requestPermission } = usePermissions()
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [isServiceEnabled, setIsServiceEnabled] = useState(() => {
    try {
      return localStorage.getItem(SERVICE_STATE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const bridge = (window as Window & { AndroidNativeBridge?: { isPresenceServiceRunning?: () => boolean } }).AndroidNativeBridge
    if (bridge?.isPresenceServiceRunning) setIsServiceEnabled(bridge.isPresenceServiceRunning())
  }, [])

  useEffect(() => {
    const onStarted = () => setIsServiceEnabled(true)
    const onStopped = () => setIsServiceEnabled(false)
    window.addEventListener('dynamicsServiceStarted', onStarted)
    window.addEventListener('dynamicsServiceStopped', onStopped)
    return () => {
      window.removeEventListener('dynamicsServiceStarted', onStarted)
      window.removeEventListener('dynamicsServiceStopped', onStopped)
    }
  }, [])

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
      const bridge = (window as Window & { AndroidNativeBridge?: { stopPresenceService?: () => void } }).AndroidNativeBridge
      bridge?.stopPresenceService?.()
      setIsServiceEnabled(false)
      setShowPermissionsModal(true)
    }
  }, [isServiceEnabled, permissions])

  const handleToggleService = (nextState: boolean) => {
    if (nextState && !(permissions.usageStats && permissions.notificationListener && permissions.postNotifications)) {
      setShowPermissionsModal(true)
      return
    }
    const bridge = (window as Window & { AndroidNativeBridge?: { startPresenceService?: (config: string) => void; stopPresenceService?: () => void } }).AndroidNativeBridge
    try {
      if (nextState) {
        bridge?.startPresenceService?.(collectPresenceConfig(activeAccountId))
      } else {
        bridge?.stopPresenceService?.()
      }
      setIsServiceEnabled(nextState)
    } catch {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: t.permissions.serviceStartError } }))
    }
  }

  const missingPermissions = [
    {
      key: 'usageStats' as const,
      label: t.permissions.usageTitle,
      description: t.permissions.usageGuardDescription,
    },
    {
      key: 'notificationListener' as const,
      label: t.permissions.notificationTitle,
      description: t.permissions.notificationGuardDescription,
    },
    {
      key: 'postNotifications' as const,
      label: t.permissions.foregroundGuardTitle,
      description: t.permissions.foregroundGuardDescription,
    },
  ].filter(permission => !permissions[permission.key])

  const activityTypeLabels: Record<number, string> = {
    0: 'Playing',
    2: 'Listening',
    3: 'Watching',
    5: 'Competing in',
  }
  const hasActivity = Boolean(isServiceEnabled && status?.active !== false && status?.domain && status.domain !== 'idle' && status?.title)
  const imageSource = status?.bigImage?.startsWith('https://') || status?.bigImage?.startsWith('http://')
    ? status.bigImage
    : status?.iconData
  const smallImageSource = status?.smallImage?.startsWith('https://') || status?.smallImage?.startsWith('http://') || status?.smallImage?.startsWith('data:image/')
    ? status.smallImage
    : null
  const MediaAssetIcon = status?.smallImage === 'mediaplay'
    ? Play
    : status?.smallImage === 'mediapause'
      ? Pause
      : null
  const ActivityIcon = status?.domain === 'media'
    ? (status.mediaType === 'video' ? MonitorPlay : Music2)
    : status?.domain === 'app' ? Gamepad2 : AppWindow
  const mediaHeader = status?.mediaType === 'video' ? 'Watching' : 'Listening to'
  const elapsedMediaPosition = Math.max(0, (status?.mediaPositionMs || 0) + (
    status?.playbackState === 'Playing' && status.mediaUpdatedAt
      ? (now - status.mediaUpdatedAt) * (status.playbackRate || 1)
      : 0
  ))
  const mediaDuration = Math.max(0, status?.mediaDurationMs || 0)
  const boundedMediaPosition = mediaDuration > 0 ? Math.min(elapsedMediaPosition, mediaDuration) : elapsedMediaPosition
  const progressPercent = mediaDuration > 0 ? Math.min(100, (boundedMediaPosition / mediaDuration) * 100) : 0
  const formatClock = (value: number) => {
    const seconds = Math.floor(Math.max(0, value) / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainder = seconds % 60
    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }
  const sessionElapsed = status?.sessionStartedAt ? Math.max(0, now - status.sessionStartedAt) : 0
  const openPresenceButton = (url: string) => {
    const bridge = (window as Window & { AndroidNativeBridge?: { openExternalUrl?: (value: string) => void } }).AndroidNativeBridge
    if (bridge?.openExternalUrl) bridge.openExternalUrl(url)
    else window.open(url, '_blank', 'noopener,noreferrer')
  }

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
            <h2 className="text-sm font-bold tracking-tight">{t.service.title}</h2>
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
            {isServiceEnabled ? t.service.running : t.service.stopped}
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
            <h3 className="text-xs font-bold tracking-tight">{t.service.applicationPresence}</h3>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              {t.service.appDescription}
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
              title={t.service.applicationCatalogue}
              aria-label={t.service.applicationCatalogue}
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
              title={t.service.statusFieldConfig}
              aria-label={t.service.statusFieldConfig}
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
              title={t.service.presenceConfiguration}
              aria-label={t.service.presenceConfiguration}
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
            <h3 className="text-xs font-bold tracking-tight">{t.service.mediaPresence}</h3>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
              {t.service.mediaDescription}
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
              title={t.service.statusFieldConfig}
              aria-label={t.service.statusFieldConfig}
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
              title={t.service.presenceConfiguration}
              aria-label={t.service.presenceConfiguration}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live detected presence preview */}
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
              {t.service.stoppedDescription}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border p-4 text-left" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}>
            <div className="mb-3 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>{hasActivity
                ? status?.domain === 'media'
                  ? `${mediaHeader} ${status.appName || 'Media'}`
                  : activityTypeLabels[status?.activityType ?? 0] || 'Playing'
                : 'Activity Preview'}</span>
              <Ellipsis className="h-4 w-4" />
            </div>
            {hasActivity ? (
              <>
              <div className="flex items-center gap-3">
                <div className="relative h-24 w-24 shrink-0">
                  {imageSource ? (
                    <img src={imageSource} alt="Activity artwork" title={status?.bigText || undefined} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}><ActivityIcon className="h-8 w-8" /></div>
                  )}
                  {(smallImageSource || MediaAssetIcon) && (
                    <div title={status?.smallImage || undefined} className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2" style={{ borderColor: 'var(--color-bg-surface)', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-accent)' }}>
                      {smallImageSource
                        ? <img src={smallImageSource} alt="" title={status?.smallText || undefined} className="h-full w-full object-cover" />
                        : MediaAssetIcon && <MediaAssetIcon className="h-3.5 w-3.5" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 space-y-0.5 text-[13px] leading-[1.35]" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="break-words font-semibold" style={{ color: 'var(--color-text-base)' }}>{status?.title}</div>
                  {status?.details && <div className="break-words">{status.details}</div>}
                  {status?.state && <div className="break-words">{status.state}</div>}
                  {status?.domain === 'app' && status.sessionStartedAt && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums text-emerald-500">
                      <Gamepad2 className="h-4 w-4" />
                      <span>{formatClock(sessionElapsed)}</span>
                    </div>
                  )}
                  {status?.domain === 'media' && status.playbackState !== 'Playing' && status.sessionStartedAt && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                      <ActivityIcon className="h-4 w-4 shrink-0" />
                      <span>{formatClock(sessionElapsed)}</span>
                    </div>
                  )}
                </div>
              </div>
              {status?.domain === 'media' && (
                status.playbackState === 'Playing' ? (
                  <div className="mt-3 flex items-center gap-2 text-[11px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{formatClock(boundedMediaPosition)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${progressPercent}%`, backgroundColor: 'var(--color-accent)' }} />
                    </div>
                    <span>{mediaDuration > 0 ? formatClock(mediaDuration) : '--:--'}</span>
                  </div>
                ) : null
              )}
              {!!status?.buttons?.length && (
                <div className="mt-3 flex w-full gap-2">
                  {status.buttons.filter(button => /^https?:\/\//i.test(button.url)).map((button, index) => (
                    <button key={`${button.url}-${index}`} type="button" onClick={() => openPresenceButton(button.url)} className="min-w-0 flex-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:opacity-80" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-base)' }}>{button.label}</button>
                  ))}
                </div>
              )}
              </>
            ) : (
              <div className="flex items-center gap-3 py-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-bg-elevated)' }}><Radio className="h-7 w-7" /></div>
                <span>{t.service.noPresence}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={t.permissions.requiredTitle}
        subtitle={t.permissions.requiredSubtitle}
        footer={
              <Button size="sm" variant="outline" onClick={() => setShowPermissionsModal(false)}>
            {t.permissions.done}
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
              {t.permissions.allGranted}
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
                  {t.permissions.grant}
                </Button>
              </div>
            ))
          )}
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t.permissions.returnHint}
          </p>
        </div>
      </Modal>

    </div>
  )
}
