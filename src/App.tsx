import { useState, useEffect } from 'react'
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
import { Info } from 'lucide-react'

const ONBOARDING_KEY = 'kd_onboarding_completed'

type Subpage =
  | 'app-catalogue'
  | 'app-status-fields'
  | 'app-presence-config'
  | 'media-status-fields'
  | 'media-presence-config'
  | null

function ToastViewport() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    const handleToast = (event: Event) => {
      const toastEvent = event as CustomEvent<{ message?: string }>
      if (!toastEvent.detail?.message) return
      setMessage(toastEvent.detail.message)
      if (timeout !== undefined) clearTimeout(timeout)
      timeout = setTimeout(() => setMessage(''), 3000)
    }

    window.addEventListener('app-toast', handleToast)
    return () => {
      window.removeEventListener('app-toast', handleToast)
      clearTimeout(timeout)
    }
  }, [])

  if (!message) return null

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
      <span>{message}</span>
    </div>
  )
}

function MainShell() {
  const [activeTab, setActiveTab] = useState<NavTab>('service')
  const [currentSubpage, setCurrentSubpage] = useState<Subpage>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logs, setLogs] = useState(getLogs())
  const {
    accounts,
    activeAccount,
    addAccount,
    removeAccount,
    setActiveAccount,
    unuseAccount,
  } = useAccounts()

  // Sync live logs into modal state when opened
  useEffect(() => {
    const all = getLogs()
    setLogs(all)
    // eslint-disable-next-line no-console
  }, [isLogModalOpen])

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
            onNavigateToCatalogue={() => setCurrentSubpage('app-catalogue')}
            onNavigateToAppStatusFields={() => setCurrentSubpage('app-status-fields')}
            onNavigateToAppPresenceConfig={() => setCurrentSubpage('app-presence-config')}
            onNavigateToMediaStatusFields={() => setCurrentSubpage('media-status-fields')}
            onNavigateToMediaPresenceConfig={() => setCurrentSubpage('media-presence-config')}
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
        title="Application Logs"
        subtitle="Live diagnostics output"
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
            <div className="text-zinc-400">[INFO] No logs yet. Open Discord login or perform actions to generate logs.</div>
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
