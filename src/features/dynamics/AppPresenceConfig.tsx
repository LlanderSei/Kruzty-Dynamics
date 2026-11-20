import React, { useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Clock,
} from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { useBackHandler } from '../navigation/useBackHandler'
import type { OutsideAppBehavior, AppTimestampMode } from '../../types'

interface AppPresenceConfigProps {
  onBack: () => void
  onNavigateToCatalogue: () => void
  onNavigateToStatusFields: () => void
}

export const AppPresenceConfig: React.FC<AppPresenceConfigProps> = ({
  onBack,
  onNavigateToCatalogue,
  onNavigateToStatusFields,
}) => {
  const [outsidePolicy, setOutsidePolicy] = useState<OutsideAppBehavior>('freeze')
  const [timestampStrategy, setTimestampStrategy] = useState<AppTimestampMode>('persistent')
  const [customDateTime, setCustomDateTime] = useState<string>('2026-11-20T00:00')

  // Custom Fallback Fields when policy === 'custom'
  const [customName, setCustomName] = useState('Chilling on Phone')
  const [customDetails, setCustomDetails] = useState('Home Screen')
  const [customState, setCustomState] = useState('Away from apps')

  // Modals for Help
  const [helpModal, setHelpModal] = useState<'policy' | 'timestamp' | null>(null)

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
          <h1 className="text-sm font-bold truncate">Application Presence Configuration</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Outside app policy and timestamp behavior
          </p>
        </div>
      </header>

      {/* Body: Scrollable Column */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative">
        <div className="max-w-xl w-full mx-auto p-4 space-y-3 pb-24">
          {/* Link 1: Application Catalogue */}
          <div
            onClick={onNavigateToCatalogue}
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">Application Catalogue</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                View, filter, and customize individual app projections
              </p>
            </div>
            <div className="p-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Option 2: Outside Detected App Policies */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">Outside Detected App Policies</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  Behavior when you leave or switch away from enabled apps
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('policy')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title="Policy Help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={outsidePolicy}
              onChange={e => setOutsidePolicy(e.target.value as OutsideAppBehavior)}
              fullWidth={true}
            >
              <option value="freeze">Freeze (Default)</option>
              <option value="custom">Custom Fallback</option>
              <option value="drop">Drop (Clear presence)</option>
            </Select>

            {/* If Custom is selected: Expands custom fallback fields */}
            {outsidePolicy === 'custom' && (
              <div
                className="p-3 rounded-xl border space-y-2 mt-2 animate-in fade-in duration-150"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span className="text-[11px] font-semibold block text-[var(--color-accent)]">
                  Custom Fallback Presence
                </span>

                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-base)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Details
                  </label>
                  <input
                    type="text"
                    value={customDetails}
                    onChange={e => setCustomDetails(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-base)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={customState}
                    onChange={e => setCustomState(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-base)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Option 3: Timestamp Strategy */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">Timestamp Strategy</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  How activity timers are resolved across app sessions
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('timestamp')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title="Timestamp Help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={timestampStrategy}
              onChange={e => setTimestampStrategy(e.target.value as AppTimestampMode)}
              fullWidth={true}
            >
              <option value="persistent">Persistent (Default)</option>
              <option value="reset">Reset on Launch</option>
              <option value="custom">Custom Fixed Time</option>
            </Select>

            {/* If Custom is selected: Expands DateTime picker */}
            {timestampStrategy === 'custom' && (
              <div
                className="p-3 rounded-xl border space-y-2 mt-2 animate-in fade-in duration-150"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-[11px] font-semibold text-[var(--color-accent)]">
                    Fixed Start Timestamp
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={e => setCustomDateTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-base)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Link 4: Status Field Configuration */}
          <div
            onClick={onNavigateToStatusFields}
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">Status Field Configuration</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Customize Title, Line 1, Line 2, and artwork expressions
              </p>
            </div>
            <div className="p-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={Boolean(helpModal)}
        onClose={() => setHelpModal(null)}
        title={helpModal === 'policy' ? 'Outside App Policies' : 'Timestamp Strategies'}
        subtitle="Configuration details"
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            Understood
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {helpModal === 'policy' ? (
            <>
              <p>
                <strong>Freeze (Default):</strong> Pauses and preserves the last projected presence state
                without dropping the socket or clearing your presence.
              </p>
              <p>
                <strong>Custom:</strong> Immediately projects your customized fallback presence card (e.g.
                &quot;Browsing Phone&quot;).
              </p>
              <p>
                <strong>Drop:</strong> Clears your Discord activity card until you return to an enabled application.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Persistent (Default):</strong> Maintains the initial application start timestamp
                even across brief background interruptions.
              </p>
              <p>
                <strong>Reset:</strong> Restarts the timer at 00:00 every time you launch or refocus the application.
              </p>
              <p>
                <strong>Custom:</strong> Locks the presence timer to a specific fixed start date &amp; time.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
