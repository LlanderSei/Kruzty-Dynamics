import { useState, useEffect, useRef } from 'react'
import { ThemeProvider } from './features/settings/ThemeContext'
import { OnboardingScreen } from './features/onboarding/OnboardingScreen'
import { MainHeader } from './components/MainHeader'
import { NavigationFooter, type NavTab } from './components/NavigationFooter'
import { ServiceDashboard } from './features/dashboard/ServiceDashboard'
import { AppCatalogue } from './features/apps-catalog/AppCatalogue'
import { AppStatusFieldConfig } from './features/templates/AppStatusFieldConfig'
import { MediaStatusFieldConfig } from './features/templates/MediaStatusFieldConfig'
import { AppPresenceConfig } from './features/dynamics/AppPresenceConfig'
import { MediaPresenceConfig } from './features/dynamics/MediaPresenceConfig'
import { AccountsView } from './features/accounts/AccountsView'
import { SettingsView } from './features/settings/SettingsView'
import { useAccounts } from './features/accounts/useAccounts'
import { Modal } from './components/Modal'
import { getLogs } from './features/accounts/discordAuth'
import { Copy, Download, Info } from 'lucide-react'
import { addLog } from './features/accounts/discordAuth'
import { collectPresenceConfig } from './features/dashboard/serviceConfig'
import { uploadDetectedImage } from './features/dashboard/detectedImageUpload'
import { useTranslation } from './i18n/useTranslation'
import { getVersion } from '@tauri-apps/api/app'
import { findNewerRelease } from './utils/appUpdates'

const ONBOARDING_KEY = 'kd_onboarding_completed'
let hasCheckedForUpdatesThisLaunch = false

type Subpage =
  | 'app-catalogue'
  | 'app-status-fields'
  | 'app-presence-config'
  | 'media-status-fields'
  | 'media-presence-config'
  | null

function ToastViewport() {
  const [message, setMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState<{ sourceKey: string; progress: number | null } | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    const handleToast = (event: Event) => {
      const toastEvent = event as CustomEvent<{ message?: string }>
      if (!toastEvent.detail?.message) return
      setMessage(toastEvent.detail.message)
      if (timeout !== undefined) clearTimeout(timeout)
      timeout = setTimeout(() => setMessage(''), 3000)
    }
    const handleUploadProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ sourceKey: string; progress: number | null }>).detail
      setUploadProgress(detail?.progress == null ? null : detail)
    }

    window.addEventListener('app-toast', handleToast)
    window.addEventListener('detected-image-upload-progress', handleUploadProgress)
    return () => {
      window.removeEventListener('app-toast', handleToast)
      window.removeEventListener('detected-image-upload-progress', handleUploadProgress)
      clearTimeout(timeout)
    }
  }, [])

  if (!message && !uploadProgress) return null
  const uploadLabel = uploadProgress?.sourceKey.replace(/^(app|media):/, '').replaceAll('.', ' ')

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[100] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-base)',
      }}
    >
        <Info className="h-4 w-4 shrink-0 text-amber-400" />
        <span>{uploadProgress ? `Uploading ${uploadLabel} image… ${uploadProgress.progress}%` : message}</span>
    </div>
  )
}

function LaunchUpdateCheck() {
  const { t } = useTranslation()

  useEffect(() => {
    if (hasCheckedForUpdatesThisLaunch) return
    hasCheckedForUpdatesThisLaunch = true

    void getVersion()
      .then(version => findNewerRelease(version))
      .then(release => {
        if (!release) return
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: t.toast.newVersionAvailable },
        }))
      })
      .catch(() => {})
  }, [t.toast.newVersionAvailable])

  return null
}

function MainShell() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<NavTab>('service')
  const [currentSubpage, setCurrentSubpage] = useState<Subpage>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logs, setLogs] = useState(getLogs())
  const [detectedStatus, setDetectedStatus] = useState<{
    active?: boolean
    title?: string
    line1?: string
    line2?: string
    domain?: string
    packageName?: string
    activityType?: number
    playbackState?: string
    appName?: string
    mediaType?: string
    mediaPositionMs?: number
    mediaDurationMs?: number
    mediaUpdatedAt?: number
    playbackRate?: number
    sessionStartedAt?: number
    buttons?: Array<{ label: string; url: string }>
    smallText?: string
    smallImage?: string
    bigText?: string
    bigImage?: string
    iconUrl?: string
    iconData?: string
  } | null>(null)
  const uploadingImageKeys = useRef(new Set<string>())
  const {
    accounts,
    activeAccount,
    addAccount,
    removeAccount,
    setActiveAccount,
    unuseAccount,
  } = useAccounts()

  useEffect(() => {
    const bridge = (window as Window & { AndroidNativeBridge?: { isPresenceServiceRunning?: () => boolean; startPresenceService?: (config: string) => void } }).AndroidNativeBridge
    const refreshConfig = (event: Event) => {
      const linkedAccountId = (event as CustomEvent<{ activeAccountId?: string }>).detail?.activeAccountId
      if (bridge?.isPresenceServiceRunning?.()) bridge.startPresenceService?.(collectPresenceConfig(linkedAccountId || activeAccount?.id))
    }
    window.addEventListener('kd-presence-config-changed', refreshConfig)
    return () => window.removeEventListener('kd-presence-config-changed', refreshConfig)
  }, [activeAccount?.id])

  useEffect(() => {
    const bridge = (window as Window & { AndroidNativeBridge?: { isPresenceServiceRunning?: () => boolean; startPresenceService?: (config: string) => void } }).AndroidNativeBridge
    if (bridge?.isPresenceServiceRunning?.()) {
      bridge.startPresenceService?.(collectPresenceConfig(activeAccount?.id))
    }
  }, [activeAccount?.id])

  // Sync live logs into modal state when opened
  useEffect(() => {
    const handleLog = (event: Event) => {
      const detail = (event as CustomEvent<{ level?: string; message?: string }>).detail
      if (!detail?.message) return
      addLog(detail.level === 'warn' || detail.level === 'error' ? detail.level : 'info', detail.message)
      setLogs(getLogs())
    }
    const handleStatus = (event: Event) => {
      const status = (event as CustomEvent<typeof detectedStatus>).detail
      setDetectedStatus(status)
      if (!status?.iconData || !status.packageName || (status.domain !== 'app' && status.domain !== 'media')) return
      const sourceKey = `${status.domain}:${status.packageName}`
      if (uploadingImageKeys.current.has(sourceKey)) return
      uploadingImageKeys.current.add(sourceKey)
      void uploadDetectedImage(
        status.iconData,
        status.domain === 'media' ? 'media_art' : 'app_icon',
        sourceKey
      ).catch(() => {
        addLog('warn', 'Could not upload detected app or media image to ImgBB')
      }).finally(() => uploadingImageKeys.current.delete(sourceKey))
    }
    window.addEventListener('dynamicsLog', handleLog)
    window.addEventListener('dynamicsStatusUpdated', handleStatus)
    const bridge = (window as Window & { AndroidNativeBridge?: { getPresenceServiceStatus?: () => string } }).AndroidNativeBridge
    try {
      const storedStatus = JSON.parse(bridge?.getPresenceServiceStatus?.() || '{}') as typeof detectedStatus
      if (storedStatus?.domain) setDetectedStatus(storedStatus)
    } catch {
      // Ignore an absent or malformed native status snapshot.
    }
    return () => {
      window.removeEventListener('dynamicsLog', handleLog)
      window.removeEventListener('dynamicsStatusUpdated', handleStatus)
    }
  }, [])

  useEffect(() => {
    const all = getLogs()
    setLogs(all)
    // eslint-disable-next-line no-console
  }, [isLogModalOpen])

  const buildLogText = () => logs.map(entry => `[${new Date(entry.ts).toISOString()}] [${entry.level.toUpperCase()}] ${entry.msg}`).join('\n')
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(buildLogText())
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Logs copied to clipboard.' } }))
    } catch {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Could not copy logs.' } }))
    }
  }
  const exportLogs = () => {
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`
    const filename = `KruztyDynamicsLogs_${stamp}.txt`
    const bridge = (window as Window & { AndroidNativeBridge?: { exportLogs?: (filename: string, content: string) => void } }).AndroidNativeBridge
    if (bridge?.exportLogs) {
      bridge.exportLogs(filename, buildLogText())
      return
    }
    const url = URL.createObjectURL(new Blob([buildLogText()], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Render Subpages when navigated into (Footer is hidden for maximum screen space)
  if (currentSubpage === 'app-catalogue') {
    return <AppCatalogue onBack={() => setCurrentSubpage(null)} />
  }

  if (currentSubpage === 'app-status-fields') {
    return <AppStatusFieldConfig onBack={() => setCurrentSubpage(null)} />
  }

  if (currentSubpage === 'app-presence-config') {
    return (
      <AppPresenceConfig
        onBack={() => setCurrentSubpage(null)}
        onNavigateToCatalogue={() => setCurrentSubpage('app-catalogue')}
        onNavigateToStatusFields={() => setCurrentSubpage('app-status-fields')}
      />
    )
  }

  if (currentSubpage === 'media-status-fields') {
    return <MediaStatusFieldConfig onBack={() => setCurrentSubpage(null)} />
  }

  if (currentSubpage === 'media-presence-config') {
    return (
      <MediaPresenceConfig
        onBack={() => setCurrentSubpage(null)}
        onNavigateToStatusFields={() => setCurrentSubpage('media-status-fields')}
      />
    )
  }

  return (
    <div
      className="h-screen w-screen flex flex-col justify-between overflow-hidden select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-base)',
      }}
    >
      {/* Main Header */}
      <MainHeader
        activeTab={activeTab}
        activeAccount={activeAccount}
        accountCount={accounts.length}
        onOpenLogs={() => setIsLogModalOpen(true)}
        onAvatarClick={() => setActiveTab('accounts')}
      />

      {/* Main Body Container (Only middle scrolls if content overflows) */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain max-w-xl w-full mx-auto p-4 flex flex-col">
        {activeTab === 'service' && (
          <ServiceDashboard
            activeAccountId={activeAccount?.id}
            onNavigateToCatalogue={() => setCurrentSubpage('app-catalogue')}
            onNavigateToAppStatusFields={() => setCurrentSubpage('app-status-fields')}
            onNavigateToAppPresenceConfig={() => setCurrentSubpage('app-presence-config')}
            onNavigateToMediaStatusFields={() => setCurrentSubpage('media-status-fields')}
            onNavigateToMediaPresenceConfig={() => setCurrentSubpage('media-presence-config')}
            status={detectedStatus}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            activeAccount={activeAccount}
            onAddAccount={addAccount}
            onRemoveAccount={removeAccount}
            onSetActiveAccount={setActiveAccount}
            onUnuseAccount={unuseAccount}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer Navigation Bar */}
      <NavigationFooter
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
      />

      {/* Logs Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={t.logs.title}
        subtitle={t.logs.subtitle}
        headerActions={
          <>
            <button type="button" onClick={() => void copyLogs()} className="p-1.5 rounded-lg" aria-label={t.logs.copy} title={t.logs.copy}><Copy className="w-4 h-4" /></button>
            <button type="button" onClick={exportLogs} className="p-1.5 rounded-lg" aria-label={t.logs.export} title={t.logs.export}><Download className="w-4 h-4" /></button>
          </>
        }
      >
        <div
          className="p-3 rounded-xl border font-mono text-xs space-y-1 overflow-x-auto max-h-[60vh]"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          {logs.length === 0 ? (
            <div className="text-zinc-400">{t.logs.empty}</div>
          ) : (
            logs.map((entry, i) => {
              const color =
                entry.level === 'error'
                  ? '#ef4444'
                  : entry.level === 'warn'
                    ? '#fbbf24'
                    : '#10b981'
              return (
                <div
                  key={i}
                  className="break-all"
                  style={{ color }}
                >
                  [{new Date(entry.ts).toLocaleTimeString()}] {entry.msg}
                </div>
              )
            })
          )}
          <div className="pt-2 border-t text-zinc-500">
            [INFO] Active tab: {activeTab} | Discord accounts: {accounts.length}
          </div>
          {activeAccount && (
            <div className="text-emerald-400">
              [INFO] Active Identity: {activeAccount.displayName} ({activeAccount.username})
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  })

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasCompletedOnboarding(true)
  }

  return (
    <ThemeProvider>
      <>
        <LaunchUpdateCheck />
        {!hasCompletedOnboarding ? (
          <OnboardingScreen onComplete={handleComplete} />
        ) : (
          <MainShell />
        )}
        <ToastViewport />
      </>
    </ThemeProvider>
  )
}
