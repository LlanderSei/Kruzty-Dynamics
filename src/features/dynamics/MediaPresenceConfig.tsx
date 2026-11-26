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
          aria-label={t.subPages.buttons.back}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{t.subPages.media.presenceConfig.title}</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t.subPages.media.presenceConfig.subtitle}
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
                <span className="text-xs font-bold block">{t.subPages.media.presenceConfig.mediaPriority.title}</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.subPages.media.presenceConfig.mediaPriority.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('priority')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title={t.subPages.media.presenceConfig.mediaPriority.help}
                aria-label={t.subPages.media.presenceConfig.mediaPriority.help}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={priorityMode}
              onChange={e => setPriorityMode(e.target.value as PriorityMode)}
              fullWidth={true}
            >
              <option value="priority-media">{t.choices.mediaPriority.priorityPlaying}</option>
              <option value="switches-between">{t.choices.mediaPriority.switchesBetween}</option>
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
              <span className="text-xs font-bold block">{t.subPages.media.presenceConfig.mediaScope.title}</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {t.subPages.media.presenceConfig.mediaScope.desc}
              </p>
            </div>

            <Select
              value={mediaScope}
              onChange={e => setMediaScope(e.target.value as MediaDetectionScope)}
              fullWidth={true}
            >
              <option value="all">{t.choices.mediaScope.allSessions}</option>
              <option value="enabled-only">{t.choices.mediaScope.enabledAppsOnly}</option>
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
              <span className="text-xs font-bold block">{t.subPages.media.presenceConfig.typeResolution.title}</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {t.subPages.media.presenceConfig.typeResolution.desc}
              </p>
            </div>

            <Select
              value={activityTypeMode}
              onChange={e => setActivityTypeMode(e.target.value as MediaActivityTypeMode)}
              fullWidth={true}
            >
              <option value="auto-adaptive">{t.choices.typeResolution.autoAdaptive}</option>
              <option value="app-profile-override">{t.choices.typeResolution.profileOverride}</option>
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
              <span className="text-xs font-bold block">{t.subPages.media.presenceConfig.timeRemaining.title}</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {timeRemaining
                  ? t.subPages.media.presenceConfig.timeRemaining.desc
                  : t.subPages.media.presenceConfig.timeRemaining.appTimestamp}
              </p>
            </div>

            <div className="shrink-0">
              <Switch
                checked={timeRemaining}
                onChange={setTimeRemaining}
                aria-label={t.subPages.media.presenceConfig.timeRemaining.title}
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
                <span className="text-xs font-bold block">{t.subPages.media.presenceConfig.pausedResolution.title}</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.subPages.media.presenceConfig.pausedResolution.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('paused')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title={t.subPages.media.presenceConfig.pausedResolution.help}
                aria-label={t.subPages.media.presenceConfig.pausedResolution.help}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={pausedResolution}
              onChange={e => setPausedResolution(e.target.value as PausedMediaResolution)}
              fullWidth={true}
            >
              <option value="show-paused">{t.choices.pausedResolution.showPaused}</option>
              <option value="fallback-app">{t.choices.pausedResolution.fallbackApp}</option>
              <option value="hide-status">{t.choices.pausedResolution.hidePaused}</option>
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
              <span className="text-xs font-bold block">{t.subPages.media.presenceConfig.statusFieldConfig.title}</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.subPages.media.presenceConfig.statusFieldConfig.desc}
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
        title={t.subPages.media.presenceConfig.mediaPriority.modal.title}
        subtitle={t.subPages.media.presenceConfig.mediaPriority.modal.desc}
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            {t.buttons.understood}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            <strong>{t.choices.mediaPriority.priorityPlaying}:</strong> {t.subPages.media.presenceConfig.mediaPriority.modal.details.priorityPlaying}
          </p>
          <p>
            <strong>{t.choices.mediaPriority.switchesBetween}:</strong> {t.subPages.media.presenceConfig.mediaPriority.modal.details.switchesBetween}
          </p>
        </div>
      </Modal>

      {/* Help Modal: Paused Media Resolution */}
      <Modal
        isOpen={helpModal === 'paused'}
        onClose={() => setHelpModal(null)}
        title={t.subPages.media.presenceConfig.pausedResolution.title}
        subtitle={t.subPages.media.presenceConfig.pausedResolution.modal.desc}
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            {t.buttons.understood}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            <strong>{t.choices.pausedResolution.showPaused}:</strong> {t.subPages.media.presenceConfig.pausedResolution.modal.details.showPaused}
          </p>
          <p>
            <strong>{t.choices.pausedResolution.fallbackApp}:</strong> {t.subPages.media.presenceConfig.pausedResolution.modal.details.fallback}
          </p>
          <p>
            <strong>{t.choices.pausedResolution.hidePaused}:</strong> {t.subPages.media.presenceConfig.pausedResolution.modal.details.hidePaused}
          </p>
        </div>
      </Modal>
    </div>
  )
}
