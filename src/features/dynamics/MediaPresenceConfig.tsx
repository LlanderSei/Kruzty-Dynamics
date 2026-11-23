import React, { useState, useEffect } from 'react'
import { ArrowLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { Switch } from '../../components/Switch'
import { useBackHandler } from '../navigation/useBackHandler'
import type {
  PriorityMode,
  MediaDetectionScope,
  MediaActivityTypeMode,
  PausedMediaResolution,
} from '../../types'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'
import { useTranslation } from '../../i18n/useTranslation'

interface MediaPresenceConfigProps {
  onBack: () => void
  onNavigateToStatusFields: () => void
}

const MEDIA_CONFIG_STORAGE_KEY = 'kd_media_presence_config'

export const MediaPresenceConfig: React.FC<MediaPresenceConfigProps> = ({
  onBack,
  onNavigateToStatusFields,
}) => {
  const { t } = useTranslation()
  const [priorityMode, setPriorityMode] = useState<PriorityMode>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_CONFIG_STORAGE_KEY)
      if (saved) return JSON.parse(saved).priorityMode || 'priority-media'
    } catch {}
    return 'priority-media'
  })

  const [mediaScope, setMediaScope] = useState<MediaDetectionScope>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_CONFIG_STORAGE_KEY)
      if (saved) return JSON.parse(saved).mediaScope || 'all'
    } catch {}
    return 'all'
  })

  const [activityTypeMode, setActivityTypeMode] = useState<MediaActivityTypeMode>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_CONFIG_STORAGE_KEY)
      if (saved) return JSON.parse(saved).activityTypeMode || 'auto-adaptive'
    } catch {}
    return 'auto-adaptive'
  })

  const [timeRemaining, setTimeRemaining] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_CONFIG_STORAGE_KEY)
      if (saved) {
        const val = JSON.parse(saved).timeRemaining
        if (typeof val === 'boolean') return val
      }
    } catch {}
    return true
  })

  const [pausedResolution, setPausedResolution] = useState<PausedMediaResolution>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_CONFIG_STORAGE_KEY)
      if (saved) return JSON.parse(saved).pausedResolution || 'show-paused'
    } catch {}
    return 'show-paused'
  })

  useEffect(() => {
    try {
      localStorage.setItem(
        MEDIA_CONFIG_STORAGE_KEY,
        JSON.stringify({
          priorityMode,
          mediaScope,
          activityTypeMode,
          timeRemaining,
          pausedResolution,
        })
      )
      notifyServiceConfigChanged()
    } catch {}
  }, [priorityMode, mediaScope, activityTypeMode, timeRemaining, pausedResolution])

  const [helpModal, setHelpModal] = useState<'priority' | 'paused' | null>(null)

  useBackHandler(onBack)

  return (
    <div
      className="h-screen w-screen flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-base)',
      }}
    >
      {/* Header */}
      <header
        className="shrink-0 px-4 pb-3 border-b z-20 backdrop-blur-md flex items-center gap-3"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-base)',
          }}
          aria-label={t.configFields.back}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{t.mediaPresence.title}</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t.mediaPresence.subtitle}
          </p>
        </div>
      </header>

      {/* Body: Scrollable Column */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative">
        <div className="max-w-xl w-full mx-auto p-4 space-y-3 pb-24">
          {/* Option 1: Media Priority */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">{t.mediaPresence.priority}</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.mediaPresence.priorityDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('priority')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title={t.mediaPresence.priorityHelp}
                aria-label={t.mediaPresence.priorityHelp}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={priorityMode}
              onChange={e => setPriorityMode(e.target.value as PriorityMode)}
              fullWidth={true}
            >
              <option value="priority-media">{t.mediaPresence.priorityPlaying}</option>
              <option value="switches-between">{t.mediaPresence.switchesBetween}</option>
            </Select>
          </div>

          {/* Option 2: Media Detection Scope */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div>
              <span className="text-xs font-bold block">{t.mediaPresence.scope}</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {t.mediaPresence.scopeDesc}
              </p>
            </div>

            <Select
              value={mediaScope}
              onChange={e => setMediaScope(e.target.value as MediaDetectionScope)}
              fullWidth={true}
            >
              <option value="all">{t.mediaPresence.allSessions}</option>
              <option value="enabled-only">{t.mediaPresence.enabledAppsOnly}</option>
            </Select>
          </div>

          {/* Option 3: Media Type Resolution */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div>
              <span className="text-xs font-bold block">{t.mediaPresence.typeResolution}</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {t.mediaPresence.typeResolutionDesc}
              </p>
            </div>

            <Select
              value={activityTypeMode}
              onChange={e => setActivityTypeMode(e.target.value as MediaActivityTypeMode)}
              fullWidth={true}
            >
              <option value="auto-adaptive">{t.mediaPresence.autoAdaptive}</option>
              <option value="app-profile-override">{t.mediaPresence.profileOverride}</option>
            </Select>
          </div>

          {/* Option 4: Time Remaining */}
          <div
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{t.mediaPresence.timeRemaining}</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {timeRemaining
                  ? t.mediaPresence.timeRemainingDesc
                  : t.mediaPresence.appTimestamp}
              </p>
            </div>

            <div className="shrink-0">
              <Switch
                checked={timeRemaining}
                onChange={setTimeRemaining}
                aria-label={t.mediaPresence.timeRemaining}
              />
            </div>
          </div>

          {/* Option 5: Paused Media Resolution */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">{t.mediaPresence.pausedResolution}</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.mediaPresence.pausedDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('paused')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title={t.mediaPresence.pausedHelp}
                aria-label={t.mediaPresence.pausedHelp}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={pausedResolution}
              onChange={e => setPausedResolution(e.target.value as PausedMediaResolution)}
              fullWidth={true}
            >
              <option value="show-paused">{t.mediaPresence.showPaused}</option>
              <option value="fallback-app">{t.mediaPresence.fallbackApp}</option>
              <option value="hide-status">{t.mediaPresence.hidePaused}</option>
            </Select>
          </div>

          {/* Link 6: Status Field Configuration */}
          <div
            onClick={onNavigateToStatusFields}
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{t.mediaPresence.statusFields}</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.mediaPresence.statusFieldsDesc}
              </p>
            </div>
            <div className="p-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal: Media Priority Strategy */}
      <Modal
        isOpen={helpModal === 'priority'}
        onClose={() => setHelpModal(null)}
        title={t.mediaPresence.priorityStrategy}
        subtitle={t.mediaPresence.priorityStrategyDesc}
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            {t.appPresence.understood}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            <strong>{t.mediaPresence.priorityPlaying}:</strong> {t.mediaPresence.priorityHelpText}
          </p>
          <p>
            <strong>{t.mediaPresence.switchesBetween}:</strong> {t.mediaPresence.switchHelpText}
          </p>
        </div>
      </Modal>

      {/* Help Modal: Paused Media Resolution */}
      <Modal
        isOpen={helpModal === 'paused'}
        onClose={() => setHelpModal(null)}
        title={t.mediaPresence.pausedResolution}
        subtitle={t.mediaPresence.pausedOptions}
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            {t.appPresence.understood}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            <strong>{t.mediaPresence.showPaused}:</strong> {t.mediaPresence.showPausedHelp}
          </p>
          <p>
            <strong>{t.mediaPresence.fallbackApp}:</strong> {t.mediaPresence.fallbackHelp}
          </p>
          <p>
            <strong>{t.mediaPresence.hidePaused}:</strong> {t.mediaPresence.hidePausedHelp}
          </p>
        </div>
      </Modal>
    </div>
  )
}
