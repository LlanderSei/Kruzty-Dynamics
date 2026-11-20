import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  UserX,
  LogOut,
  Trash2,
  ArrowLeftRight,
  Plus,
  MessageSquare,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
} from 'lucide-react'
import type { DiscordAccount } from '../../types'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { fetchDiscordUserProfile } from './discordAuth'

interface AccountsViewProps {
  accounts: DiscordAccount[]
  activeAccount: DiscordAccount | null
  onAddAccount: (account: DiscordAccount) => void
  onRemoveAccount: (id: string) => void
  onSetActiveAccount: (id: string) => void
  onUnuseAccount: () => void
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  activeAccount,
  onAddAccount,
  onRemoveAccount,
  onSetActiveAccount,
  onUnuseAccount,
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [discordToken, setDiscordToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showTokenHelp, setShowTokenHelp] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<DiscordAccount | null>(null)
  const [isValidatingToken, setIsValidatingToken] = useState(false)

  // Listen for Discord token captured from native In-App Login Portal
  useEffect(() => {
    const handleCaptured = async (e: any) => {
      const token = e.detail?.token
      if (token) {
        setIsValidatingToken(true)
        setLoginError('')
        const result = await fetchDiscordUserProfile(token)
        setIsValidatingToken(false)

        if (result.success && result.account) {
          onAddAccount(result.account)
          setIsLoginModalOpen(false)
        } else {
          const fallbackAccount: DiscordAccount = {
            id: String(Date.now()),
            username: 'DiscordUser',
            displayName: 'Discord User',
            token: token.trim(),
            isActive: accounts.length === 0,
            avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=discord',
          }
          onAddAccount(fallbackAccount)
          setIsLoginModalOpen(false)
        }
      }
    }

    window.addEventListener('discordTokenCaptured', handleCaptured)
    return () => window.removeEventListener('discordTokenCaptured', handleCaptured)
  }, [accounts.length, onAddAccount])

  const inactiveAccounts = accounts.filter(a => !a.isActive)

  const handleOpenLoginPortal = () => {
    if (window.AndroidNativeBridge?.openDiscordLoginPortal) {
      window.AndroidNativeBridge.openDiscordLoginPortal()
    } else if (window.AndroidNativeBridge?.openExternalUrl) {
      window.AndroidNativeBridge.openExternalUrl('https://discord.com/login')
    } else {
      window.open('https://discord.com/login', '_blank')
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discordToken.trim()) {
      setLoginError('Please enter a Discord token.')
      return
    }

    setIsValidatingToken(true)
    setLoginError('')

    const result = await fetchDiscordUserProfile(discordToken.trim())
    setIsValidatingToken(false)

    if (result.success && result.account) {
      onAddAccount(result.account)
      setDiscordToken('')
      setLoginError('')
      setIsLoginModalOpen(false)
    } else {
      setLoginError(result.error || 'Failed to authenticate token with Discord.')
    }
  }

  const handleQuickDemo = () => {
    const demoNames = ['KruztyPilot', 'EchoWave', 'CyberLynx', 'Starlight']
    const chosenName = demoNames[accounts.length % demoNames.length]

    const demoAccount: DiscordAccount = {
      id: String(Date.now()),
      username: chosenName.toLowerCase(),
      displayName: chosenName,
      token: `demo_token_${Math.random().toString(36).substring(2, 12)}`,
      isActive: accounts.length === 0,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${chosenName}`,
    }

    onAddAccount(demoAccount)
    setDiscordToken('')
    setLoginError('')
    setIsLoginModalOpen(false)
  }

  const confirmDelete = () => {
    if (accountToDelete) {
      onRemoveAccount(accountToDelete.id)
      setAccountToDelete(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative w-full h-full pb-20">
      {/* State 1: No accounts logged in at all */}
      {accounts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 my-auto">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            <UserX className="w-8 h-8 opacity-70" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold">No account logged in yet.</h3>
            <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
              Connect your Discord account to begin projecting Rich Presence statuses for games, apps, and media.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Login Discord</span>
          </button>
        </div>
      )}

      {/* State 2: At least 1 account exists */}
      {accounts.length > 0 && (
        <div className="space-y-6">
          {/* Top Section: Currently Logged In / Used Account */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Current Logged In Account
              </span>
              {activeAccount && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Presence
                </span>
              )}
            </div>

            {activeAccount ? (
              <div
                className="p-4 rounded-2xl border transition-all shadow-sm"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-accent-border)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Circle Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={activeAccount.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar'}
                      alt={activeAccount.username}
                      className="w-12 h-12 rounded-full object-cover border-2"
                      style={{ borderColor: 'var(--color-accent)' }}
                    />
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 bg-emerald-500"
                      style={{ borderColor: 'var(--color-bg-surface)' }}
                    />
                  </div>

                  {/* Middle: Name & Username */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold tracking-tight truncate leading-tight">
                      {activeAccount.displayName || activeAccount.username}
                    </h4>
                    <p
                      className="text-xs truncate font-mono mt-0.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      @{activeAccount.username}
                    </p>
                  </div>

                  {/* Rightmost: Actions (Unuse / Drop, Logout) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={onUnuseAccount}
                      title="Unuse / Drop from active presence"
                      aria-label="Unuse Account"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer hover:border-amber-500/50 hover:text-amber-500 active:scale-95"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Unuse</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountToDelete(activeAccount)}
                      title="Logout account"
                      aria-label="Logout Account"
                      className="p-1.5 rounded-xl border transition-all cursor-pointer hover:border-red-500/50 hover:text-red-500 active:scale-95"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-2xl border text-center space-y-1.5"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <UserCheck className="w-5 h-5 mx-auto opacity-50" />
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  No selected account. Choose one of the logged in accounts below.
                </p>
              </div>
            )}
          </section>

          {/* Bottom Section: Accounts List */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Accounts List ({inactiveAccounts.length})
              </span>
            </div>

            {inactiveAccounts.length === 0 ? (
              <div
                className="p-5 rounded-2xl border text-center my-2"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  You can add more accounts by clicking the Discord button below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {inactiveAccounts.map(account => (
                  <div
                    key={account.id}
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {/* Circle Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={account.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar'}
                        alt={account.username}
                        className="w-10 h-10 rounded-full object-cover border"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>

                    {/* Name & Username */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold tracking-tight truncate leading-tight">
                        {account.displayName || account.username}
                      </h4>
                      <p
                        className="text-xs truncate font-mono mt-0.5"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        @{account.username}
                      </p>
                    </div>

                    {/* Actions: Switch, Logout */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSetActiveAccount(account.id)}
                        title="Switch / Activate presence"
                        aria-label="Switch Account"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-base)',
                        }}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Switch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountToDelete(account)}
                        title="Logout account"
                        aria-label="Logout Account"
                        className="p-1.5 rounded-xl border transition-all cursor-pointer hover:border-red-500/50 hover:text-red-500 active:scale-95"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* FAB Discord Button (Shows only if at least 1 account is logged in) */}
      {accounts.length > 0 && (
        <button
          type="button"
          onClick={() => setIsLoginModalOpen(true)}
          className="fixed right-5 bottom-20 z-30 p-3.5 rounded-full text-white shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--color-accent)' }}
          title="Add Discord Account"
          aria-label="Add Discord Account"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-white" />
            <Plus className="w-3.5 h-3.5 absolute -top-1.5 -right-2 text-white stroke-[3]" />
          </div>
        </button>
      )}

      {/* Discord Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false)
          setDiscordToken('')
          setLoginError('')
        }}
        title="Connect Discord Account"
      >
        <div className="space-y-4">
          {/* Quick In-App Login Portal Card */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Discord Login Portal</span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Sign in directly via the in-app Discord portal
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={<MessageSquare className="w-3.5 h-3.5" />}
                onClick={handleOpenLoginPortal}
              >
                Open Portal
              </Button>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Or provide your Discord User Token to authenticate and control your online Rich Presence.
            </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="discord-token-input"
                className="text-xs font-semibold"
                style={{ color: 'var(--color-text-base)' }}
              >
                Discord Token
              </label>
              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                style={{ color: 'var(--color-accent)' }}
              >
                <HelpCircle className="w-3 h-3" />
                <span>How to find</span>
              </button>
            </div>

            <div className="relative">
              <input
                id="discord-token-input"
                type={showToken ? 'text' : 'password'}
                value={discordToken}
                onChange={e => {
                  setDiscordToken(e.target.value)
                  if (loginError) setLoginError('')
                }}
                placeholder="Paste mfa.xxxx or user token..."
                className="w-full px-3 py-2 pr-10 text-xs rounded-xl border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: loginError ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text-base)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {loginError && <p className="text-[11px] text-red-500">{loginError}</p>}
          </div>

          {showTokenHelp && (
            <div
              className="p-3 rounded-xl border text-[11px] space-y-1"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              <p className="font-semibold text-zinc-300">Finding your token:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Log in to Discord via your mobile or desktop browser.</li>
                <li>Open DevTools (F12 or inspect), head to Network tab.</li>
                <li>Send a message or click channels, check request headers for `authorization`.</li>
              </ol>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isValidatingToken}
              icon={isValidatingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isValidatingToken ? 'Verifying with Discord...' : 'Login Account'}
            </Button>

            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Demo Account (Instant Test)</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>

      {/* Delete / Logout Confirmation Modal */}
      <Modal
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        title="Logout Account"
      >
        <div className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Are you sure you want to remove account{' '}
            <strong style={{ color: 'var(--color-text-base)' }}>
              @{accountToDelete?.username}
            </strong>
            ? This will remove saved credentials from this device.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAccountToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Confirm Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
