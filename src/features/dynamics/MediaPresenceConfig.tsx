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

interface MediaPresenceConfigProps {
  onBack: () => void
  onNavigateToStatusFields: () => void
}

const MEDIA_CONFIG_STORAGE_KEY = 'kd_media_presence_config'

export const MediaPresenceConfig: React.FC<MediaPresenceConfigProps> = ({
  onBack,
  onNavigateToStatusFields,
}) => {
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
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">Media Presence Configuration</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Resolution priorities, timestamps, and playback states
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
                <span className="text-xs font-bold block">Media Priority</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  Controls whether media overrides gaming/app sessions
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('priority')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title="Priority Help"
                aria-label="Media Priority Help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={priorityMode}
              onChange={e => setPriorityMode(e.target.value as PriorityMode)}
              fullWidth={true}
            >
              <option value="priority-media">Priority Playing Media (Default)</option>
              <option value="switches-between">Switches Between</option>
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
              <span className="text-xs font-bold block">Media Detection Scope</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                Filter which apps trigger media rich presence
              </p>
            </div>

            <Select
              value={mediaScope}
              onChange={e => setMediaScope(e.target.value as MediaDetectionScope)}
              fullWidth={true}
            >
              <option value="all">All Media Sessions (Default)</option>
              <option value="enabled-only">Only Enabled Apps</option>
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
              <span className="text-xs font-bold block">Media Type Resolution</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                How listening vs watching activities are classified
              </p>
            </div>

            <Select
              value={activityTypeMode}
              onChange={e => setActivityTypeMode(e.target.value as MediaActivityTypeMode)}
              fullWidth={true}
            >
              <option value="auto-adaptive">Auto-Adaptive (Default)</option>
              <option value="app-profile-override">App Profile Override</option>
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
              <span className="text-xs font-bold block">Time Remaining</span>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {timeRemaining
                  ? 'Shows the usual start/current-end time remaining'
                  : "Uses the app's timestamp instead"}
              </p>
            </div>

            <div className="shrink-0">
              <Switch
                checked={timeRemaining}
                onChange={setTimeRemaining}
                aria-label="Toggle Time Remaining"
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
                <span className="text-xs font-bold block">Paused Media Resolution</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  Presence behavior when active playback is paused
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('paused')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title="Paused Resolution Help"
                aria-label="Paused Media Resolution Help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={pausedResolution}
              onChange={e => setPausedResolution(e.target.value as PausedMediaResolution)}
              fullWidth={true}
            >
              <option value="show-paused">Show Paused State (Default)</option>
              <option value="fallback-app">Fallback to Detected App</option>
              <option value="hide-status">Hide Paused State</option>
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
              <span className="text-xs font-bold block">Media Status Field Configuration</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Customize Title, Artist, Album, and artwork fallback expressions
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
        title="Media Priority Strategy"
        subtitle="Resolution logic between gaming and media sessions"
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            Understood
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            <strong>Priority Playing Media (Default):</strong> When media is actively playing (e.g. Spotify,
            YouTube Music), it takes immediate precedence over whatever app you are running, projecting
            your current track or video.
          </p>
          <p>
            <strong>Switches Between:</strong> Projects media presence only while you are actively inside
            the media player application. When you switch to a game or another enabled app, the game presence
            takes over.
          </p>
        </div>
      </Modal>

      {/* Help Modal: Paused Media Resolution */}
      <Modal
        isOpen={helpModal === 'paused'}
        onClose={() => setHelpModal(null)}
        title="Paused Media Resolution"
        subtitle="Options when active playback is paused"
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            Understood
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            <strong>Show Paused State (Default):</strong> Shows the paused state on your Discord profile, keeping the media presence active with paused indicators.
          </p>
          <p>
            <strong>Fallback to Detected App:</strong> Falls back to your previously or currently detected app or custom fallback presence (if any) while media is paused.
          </p>
          <p>
            <strong>Hide Paused State:</strong> Hides your presence status completely while media is paused, including any background detected app.
          </p>
        </div>
      </Modal>
    </div>
  )
}
