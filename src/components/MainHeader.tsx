import React from 'react'
import { ScrollText } from 'lucide-react'
import type { DiscordAccount } from '../types'
import type { NavTab } from './NavigationFooter'
import { useTranslation } from '../i18n/useTranslation'

interface MainHeaderProps {
  activeTab: NavTab
  activeAccount?: DiscordAccount | null
  accountCount: number
  onOpenLogs?: () => void
  onAvatarClick?: () => void
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  activeTab,
  activeAccount,
  accountCount,
  onOpenLogs,
  onAvatarClick,
}) => {
  const { t } = useTranslation()

  // Title & Subtext based on active tab
  let title = t.header.welcome
  let subtext = t.header.dashboardSubtitle

  if (activeTab === 'service') {
    const name = activeAccount?.displayName || activeAccount?.username
    title = name ? t.header.welcomeNamed.replace('{name}', name) : t.header.welcome
    subtext = t.header.dashboardSubtitle
  } else if (activeTab === 'accounts') {
    title = t.accounts.title
    subtext =
      accountCount === 0
        ? t.accounts.noAccounts
      : (accountCount === 1 ? t.header.accountsLoggedInOne : t.header.accountsLoggedInMany)
        .replace('{n}', String(accountCount))
  } else if (activeTab === 'settings') {
    title = t.settings.title
    subtext = t.settings.subtitle
  }

  return (
    <header
      className="border-b px-4 pb-3 flex items-center justify-between shrink-0 z-20 backdrop-blur-md select-none transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
        paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
      }}
    >
      {/* Left Column: Title and Subtext */}
      <div className="flex-1 min-w-0 pr-3">
        <h1 className="text-lg font-bold tracking-tight truncate leading-tight">
          {title}
        </h1>
        <p
          className="text-xs truncate mt-0.5 leading-snug"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {subtext}
        </p>
      </div>

      {/* Right Anchored Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Log Icon Button */}
        <button
          type="button"
          onClick={onOpenLogs}
          className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
          title={t.header.liveLogs}
          aria-label={t.header.viewLogs}
        >
          <ScrollText className="w-4 h-4" />
        </button>

        {/* User Circle Avatar: Only appears if there's currently used/logged in account */}
        {activeAccount && (
          <button
            type="button"
            onClick={onAvatarClick}
            className="relative p-0.5 rounded-full border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
            style={{
              borderColor: 'var(--color-accent)',
            }}
            title={`Logged in as ${activeAccount.displayName || activeAccount.username}`}
            aria-label="User Profile"
          >
            <img
              src={activeAccount.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt={activeAccount.username}
              className="w-7 h-7 rounded-full object-cover"
            />
            {/* Online indicator */}
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 bg-emerald-500"
              style={{ borderColor: 'var(--color-bg-surface)' }}
            />
          </button>
        )}
      </div>
    </header>
  )
}
