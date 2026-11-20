import React, { useState } from 'react'
import {
  LayoutGrid,
  FileEdit,
  SlidersHorizontal,
  ShieldAlert,
  PowerOff,
  Radio,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react'
import { Switch } from '../../components/Switch'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { usePermissions } from '../permissions/usePermissions'

interface ServiceDashboardProps {
  onOpenPermissionsSetup?: () => void
  onNavigateToCatalogue?: () => void
  onNavigateToAppStatusFields?: () => void
  onNavigateToAppPresenceConfig?: () => void
  onNavigateToMediaStatusFields?: () => void
  onNavigateToMediaPresenceConfig?: () => void
}

type SimulationMode = 'app' | 'media' | 'none'

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  onOpenPermissionsSetup,
  onNavigateToCatalogue,
  onNavigateToAppStatusFields,
  onNavigateToAppPresenceConfig,
  onNavigateToMediaStatusFields,
  onNavigateToMediaPresenceConfig,
}) => {
  const { permissions } = usePermissions()
  const [isServiceEnabled, setIsServiceEnabled] = useState(true)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [placeholderModal, setPlaceholderModal] = useState<string | null>(null)
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('app')

  // Example stats for placeholder apps detected / enabled
  const detectedAppsCount = 48
  const enabledAppsCount = 6

  const handleToggleService = (nextState: boolean) => {
    if (nextState) {
      // Check if crucial permissions are granted
      const hasCrucial = permissions.notificationListener && permissions.usageStats
      if (!hasCrucial) {
        setPermissionModalOpen(true)
        return
      }
    }
    setIsServiceEnabled(nextState)
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
            {isServiceEnabled ? 'Service is enabled.' : 'Service not started.'}
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
              {detectedAppsCount} apps detected | {enabledAppsCount} enabled apps
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
              Auto-Adaptive Detection (Listening / Watching)
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

      {/* ======================================================== */}
      {/* LOWER SECTION: Preview Card (if service on) or Status Msg */}
      {/* ======================================================== */}

      <div className="pt-2">
        {!isServiceEnabled ? (
          /* Case A: Service is disabled */
          <div
            className="p-8 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2.5 transition-all"
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
              Service is currently disabled. Toggle the switch above.
            </p>
          </div>
        ) : simulationMode === 'none' ? (
          /* Case B: Service enabled but no app/media presence detected */
          <div
            className="p-6 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 transition-all"
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
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              No app/media presence is currently being detected. Try configuring the settings above
              and enable one of your apps then visit it, then come back here.
            </p>

            {/* Quick simulation switcher */}
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Preview state:</span>
              <button
                type="button"
                onClick={() => setSimulationMode('app')}
                className="px-2 py-0.5 rounded-lg border text-[11px] hover:border-[var(--color-accent)]"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
              >
                App
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('media')}
                className="px-2 py-0.5 rounded-lg border text-[11px] hover:border-[var(--color-accent)]"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
              >
                Media
              </button>
            </div>
          </div>
        ) : (
          /* Case C: Service enabled + Active Preview Card */
          <div className="space-y-2">
            {/* Header: ActivityType + AppName */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Preview:
                </span>
                <span className="text-xs font-semibold">
                  {simulationMode === 'app' ? 'Playing Minecraft' : 'Listening to Spotify'}
                </span>
              </div>

              {/* Simulation Mode Toggle Pill */}
              <div
                className="flex items-center p-0.5 rounded-lg border text-[10px]"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
              >
                <button
                  type="button"
                  onClick={() => setSimulationMode('app')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    simulationMode === 'app'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  App
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMode('media')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    simulationMode === 'media'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  Media
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMode('none')}
                  className="px-2 py-0.5 rounded-md font-medium transition-colors text-[var(--color-text-muted)] hover:text-white"
                >
                  Idle
                </button>
              </div>
            </div>

            {/* Discord Style 3-Grid Presence Card */}
            <div
              className="p-4 rounded-2xl border transition-all"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-accent-border)',
              }}
            >
              <div className="flex items-center gap-3.5">
                {/* 1. Large Image (App Icon or Media Album Art) */}
                <div className="relative shrink-0">
                  <img
                    src={
                      simulationMode === 'app'
                        ? 'https://api.dicebear.com/7.x/identicon/svg?seed=Minecraft'
                        : 'https://api.dicebear.com/7.x/identicon/svg?seed=SpotifyAlbum'
                    }
                    alt="Presence Artwork"
                    className="w-16 h-16 rounded-xl object-cover border shadow-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  {/* Subtle platform indicator dot */}
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      borderColor: 'var(--color-bg-surface)',
                    }}
                  >
                    ✓
                  </span>
                </div>

                {/* 2. Middle Column: Title, Line 1, Line 2, Timer */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="text-sm font-bold truncate">
                    {simulationMode === 'app' ? 'Minecraft' : 'Starboy'}
                  </h4>

                  <p
                    className="text-xs truncate leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {simulationMode === 'app'
                      ? 'Exploring the Nether'
                      : 'The Weeknd, Daft Punk'}
                  </p>

                  <p
                    className="text-xs truncate leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {simulationMode === 'app'
                      ? 'Survival Mode (Hard)'
                      : 'Starboy (Deluxe Edition)'}
                  </p>

                  <div
                    className="flex items-center gap-1 text-[11px] font-mono pt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Clock className="w-3 h-3" />
                    <span>02:45 elapsed</span>
                  </div>
                </div>

                {/* 3. Right Column: Small Circle SmallImage / Playback State */}
                <div className="shrink-0 pl-1">
                  <div
                    className="w-8 h-8 rounded-full border flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                    title={simulationMode === 'app' ? 'App Icon' : 'Playing'}
                  >
                    {simulationMode === 'app' ? (
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* PLACEHOLDER MODAL FOR SUBPAGES */}
      {/* ======================================================== */}
      <Modal
        isOpen={Boolean(placeholderModal)}
        onClose={() => setPlaceholderModal(null)}
        title={placeholderModal || 'Subpage'}
        subtitle="Feature Roadmap"
        footer={
          <Button size="sm" variant="primary" onClick={() => setPlaceholderModal(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <div
            className="p-3 rounded-xl border flex items-start gap-2.5"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-text-base)',
            }}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="font-semibold">{placeholderModal}</p>
              <p className="mt-0.5 text-xs opacity-90 leading-snug">
                Subpage is staged in the roadmap and will be implemented in the next development phase.
              </p>
            </div>
          </div>
          <p>
            You will be able to customize application lists, batch operations, presence field
            templates, and fallback behaviors here.
          </p>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* PERMISSION REQUIRED MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        title="Permissions Required"
        subtitle="Cannot start presence service"
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPermissionModalOpen(false)}
            >
              Dismiss
            </Button>
            {onOpenPermissionsSetup && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setPermissionModalOpen(false)
                  onOpenPermissionsSetup()
                }}
              >
                Configure Permissions
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <div
            className="p-3 rounded-xl border flex items-start gap-2.5"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: 'var(--color-text-base)',
            }}
          >
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Missing Core Detection Permissions</p>
              <p className="mt-0.5 leading-snug">
                Kruzty Dynamics requires <strong>Notification Access</strong> (for media playback)
                and <strong>Usage Access</strong> (for foreground apps) before the background
                service can start.
              </p>
            </div>
          </div>
          <p>
            Please grant the necessary permissions in First Time Setup or system settings to activate presence.
          </p>
        </div>
      </Modal>
    </div>
  )
}
