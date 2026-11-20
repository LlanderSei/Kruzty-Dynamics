import React, { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Sliders,
  CheckSquare,
  Search,
  Filter,
  X,
  Check,
  CheckCheck,
  RotateCcw,
} from 'lucide-react'
import { Switch } from '../../components/Switch'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { useBackHandler } from '../navigation/useBackHandler'
import type { AppProfile, ActivityType, AppActivityTypeSelection, AppStatusSelection } from '../../types'

interface AppCatalogueProps {
  onBack: () => void
}

const INITIAL_APPS: AppProfile[] = [
  {
    packageName: 'com.mojang.minecraftpe',
    systemLabel: 'Minecraft',
    projectedName: 'Minecraft',
    activityType: 0, // Playing
    enabled: true,
  },
  {
    packageName: 'com.spotify.music',
    systemLabel: 'Spotify',
    projectedName: 'Spotify',
    activityType: 2, // Listening
    enabled: true,
    isMediaApp: true,
  },
  {
    packageName: 'com.miHoYo.GenshinImpact',
    systemLabel: 'Genshin Impact',
    projectedName: 'Genshin Impact',
    activityType: 0,
    enabled: true,
  },
  {
    packageName: 'com.google.android.apps.youtube.music',
    systemLabel: 'YouTube Music',
    projectedName: 'YouTube Music',
    activityType: 2,
    enabled: true,
    isMediaApp: true,
  },
  {
    packageName: 'com.roblox.client',
    systemLabel: 'Roblox',
    projectedName: 'Roblox Mobile',
    activityType: 0,
    enabled: false,
  },
  {
    packageName: 'com.netflix.mediaclient',
    systemLabel: 'Netflix',
    projectedName: 'Netflix',
    activityType: 3, // Watching
    enabled: true,
    isMediaApp: true,
  },
  {
    packageName: 'com.discord',
    systemLabel: 'Discord',
    projectedName: 'Discord Android',
    activityType: 0,
    enabled: false,
  },
  {
    packageName: 'com.android.chrome',
    systemLabel: 'Google Chrome',
    projectedName: 'Browsing the Web',
    activityType: 0,
    enabled: true,
  },
]

const ACTIVITY_TYPE_LABELS: Record<string | number, string> = {
  global: 'Global Default',
  0: 'Playing',
  1: 'Streaming',
  2: 'Listening',
  3: 'Watching',
  5: 'Competing',
}

const PLATFORM_OPTIONS = ['Android (Default)', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch']

export const AppCatalogue: React.FC<AppCatalogueProps> = ({ onBack }) => {
  const [apps, setApps] = useState<AppProfile[]>(INITIAL_APPS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState(false)
  const [filterEnabledOnly, setFilterEnabledOnly] = useState(false)
  const [filterActivityType, setFilterActivityType] = useState<number | 'all'>('all')

  // Batch Operations Mode state
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set())
  const [hasStagedChanges, setHasStagedChanges] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  // Batch configure modal state
  const [batchToggleState, setBatchToggleState] = useState<boolean | 'keep'>('keep')
  const [batchActivityType, setBatchActivityType] = useState<AppActivityTypeSelection | 'keep'>('keep')
  const [batchActivityStatus, setBatchActivityStatus] = useState<AppStatusSelection | 'keep'>('keep')

  // Per-app customization modal state
  const [customizingApp, setCustomizingApp] = useState<AppProfile | null>(null)
  const [editProjectedName, setEditProjectedName] = useState('')
  const [editActivityType, setEditActivityType] = useState<AppActivityTypeSelection>('global')
  const [editActivityStatus, setEditActivityStatus] = useState<AppStatusSelection>('global')
  const [editPlatform, setEditPlatform] = useState('Android (Default)')
  const [editCustomButtons, setEditCustomButtons] = useState(false)
  const [button1Label, setButton1Label] = useState('')
  const [button1Url, setButton1Url] = useState('')
  const [button2Label, setButton2Label] = useState('')
  const [button2Url, setButton2Url] = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch =
        app.systemLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.projectedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (filterEnabledOnly && !app.enabled) return false

      if (filterActivityType !== 'all' && app.activityType !== filterActivityType) return false

      return true
    })
  }, [apps, searchQuery, filterEnabledOnly, filterActivityType])

  const enabledCount = useMemo(() => apps.filter(a => a.enabled).length, [apps])

  // Single app toggle
  const toggleApp = (packageName: string) => {
    setApps(prev =>
      prev.map(app => (app.packageName === packageName ? { ...app, enabled: !app.enabled } : app))
    )
  }

  // Open Cog Customize Modal
  const openCustomizeModal = (app: AppProfile) => {
    setCustomizingApp(app)
    setEditProjectedName(app.projectedName)
    setEditActivityType(app.activityType ?? 'global')
    setEditActivityStatus(app.activityStatus ?? 'global')
    setEditPlatform('Android (Default)')
    setEditCustomButtons(false)
    setButton1Label('')
    setButton1Url('')
    setButton2Label('')
    setButton2Url('')
    setUploadProgress(null)
  }

  // Save single app profile customization
  const saveCustomizeApp = () => {
    if (!customizingApp) return
    setApps(prev =>
      prev.map(app =>
        app.packageName === customizingApp.packageName
          ? {
              ...app,
              projectedName: editProjectedName.trim() || app.systemLabel,
              activityType: editActivityType,
              activityStatus: editActivityStatus,
            }
          : app
      )
    )
    setCustomizingApp(null)
  }

  // Simulate circular upload on icon click
  const handleSimulateIconUpload = () => {
    setUploadProgress(10)
    let progress = 10
    const interval = setInterval(() => {
      progress += 25
      if (progress >= 100) {
        setUploadProgress(100)
        clearInterval(interval)
        setTimeout(() => setUploadProgress(null), 600)
      } else {
        setUploadProgress(progress)
      }
    }, 150)
  }

  // Batch Selection
  const toggleSelectApp = (pkg: string) => {
    setSelectedPackages(prev => {
      const next = new Set(prev)
      if (next.has(pkg)) next.delete(pkg)
      else next.add(pkg)
      return next
    })
  }

  const applyBatchChanges = () => {
    setApps(prev =>
      prev.map(app => {
        if (!selectedPackages.has(app.packageName)) return app
        return {
          ...app,
          enabled: batchToggleState === 'keep' ? app.enabled : batchToggleState,
          activityType: batchActivityType === 'keep' ? app.activityType : batchActivityType,
          activityStatus: batchActivityStatus === 'keep' ? app.activityStatus : batchActivityStatus,
        }
      })
    )
    setHasStagedChanges(true)
    setIsBatchModalOpen(false)
  }

  const handleExitBatchMode = () => {
    if (hasStagedChanges) {
      setIsDiscardConfirmOpen(true)
    } else {
      setIsBatchMode(false)
      setSelectedPackages(new Set())
    }
  }

  const handleBack = () => {
    if (isBatchMode) {
      handleExitBatchMode()
    } else {
      onBack()
    }
  }

  useBackHandler(handleBack)

  const confirmApplyAll = () => {
    setIsBatchConfirmOpen(false)
    setIsBatchMode(false)
    setSelectedPackages(new Set())
    setHasStagedChanges(false)
  }

  return (
    <div
      className="h-screen w-screen flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-base)',
      }}
    >
      {/* ======================================================== */}
      {/* HEADER: Back Button | Title + Subtext | Batch Op Button */}
      {/* ======================================================== */}
      <header
        className="shrink-0 px-4 pb-3 border-b z-20 backdrop-blur-md flex items-center justify-between"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={isBatchMode ? handleExitBatchMode : onBack}
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
            <h1 className="text-sm font-bold truncate">Application Catalogue</h1>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {apps.length} apps | {enabledCount} enabled
            </p>
          </div>
        </div>

        {/* Batch Operation Icon (Hidden during batch mode) */}
        {!isBatchMode && (
          <button
            type="button"
            onClick={() => {
              setIsBatchMode(true)
              setSelectedPackages(new Set())
              setHasStagedChanges(false)
            }}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95 shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            title="Batch Operations"
            aria-label="Batch Operations"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* ======================================================== */}
      {/* BODY: Sticky Search/Filter Bar + Scrollable Apps List */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative flex flex-col">
        {/* Sticky Header Container: Search Bar + Filter Options (Sticky together) */}
        <div
          className="sticky top-0 z-20 border-b backdrop-blur-md shadow-xs transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Search & Filter Trigger Row */}
          <div className="px-4 py-2.5 flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className="w-full bg-transparent border-0 focus:outline-hidden text-xs"
                style={{ color: 'var(--color-text-base)' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[var(--color-text-muted)] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setFilterActive(prev => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                filterEnabledOnly || filterActivityType !== 'all' ? 'border-[var(--color-accent)]' : ''
              }`}
              style={{
                backgroundColor:
                  filterEnabledOnly || filterActivityType !== 'all'
                    ? 'var(--color-accent-subtle)'
                    : 'var(--color-bg-elevated)',
                borderColor:
                  filterEnabledOnly || filterActivityType !== 'all'
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                color:
                  filterEnabledOnly || filterActivityType !== 'all'
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
              }}
              title="Filter Apps"
              aria-label="Filter Apps"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Clear Filters Button (Only shown when filter active) */}
            {(filterEnabledOnly || filterActivityType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterEnabledOnly(false)
                  setFilterActivityType('all')
                }}
                className="p-2 rounded-xl border transition-all cursor-pointer text-red-400"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                title="Clear Filters"
                aria-label="Clear Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Drawer - Inside sticky container so it stays pinned */}
          {filterActive && (
            <div
              className="px-4 py-3 border-t text-xs space-y-2.5 animate-in slide-in-from-top-1"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  Filter Options
                </span>
                <button
                  type="button"
                  onClick={() => setFilterActive(false)}
                  className="text-[11px] text-[var(--color-text-muted)] hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setFilterEnabledOnly(prev => !prev)}
                  className="p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors"
                  style={{
                    backgroundColor: filterEnabledOnly
                      ? 'var(--color-accent-subtle)'
                      : 'var(--color-bg-surface)',
                    borderColor: filterEnabledOnly ? 'var(--color-accent)' : 'var(--color-border)',
                    color: filterEnabledOnly ? 'var(--color-accent)' : 'var(--color-text-base)',
                  }}
                >
                  <span className="font-medium text-xs">Enabled Only</span>
                  {filterEnabledOnly && <Check className="w-3.5 h-3.5" />}
                </button>

                <Select
                  value={filterActivityType}
                  onChange={e =>
                    setFilterActivityType(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                  fullWidth={true}
                >
                  <option value="all">All Activities</option>
                  <option value={0}>Playing</option>
                  <option value={1}>Streaming</option>
                  <option value={2}>Listening</option>
                  <option value={3}>Watching</option>
                  <option value={5}>Competing</option>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Apps List */}
        <div className="max-w-xl w-full mx-auto p-4 space-y-2 pb-24">
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No applications match your search or filter.
            </div>
          ) : (
            filteredApps.map(app => {
              const isSelected = selectedPackages.has(app.packageName)

              return (
                <div
                  key={app.packageName}
                  onClick={() => {
                    if (isBatchMode) toggleSelectApp(app.packageName)
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isBatchMode ? 'cursor-pointer active:scale-[0.99]' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: isSelected
                      ? 'var(--color-accent)'
                      : 'var(--color-border)',
                  }}
                >
                  {/* Left: Optional Checkbox in Batch Mode */}
                  {isBatchMode && (
                    <div className="shrink-0 pl-1">
                      <div
                        className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--color-accent)'
                            : 'var(--color-bg-elevated)',
                          borderColor: isSelected
                            ? 'var(--color-accent)'
                            : 'var(--color-border)',
                          color: '#ffffff',
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  {/* App Icon */}
                  <div className="relative shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                        app.packageName
                      )}`}
                      alt={app.systemLabel}
                      className="w-10 h-10 rounded-xl object-cover border"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  {/* Projected Name + App Name + PackageName */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold truncate">{app.projectedName}</h3>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {ACTIVITY_TYPE_LABELS[app.activityType]}
                      </span>
                    </div>

                    {app.projectedName !== app.systemLabel && (
                      <p
                        className="text-[10px] truncate"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Original: {app.systemLabel}
                      </p>
                    )}

                    <p
                      className="text-[10px] truncate font-mono"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {app.packageName}
                    </p>
                  </div>

                  {/* Right Actions: Cog + Switch (Hidden in Batch Mode) */}
                  {!isBatchMode && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openCustomizeModal(app)}
                        className="p-1.5 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-muted)',
                        }}
                        title={`Customize ${app.systemLabel}`}
                        aria-label="Customize"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      <Switch
                        checked={app.enabled}
                        onChange={() => toggleApp(app.packageName)}
                        aria-label={`Toggle ${app.systemLabel}`}
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ======================================================== */}
        {/* 3 VERTICALLY STACKED FABs ON BOTTOM-RIGHT (BATCH MODE) */}
        {/* ======================================================== */}
        {isBatchMode && (
          <div className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* 1. Cog FAB (Bulk configure modal) */}
            <button
              type="button"
              disabled={selectedPackages.size === 0}
              onClick={() => setIsBatchModalOpen(true)}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
              }}
              title="Bulk Configure Selected Apps"
              aria-label="Bulk Configure"
            >
              <Sliders className="w-5 h-5" />
            </button>

            {/* 2. X FAB (Cancel batch mode) */}
            <button
              type="button"
              onClick={handleExitBatchMode}
              className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 border"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
              title="Cancel Batch Mode"
              aria-label="Cancel Batch Mode"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 3. Double Check FAB (Apply staged changes) */}
            <button
              type="button"
              disabled={!hasStagedChanges}
              onClick={() => setIsBatchConfirmOpen(true)}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{
                backgroundColor: '#22c55e',
                color: '#ffffff',
              }}
              title="Apply All Staged Changes"
              aria-label="Apply All Changes"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: Per-App Customization Modal */}
      {/* ======================================================== */}
      <Modal
        isOpen={Boolean(customizingApp)}
        onClose={() => setCustomizingApp(null)}
        title={`Customize ${customizingApp?.systemLabel || 'App'}`}
        subtitle="Presence profile & projection aliases"
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setCustomizingApp(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={saveCustomizeApp}>
              Apply
            </Button>
          </div>
        }
      >
        {customizingApp && (
          <div className="divide-y text-xs" style={{ borderColor: 'var(--color-border)' }}>
            {/* 3-Col Header Grid: Icon | Projected Name | Reset */}
            <div className="flex items-end gap-2.5 pb-3.5">
              {/* Icon Container with Circular Progress Bar around border frame */}
              <div
                onClick={handleSimulateIconUpload}
                className="relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden transition-all hover:opacity-90"
                style={{
                  borderColor:
                    uploadProgress !== null ? 'var(--color-accent)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-elevated)',
                }}
                title="Tap to replace app icon"
              >
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                    customizingApp.packageName
                  )}`}
                  alt="App Icon"
                  className="w-full h-full object-cover"
                />

                {/* Upload Progress Overlay (Centered percentage) */}
                {uploadProgress !== null && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] font-bold font-mono">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Projected App Name input */}
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Projected Name
                </label>
                <input
                  type="text"
                  value={editProjectedName}
                  onChange={e => setEditProjectedName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border focus:outline-hidden text-xs"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-base)',
                  }}
                />
              </div>

              {/* Reset to Original Name Button */}
              <button
                type="button"
                onClick={() => setEditProjectedName(customizingApp.systemLabel)}
                className="h-9 w-9 rounded-xl border shrink-0 flex items-center justify-center transition-all hover:border-[var(--color-accent)]"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
                title="Reset to Original Label"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Activity Type Dropdown */}
            <div className="flex items-center justify-between gap-4 py-3">
                <label className="text-xs font-semibold shrink-0">Activity Type</label>
                <div className="w-48 sm:w-56 shrink-0">
                  <Select
                    value={editActivityType}
                    onChange={e =>
                      setEditActivityType(
                        e.target.value === 'global' ? 'global' : (Number(e.target.value) as ActivityType)
                      )
                    }
                    fullWidth={true}
                  >
                    <option value="global">Global Default</option>
                    <option value={0}>Playing</option>
                    <option value={1}>Streaming</option>
                    <option value={2}>Listening</option>
                    <option value={3}>Watching</option>
                    <option value={5}>Competing</option>
                  </Select>
                </div>
              </div>

              {/* Activity Status Dropdown */}
              <div className="flex items-center justify-between gap-4 py-3">
                <label className="text-xs font-semibold shrink-0">Activity Status</label>
                <div className="w-48 sm:w-56 shrink-0">
                  <Select
                    value={editActivityStatus}
                    onChange={e => setEditActivityStatus(e.target.value as AppStatusSelection)}
                    fullWidth={true}
                  >
                    <option value="global">Global Default</option>
                    <option value="online">Online</option>
                    <option value="idle">Idle</option>
                    <option value="dnd">Do Not Disturb</option>
                    <option value="offline">Offline</option>
                    <option value="invisible">Invisible</option>
                  </Select>
                </div>
              </div>

              {/* Platform Type Dropdown */}
              <div className="flex items-center justify-between gap-4 py-3">
                <label className="text-xs font-semibold shrink-0">Platform Type</label>
                <div className="w-48 sm:w-56 shrink-0">
                  <Select
                    value={editPlatform}
                    onChange={e => setEditPlatform(e.target.value)}
                    fullWidth={true}
                  >
                    {PLATFORM_OPTIONS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Custom Buttons Toggle */}
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-semibold block text-xs">Custom Buttons</span>
                    <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                      Add up to 2 interactive presence buttons
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch
                      checked={editCustomButtons}
                      onChange={setEditCustomButtons}
                      aria-label="Toggle Custom Buttons"
                    />
                  </div>
                </div>

              {/* Expanded Button Fields */}
              {editCustomButtons && (
                <div className="space-y-2.5 pt-1">
                  <div
                    className="p-2.5 rounded-xl border space-y-1.5"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <span className="text-[11px] font-semibold">Button 1</span>
                    <input
                      type="text"
                      value={button1Label}
                      onChange={e => setButton1Label(e.target.value)}
                      placeholder="Label (e.g. Join Game)"
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                    <input
                      type="url"
                      value={button1Url}
                      onChange={e => setButton1Url(e.target.value)}
                      placeholder="URL (https://...)"
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                  </div>

                  <div
                    className="p-2.5 rounded-xl border space-y-1.5"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <span className="text-[11px] font-semibold">Button 2</span>
                    <input
                      type="text"
                      value={button2Label}
                      onChange={e => setButton2Label(e.target.value)}
                      placeholder="Label (e.g. Visit Website)"
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                    <input
                      type="url"
                      value={button2Url}
                      onChange={e => setButton2Url(e.target.value)}
                      placeholder="URL (https://...)"
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
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: Bulk Configure Modal (Cog FAB) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Bulk Configure (${selectedPackages.size} Apps)`}
        subtitle="Apply changes to all selected applications"
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={applyBatchChanges}>
              Stage Changes
            </Button>
          </div>
        }
      >
        <div className="divide-y text-xs" style={{ borderColor: 'var(--color-border)' }}>
          {/* Bulk Toggle Status */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">Presence Toggle</label>
            <div className="w-48 sm:w-56 shrink-0">
              <Select
                value={batchToggleState === 'keep' ? 'keep' : batchToggleState ? 'enable' : 'disable'}
                onChange={e =>
                  setBatchToggleState(
                    e.target.value === 'keep' ? 'keep' : e.target.value === 'enable'
                  )
                }
                fullWidth={true}
              >
                <option value="keep">Keep Current</option>
                <option value="enable">Enable All</option>
                <option value="disable">Disable All</option>
              </Select>
            </div>
          </div>

          {/* Bulk Activity Type */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">Activity Type</label>
            <div className="w-48 sm:w-56 shrink-0">
              <Select
                value={batchActivityType}
                onChange={e =>
                  setBatchActivityType(
                    e.target.value === 'keep' ? 'keep' : (e.target.value as AppActivityTypeSelection)
                  )
                }
                fullWidth={true}
              >
                <option value="keep">Keep Current</option>
                <option value="global">Global Default</option>
                <option value={0}>Playing</option>
                <option value={1}>Streaming</option>
                <option value={2}>Listening</option>
                <option value={3}>Watching</option>
                <option value={5}>Competing</option>
              </Select>
            </div>
          </div>

          {/* Bulk Activity Status */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">Activity Status</label>
            <div className="w-48 sm:w-56 shrink-0">
              <Select
                value={batchActivityStatus}
                onChange={e =>
                  setBatchActivityStatus(
                    e.target.value === 'keep' ? 'keep' : (e.target.value as AppStatusSelection)
                  )
                }
                fullWidth={true}
              >
                <option value="keep">Keep Current</option>
                <option value="global">Global Default</option>
                <option value="online">Online</option>
                <option value="idle">Idle</option>
                <option value="dnd">Do Not Disturb</option>
                <option value="offline">Offline</option>
                <option value="invisible">Invisible</option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: Confirm Apply Batch Changes (Double Check FAB) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isBatchConfirmOpen}
        onClose={() => setIsBatchConfirmOpen(false)}
        title="Apply Batch Changes?"
        subtitle="Confirmation"
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsBatchConfirmOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={confirmApplyAll}>
              Confirm &amp; Apply
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          You are about to permanently apply staged configuration changes to{' '}
          <strong>{selectedPackages.size}</strong> selected applications.
        </p>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: Discard Unsaved Batch Changes Confirmation */}
      {/* ======================================================== */}
      <Modal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title="Discard Staged Changes?"
        subtitle="Unsaved batch modifications"
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsDiscardConfirmOpen(false)}>
              Keep Editing
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setIsDiscardConfirmOpen(false)
                setIsBatchMode(false)
                setSelectedPackages(new Set())
                setHasStagedChanges(false)
              }}
            >
              Discard Changes
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          You have uncommitted batch configurations. Leaving batch mode now will discard all staged
          changes.
        </p>
      </Modal>
    </div>
  )
}
