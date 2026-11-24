import React, { useState, useMemo, useEffect, useRef } from 'react'
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
  Loader2,
  Upload,
} from 'lucide-react'
import { Switch } from '../../components/Switch'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { useBackHandler } from '../navigation/useBackHandler'
import { useAppSettings } from '../settings/useAppSettings'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { AppProfile, ActivityType, AppActivityTypeSelection, AppStatusSelection } from '../../types'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'
import { useTranslation } from '../../i18n/useTranslation'
import { addLog } from '../accounts/discordAuth'

interface AppCatalogueProps {
  onBack: () => void
}

const APP_PROFILES_STORAGE_KEY = 'kd_app_profiles'
const INSTALLED_APPS_CACHE_KEY = 'kd_installed_apps_cache'

interface InstalledApp {
  packageName: string
  systemLabel: string
  iconBase64?: string
}

function loadSavedProfiles(): AppProfile[] {
  try {
    const saved = localStorage.getItem(APP_PROFILES_STORAGE_KEY)
    const parsed: unknown = saved ? JSON.parse(saved) : []
    if (!Array.isArray(parsed)) return []
    return (parsed as AppProfile[]).map(profile => Number(profile.activityType) === 1
      ? { ...profile, activityType: 'global', activityStatus: 'streaming' }
      : profile)
  } catch {
    return []
  }
}

function loadInstalledAppsCache(): InstalledApp[] {
  try {
    const cached = localStorage.getItem(INSTALLED_APPS_CACHE_KEY)
    const parsed: unknown = cached ? JSON.parse(cached) : []
    return Array.isArray(parsed) ? parsed as InstalledApp[] : []
  } catch {
    return []
  }
}

function profilesForInstalledApps(installedApps: InstalledApp[], savedProfiles: AppProfile[]): AppProfile[] {
  const savedByPackage = new Map(savedProfiles.map(profile => [profile.packageName, profile]))
  return installedApps.map(installed => {
    const saved = savedByPackage.get(installed.packageName)
    return saved
      ? { ...saved, systemLabel: installed.systemLabel }
      : {
          packageName: installed.packageName,
          systemLabel: installed.systemLabel,
          projectedName: installed.systemLabel,
          activityType: 'global',
          activityStatus: 'global',
          enabled: false,
        }
  })
}

async function uploadIconToImgBB(
  file: File,
  apiKey: string,
  requestId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const imageBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.onload = () => {
      const dataUrl = reader.result
      const image = typeof dataUrl === 'string' ? dataUrl.split(',', 2)[1] : ''
      if (image) resolve(image)
      else reject(new Error('The selected file is not a valid image.'))
    }
    reader.readAsDataURL(file)
  })

  const unlisten = await listen<{
    requestId: string
    loaded: number
    total: number
    progress: number
  }>('imgbb-upload-progress', event => {
    if (event.payload.requestId === requestId) onProgress(event.payload.progress)
  })
  try {
    addLog('info', `Custom app icon upload started: file=${file.name} bytes=${file.size} requestId=${requestId}`)
    const url = await invoke<string>('upload_app_icon', {
      imageBase64,
      imageName: file.name,
      apiKey: apiKey || null,
      requestId,
    })
    addLog('info', `Custom app icon upload successful: file=${file.name} url=${url}`)
    return url
  } catch (error) {
    addLog('error', `Custom app icon upload failed: file=${file.name} error=${error instanceof Error ? error.message : String(error)}`)
    throw error
  } finally {
    unlisten()
  }
}

const ACTIVITY_TYPE_LABELS: Record<string | number, string> = {
  global: 'Global Default',
  0: 'Playing',
  2: 'Listening',
  3: 'Watching',
  5: 'Competing',
}

const PLATFORM_OPTIONS = ['Android', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch']

export const AppCatalogue: React.FC<AppCatalogueProps> = ({ onBack }) => {
  const { t } = useTranslation()
  const { settings } = useAppSettings()
  const [initialInstalledApps] = useState<InstalledApp[]>(loadInstalledAppsCache)
  const [savedProfilesOnLoad] = useState<AppProfile[]>(loadSavedProfiles)
  const [apps, setApps] = useState<AppProfile[]>(() =>
    initialInstalledApps.length > 0
      ? profilesForInstalledApps(initialInstalledApps, savedProfilesOnLoad)
      : savedProfilesOnLoad
  )
  const [appIcons, setAppIcons] = useState<Record<string, string>>(() => Object.fromEntries(
    initialInstalledApps
      .filter(app => app.iconBase64)
      .map(app => [app.packageName, `data:image/png;base64,${app.iconBase64}`])
  ))
  const [stagedApps, setStagedApps] = useState<AppProfile[] | null>(null)
  const [isLoadingApps, setIsLoadingApps] = useState(initialInstalledApps.length === 0)
  const [appLoadError, setAppLoadError] = useState('')
  const [profilesLoaded, setProfilesLoaded] = useState(
    initialInstalledApps.length > 0 || savedProfilesOnLoad.length > 0
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState(false)
  const [filterEnabledOnly, setFilterEnabledOnly] = useState(false)
  const [filterActivityType, setFilterActivityType] = useState<AppActivityTypeSelection | 'all'>('all')
  const [filterActivityStatus, setFilterActivityStatus] = useState<AppStatusSelection | 'all'>('all')
  const [filterPlatform, setFilterPlatform] = useState<string | 'all'>('all')

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
  const [batchPlatform, setBatchPlatform] = useState<string | 'keep'>('keep')

  // Per-app customization modal state
  const [customizingApp, setCustomizingApp] = useState<AppProfile | null>(null)
  const [editProjectedName, setEditProjectedName] = useState('')
  const [editActivityType, setEditActivityType] = useState<AppActivityTypeSelection>('global')
  const [editActivityStatus, setEditActivityStatus] = useState<AppStatusSelection>('global')
  const [editPlatform, setEditPlatform] = useState('Android')
  const [editCustomButtons, setEditCustomButtons] = useState(false)
  const [button1Label, setButton1Label] = useState('')
  const [button1Url, setButton1Url] = useState('')
  const [button2Label, setButton2Label] = useState('')
  const [button2Url, setButton2Url] = useState('')
  const [editIconOverride, setEditIconOverride] = useState('')
  const [editCustomDetailsEnabled, setEditCustomDetailsEnabled] = useState(false)
  const [editCustomDetails, setEditCustomDetails] = useState('')
  const [editCustomState, setEditCustomState] = useState('')
  const [editCustomSmallEnabled, setEditCustomSmallEnabled] = useState(false)
  const [editCustomSmallText, setEditCustomSmallText] = useState('')
  const [editCustomSmallUrl, setEditCustomSmallUrl] = useState('')
  const [iconUploadProgress, setIconUploadProgress] = useState<number | null>(null)
  const [iconUploadError, setIconUploadError] = useState('')
  const iconPickerRef = useRef<HTMLInputElement>(null)
  const smallImagePickerRef = useRef<HTMLInputElement>(null)

  const handleSmallImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setIconUploadError(t.catalogue.chooseImage)
      return
    }
    if (file.size > 32 * 1024 * 1024) {
      setIconUploadError(t.catalogue.imageTooLarge)
      return
    }
    setIconUploadError('')
    setIconUploadProgress(0)
    try {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const url = await uploadIconToImgBB(file, settings.customImgbbKey, requestId, setIconUploadProgress)
      setEditCustomSmallUrl(url)
      setIconUploadProgress(100)
      window.setTimeout(() => setIconUploadProgress(null), 900)
    } catch (error) {
      setIconUploadProgress(null)
      setIconUploadError(error instanceof Error ? error.message : t.catalogue.imageUploadFailed)
    }
  }

  const handleIconFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setIconUploadError(t.catalogue.chooseImage)
      return
    }
    if (file.size > 32 * 1024 * 1024) {
      setIconUploadError(t.catalogue.imageTooLarge)
      return
    }
    setIconUploadError('')
    setIconUploadProgress(0)
    try {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const url = await uploadIconToImgBB(
        file,
        settings.customImgbbKey,
        requestId,
        setIconUploadProgress
      )
      setEditIconOverride(url)
      setIconUploadProgress(100)
      window.setTimeout(() => setIconUploadProgress(null), 900)
    } catch (error) {
      setIconUploadProgress(null)
      setIconUploadError(error instanceof Error ? error.message : t.catalogue.iconUploadFailed)
    }
  }

  useEffect(() => {
    const bridge = (window as Window & {
      AndroidNativeBridge?: { getInstalledAppsAsync?: (requestId: string) => void }
    }).AndroidNativeBridge

    if (!bridge?.getInstalledAppsAsync) {
      setApps(prev => prev.length > 0 ? prev : savedProfilesOnLoad)
      setAppLoadError(t.catalogue.androidOnly)
      setIsLoadingApps(false)
      setProfilesLoaded(true)
      return
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    let timeout: number | undefined
    const handleInstalledAppsLoaded = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId: string; payload: string }>).detail
      if (detail.requestId !== requestId) return

      try {
        const installedApps = JSON.parse(detail.payload) as InstalledApp[] | { error?: string }
        if (!Array.isArray(installedApps)) {
          throw new Error(installedApps.error || t.catalogue.loadAppsFailed)
        }

        try {
          localStorage.setItem(INSTALLED_APPS_CACHE_KEY, JSON.stringify(installedApps))
        } catch {
          // Continue with in-memory app data if the cache exceeds storage limits.
        }
        setAppIcons(Object.fromEntries(
          installedApps
            .filter(app => app.iconBase64)
            .map(app => [app.packageName, `data:image/png;base64,${app.iconBase64}`])
        ))
        setApps(prev => profilesForInstalledApps(
          installedApps,
          prev.length > 0 ? prev : loadSavedProfiles()
        ))
        setAppLoadError('')
      } catch (error) {
        setAppLoadError(error instanceof Error ? error.message : t.catalogue.loadAppsFailed)
      } finally {
        if (timeout !== undefined) window.clearTimeout(timeout)
        setIsLoadingApps(false)
        setProfilesLoaded(true)
      }
    }

    window.addEventListener('installedAppsLoaded', handleInstalledAppsLoaded)
    timeout = window.setTimeout(() => {
      setIsLoadingApps(false)
      setAppLoadError('App list refresh timed out. Showing the last saved app list.')
      setProfilesLoaded(true)
    }, 15000)
    bridge.getInstalledAppsAsync(requestId)

    return () => {
      window.removeEventListener('installedAppsLoaded', handleInstalledAppsLoaded)
      window.clearTimeout(timeout)
    }
  }, [savedProfilesOnLoad])

  useEffect(() => {
    if (!profilesLoaded) return
    try {
      localStorage.setItem(APP_PROFILES_STORAGE_KEY, JSON.stringify(apps))
      notifyServiceConfigChanged()
    } catch {
      // Keep profile changes active for this session if storage is unavailable.
    }
  }, [apps, profilesLoaded])

  const displayedApps = stagedApps ?? apps

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return displayedApps.filter(app => {
      const matchesSearch =
        app.systemLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.projectedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (filterEnabledOnly && !app.enabled) return false

      if (filterActivityType !== 'all' && app.activityType !== filterActivityType) return false
      if (filterActivityStatus !== 'all' && (app.activityStatus || 'global') !== filterActivityStatus) return false
      if (filterPlatform !== 'all' && (app.platform || 'Android') !== filterPlatform) return false

      return true
    })
  }, [displayedApps, searchQuery, filterEnabledOnly, filterActivityType, filterActivityStatus, filterPlatform])

  const hasActiveFilters = filterEnabledOnly || filterActivityType !== 'all' ||
    filterActivityStatus !== 'all' || filterPlatform !== 'all'

  const enabledCount = useMemo(() => displayedApps.filter(a => a.enabled).length, [displayedApps])

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
    setEditPlatform(app.platform || 'Android')
    setEditCustomButtons(Boolean(app.buttons?.length))
    setButton1Label(app.buttons?.[0]?.label || '')
    setButton1Url(app.buttons?.[0]?.url || '')
    setButton2Label(app.buttons?.[1]?.label || '')
    setButton2Url(app.buttons?.[1]?.url || '')
    setEditIconOverride(app.iconOverride || '')
    setEditCustomDetailsEnabled(Boolean(app.customDetailsEnabled))
    setEditCustomDetails(app.customDetails || '')
    setEditCustomState(app.customState || '')
    setEditCustomSmallEnabled(Boolean(app.customSmallEnabled))
    setEditCustomSmallText(app.customSmallText || '')
    setEditCustomSmallUrl(app.customSmallUrl || '')
    setIconUploadError('')
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
              platform: editPlatform,
              iconOverride: editIconOverride || undefined,
              customDetailsEnabled: editCustomDetailsEnabled,
              customDetails: editCustomDetails,
              customState: editCustomState,
              customSmallEnabled: editCustomSmallEnabled,
              customSmallText: editCustomSmallText,
              customSmallUrl: editCustomSmallUrl,
              buttons: editCustomButtons
                ? [
                    { label: button1Label.trim(), url: button1Url.trim() },
                    { label: button2Label.trim(), url: button2Url.trim() },
                  ].filter(button => button.label && button.url)
                : [],
            }
          : app
      )
    )
    setCustomizingApp(null)
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
    setStagedApps(prev =>
      (prev ?? apps).map(app => {
        if (!selectedPackages.has(app.packageName)) return app
        return {
          ...app,
          enabled: batchToggleState === 'keep' ? app.enabled : batchToggleState,
          activityType: batchActivityType === 'keep' ? app.activityType : batchActivityType,
          activityStatus: batchActivityStatus === 'keep' ? app.activityStatus : batchActivityStatus,
          platform: batchPlatform === 'keep' ? app.platform : batchPlatform,
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

  // Let the active modal own Android's back gesture. The catalogue handler
  // otherwise sits later in the handler stack and navigates away first.
  useBackHandler(
    handleBack,
    !customizingApp && !isBatchModalOpen && !isBatchConfirmOpen && !isDiscardConfirmOpen
  )

  const confirmApplyAll = () => {
    if (stagedApps) setApps(stagedApps)
    setStagedApps(null)
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
            aria-label={t.catalogue.back}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">{t.catalogue.title}</h1>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t.catalogue.summary.replace('{apps}', String(apps.length)).replace('{enabled}', String(enabledCount))}
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
            title={t.catalogue.batch}
            aria-label={t.catalogue.batch}
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
                placeholder={t.catalogue.search}
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
                hasActiveFilters ? 'border-[var(--color-accent)]' : ''
              }`}
              style={{
                backgroundColor:
                  hasActiveFilters
                    ? 'var(--color-accent-subtle)'
                    : 'var(--color-bg-elevated)',
                borderColor:
                  hasActiveFilters
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                color:
                  hasActiveFilters
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
              }}
              title={t.catalogue.filter}
              aria-label={t.catalogue.filter}
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Clear Filters Button (Only shown when filter active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterEnabledOnly(false)
                  setFilterActivityType('all')
                  setFilterActivityStatus('all')
                  setFilterPlatform('all')
                }}
                className="p-2 rounded-xl border transition-all cursor-pointer text-red-400"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                title={t.catalogue.clearFilters}
                aria-label={t.catalogue.clearFilters}
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
                  {t.catalogue.filterOptions}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterActive(false)}
                  className="text-[11px] text-[var(--color-text-muted)] hover:underline cursor-pointer"
                >
                  {t.catalogue.close}
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
                  <span className="font-medium text-xs">{t.catalogue.enabledOnly}</span>
                  {filterEnabledOnly && <Check className="w-3.5 h-3.5" />}
                </button>

                <Select
                  value={filterActivityType}
                  onChange={e => {
                    const value = e.target.value
                    setFilterActivityType(value === 'all' || value === 'global'
                      ? value
                      : Number(value) as ActivityType)
                  }}
                  fullWidth={true}
                >
                  <option value="all">{t.catalogue.allActivityTypes}</option>
                  <option value="global">{t.catalogue.globalDefault}</option>
                  <option value={0}>{t.catalogue.playing}</option>
                  <option value={2}>{t.catalogue.listening}</option>
                  <option value={3}>{t.catalogue.watching}</option>
                  <option value={5}>{t.catalogue.competing}</option>
                </Select>

                <Select
                  value={filterActivityStatus}
                  onChange={e => setFilterActivityStatus(e.target.value as AppStatusSelection | 'all')}
                  fullWidth={true}
                >
                  <option value="all">{t.catalogue.allActivityStatuses}</option>
                  <option value="global">{t.catalogue.globalDefault}</option>
                  <option value="online">{t.catalogue.online}</option>
                  <option value="idle">{t.catalogue.idle}</option>
                  <option value="dnd">{t.catalogue.dnd}</option>
                  <option value="offline">{t.catalogue.offline}</option>
                  <option value="invisible">{t.catalogue.invisible}</option>
                  <option value="streaming">{t.catalogue.streaming}</option>
                </Select>

                <Select
                  value={filterPlatform}
                  onChange={e => setFilterPlatform(e.target.value)}
                  fullWidth={true}
                >
                  <option value="all">{t.catalogue.allPlatforms}</option>
                  {PLATFORM_OPTIONS.map(platform => <option key={platform} value={platform}>{platform}</option>)}
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Apps List */}
        <div className="max-w-xl w-full mx-auto p-4 space-y-2 pb-24">
          {appLoadError && (
            <div
              className="rounded-xl border px-3 py-2 text-[11px]"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              {appLoadError}
            </div>
          )}
          {isLoadingApps ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t.catalogue.loading}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {apps.length === 0
                ? 'No installed apps are available to configure.'
                : 'No applications match your search or filter.'}
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
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {app.iconOverride || appIcons[app.packageName] ? (
                      <img
                        src={app.iconOverride || appIcons[app.packageName]}
                        alt={`${app.systemLabel} icon`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                        {app.systemLabel.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
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
                        {t.catalogue.original} {app.systemLabel}
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
                        title={`${t.catalogue.customize} ${app.systemLabel}`}
                        aria-label={t.catalogue.customize}
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
              title={t.catalogue.bulkConfigure}
              aria-label={t.catalogue.bulkConfigure}
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
              title={t.catalogue.cancel}
              aria-label={t.catalogue.cancel}
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
              title={t.catalogue.apply}
              aria-label={t.catalogue.apply}
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
        title={`${t.catalogue.customize} ${customizingApp?.systemLabel || t.catalogue.appUnit}`}
        subtitle={t.catalogue.profileSubtitle}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setCustomizingApp(null)} disabled={iconUploadProgress !== null}>
              {t.catalogue.cancel}
            </Button>
            <Button size="sm" variant="primary" onClick={saveCustomizeApp} disabled={iconUploadProgress !== null}>
              {t.catalogue.apply}
            </Button>
          </div>
        }
      >
        {customizingApp && (
          <div className="divide-y text-xs" style={{ borderColor: 'var(--color-border)' }}>
            {/* 3-Col Header Grid: Icon | Projected Name | Reset */}
            <div className="flex items-end gap-2.5 pb-3.5">
              {/* App icon picker and reset */}
              <div className="relative h-12 w-12 shrink-0">
                <button
                  type="button"
                  disabled={iconUploadProgress !== null}
                  onClick={() => iconPickerRef.current?.click()}
                  className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border-2 text-lg font-bold"
                  title={t.catalogue.chooseIcon}
                  aria-label={`Choose icon for ${customizingApp.systemLabel}`}
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {editIconOverride || appIcons[customizingApp.packageName] ? (
                    <img
                      src={editIconOverride || appIcons[customizingApp.packageName]}
                      alt={`${customizingApp.systemLabel} icon`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    customizingApp.systemLabel.trim().charAt(0).toUpperCase() || '?'
                  )}
                </button>
                {editIconOverride && (
                  <button
                    type="button"
                    disabled={iconUploadProgress !== null}
                    onClick={() => setEditIconOverride('')}
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border shadow"
                    title={t.catalogue.resetIcon}
                    aria-label={t.catalogue.resetIcon}
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
                <input
                  ref={iconPickerRef}
                  type="file"
                  accept="image/*"
                  disabled={iconUploadProgress !== null}
                  className="hidden"
                  onChange={handleIconFileChange}
                />
              </div>

              {/* Projected App Name input */}
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t.catalogue.projectedName}
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
                title={t.catalogue.resetLabel}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            {iconUploadError && (
              <p className="pb-2 text-[10px] text-red-400" role="alert">{iconUploadError}</p>
            )}

            {/* Activity Type Dropdown */}
            <div className="flex items-center justify-between gap-4 py-3">
                <label className="text-xs font-semibold shrink-0">{t.catalogue.activityType}</label>
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
                    <option value="global">{t.catalogue.globalDefault}</option>
                    <option value={0}>{t.catalogue.playing}</option>
                    <option value={2}>{t.catalogue.listening}</option>
                    <option value={3}>{t.catalogue.watching}</option>
                    <option value={5}>{t.catalogue.competing}</option>
                  </Select>
                </div>
              </div>

              {/* Activity Status Dropdown */}
              <div className="flex items-center justify-between gap-4 py-3">
                <label className="text-xs font-semibold shrink-0">{t.catalogue.activityStatus}</label>
                <div className="w-48 sm:w-56 shrink-0">
                  <Select
                    value={editActivityStatus}
                    onChange={e => setEditActivityStatus(e.target.value as AppStatusSelection)}
                    fullWidth={true}
                  >
                    <option value="global">{t.catalogue.globalDefault}</option>
                    <option value="online">{t.catalogue.online}</option>
                    <option value="idle">{t.catalogue.idle}</option>
                    <option value="dnd">{t.catalogue.dnd}</option>
                    <option value="offline">{t.catalogue.offline}</option>
                    <option value="invisible">{t.catalogue.invisible}</option>
                    <option value="streaming">{t.catalogue.streaming}</option>
                  </Select>
                </div>
              </div>

              {/* Platform Type Dropdown */}
              <div className="flex items-center justify-between gap-4 py-3">
                <label className="text-xs font-semibold shrink-0">{t.catalogue.platformType}</label>
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

              {/* Custom Details & State */}
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-xs">{t.catalogue.customDetailsState}</span>
                  <Switch
                    checked={editCustomDetailsEnabled}
                    onChange={setEditCustomDetailsEnabled}
                    aria-label={t.catalogue.toggleDetails}
                  />
                </div>
                {editCustomDetailsEnabled && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editCustomDetails}
                      onChange={e => setEditCustomDetails(e.target.value)}
                      placeholder={`${t.catalogue.details} (AppDetails)`}
                      className="w-full h-9 px-3 rounded-xl border text-xs focus:outline-hidden"
                      style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
                    />
                    <input
                      type="text"
                      value={editCustomState}
                      onChange={e => setEditCustomState(e.target.value)}
                      placeholder={`${t.catalogue.state} (AppState)`}
                      className="w-full h-9 px-3 rounded-xl border text-xs focus:outline-hidden"
                      style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
                    />
                  </div>
                )}
              </div>

              {/* Custom Small Text and Image */}
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-xs">{t.catalogue.customSmallImage}</span>
                  <Switch
                    checked={editCustomSmallEnabled}
                    onChange={setEditCustomSmallEnabled}
                    aria-label={t.catalogue.toggleSmall}
                  />
                </div>
                {editCustomSmallEnabled && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editCustomSmallText}
                      onChange={e => setEditCustomSmallText(e.target.value)}
                      placeholder={`${t.catalogue.smallText} (AppSmallText)`}
                      className="w-full h-9 px-3 rounded-xl border text-xs focus:outline-hidden"
                      style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editCustomSmallUrl}
                        onChange={e => setEditCustomSmallUrl(e.target.value)}
                        placeholder={`${t.catalogue.smallImageUrl} (AppSmallUrl)`}
                        className="flex-1 min-w-0 h-9 px-3 rounded-xl border text-xs focus:outline-hidden"
                        style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
                      />
                      <button
                        type="button"
                        disabled={iconUploadProgress !== null}
                        onClick={() => smallImagePickerRef.current?.click()}
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border"
                        style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                        title={t.catalogue.uploadImage}
                        aria-label={t.catalogue.uploadImage}
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input
                        ref={smallImagePickerRef}
                        type="file"
                        accept="image/*"
                        disabled={iconUploadProgress !== null}
                        className="hidden"
                        onChange={handleSmallImageFileChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Buttons Toggle */}
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-semibold block text-xs">{t.catalogue.customButtons}</span>
                    <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {t.catalogue.customButtonDesc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch
                      checked={editCustomButtons}
                      onChange={setEditCustomButtons}
                      aria-label={t.catalogue.toggleButtons}
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
                    <span className="text-[11px] font-semibold">{t.configFields.button1}</span>
                    <input
                      type="text"
                      value={button1Label}
                      onChange={e => setButton1Label(e.target.value)}
                      placeholder={t.catalogue.buttonLabel}
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
                      placeholder={t.catalogue.urlExample}
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
                    <span className="text-[11px] font-semibold">{t.configFields.button2}</span>
                    <input
                      type="text"
                      value={button2Label}
                      onChange={e => setButton2Label(e.target.value)}
                      placeholder={t.catalogue.buttonLabel}
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
                      placeholder={t.catalogue.urlExample}
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
        title={`${t.catalogue.bulkConfigure} (${selectedPackages.size} ${t.catalogue.appsUnit})`}
        subtitle={t.catalogue.bulkSubtitle}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsBatchModalOpen(false)}>
              {t.catalogue.cancel}
            </Button>
            <Button size="sm" variant="primary" onClick={applyBatchChanges}>
              {t.catalogue.stageChanges}
            </Button>
          </div>
        }
      >
        <div className="divide-y text-xs" style={{ borderColor: 'var(--color-border)' }}>
          {/* Bulk Toggle Status */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">{t.catalogue.presenceToggle}</label>
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
                <option value="keep">{t.catalogue.keepCurrent}</option>
                <option value="enable">{t.catalogue.enableAll}</option>
                <option value="disable">{t.catalogue.disableAll}</option>
              </Select>
            </div>
          </div>

          {/* Bulk Activity Type */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">{t.catalogue.activityType}</label>
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
                <option value="keep">{t.catalogue.keepCurrent}</option>
                <option value="global">{t.catalogue.globalDefault}</option>
                <option value={0}>{t.catalogue.playing}</option>
                <option value={2}>{t.catalogue.listening}</option>
                <option value={3}>{t.catalogue.watching}</option>
                <option value={5}>{t.catalogue.competing}</option>
              </Select>
            </div>
          </div>

          {/* Bulk Activity Status */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">{t.catalogue.activityStatus}</label>
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
                <option value="keep">{t.catalogue.keepCurrent}</option>
                <option value="global">{t.catalogue.globalDefault}</option>
                <option value="online">{t.catalogue.online}</option>
                <option value="idle">{t.catalogue.idle}</option>
                <option value="dnd">{t.catalogue.dnd}</option>
                <option value="offline">{t.catalogue.offline}</option>
                <option value="invisible">{t.catalogue.invisible}</option>
                <option value="streaming">{t.catalogue.streaming}</option>
              </Select>
            </div>
          </div>

          {/* Bulk Platform Type */}
          <div className="flex items-center justify-between gap-4 py-3">
            <label className="font-semibold text-xs shrink-0">{t.catalogue.platformType}</label>
            <div className="w-48 sm:w-56 shrink-0">
              <Select
                value={batchPlatform}
                onChange={e => setBatchPlatform(e.target.value)}
                fullWidth={true}
              >
                <option value="keep">{t.catalogue.keepCurrent}</option>
                {PLATFORM_OPTIONS.map(platform => <option key={platform} value={platform}>{platform}</option>)}
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
        title={t.catalogue.applyBatchTitle}
        subtitle={t.catalogue.confirmation}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsBatchConfirmOpen(false)}>
              {t.catalogue.cancel}
            </Button>
            <Button size="sm" variant="primary" onClick={confirmApplyAll}>
              {t.catalogue.confirmApply}
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t.catalogue.applyMessage} <strong>{selectedPackages.size}</strong> {t.catalogue.selectedApps}
        </p>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: Discard Unsaved Batch Changes Confirmation */}
      {/* ======================================================== */}
      <Modal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title={t.catalogue.discardBatch}
        subtitle={t.catalogue.unsavedBatch}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsDiscardConfirmOpen(false)}>
              {t.catalogue.keepEditing}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setIsDiscardConfirmOpen(false)
                setIsBatchMode(false)
                setSelectedPackages(new Set())
                setHasStagedChanges(false)
                setStagedApps(null)
              }}
            >
              {t.catalogue.discardChanges}
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {t.catalogue.discardMessage}
        </p>
      </Modal>

      {iconUploadProgress !== null && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[60] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border p-3 shadow-xl"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-base)',
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2">
              {iconUploadProgress < 100 && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />}
              {t.catalogue.uploadProgress}
            </span>
            <span className="font-mono text-[var(--color-text-muted)]">{iconUploadProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-150"
              style={{ width: `${iconUploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
