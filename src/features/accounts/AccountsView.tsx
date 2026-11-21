import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  UserX,
  LogOut,
  Trash2,
  ArrowLeftRight,
  Plus,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import type { DiscordAccount } from '../../types'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { fetchDiscordUserProfile, buildDiscordOAuthUrl, addLog } from './discordAuth'
import { DiscordIcon } from '../../components/DiscordIcon'

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
  const [loginError, setLoginError] = useState('')
  const [accountToDelete, setAccountToDelete] = useState<DiscordAccount | null>(null)
  const [isValidatingToken, setIsValidatingToken] = useState(false)

  // Listen for Discord token captured from native In-App Login Portal
  useEffect(() => {
    const handleCaptured = async (e: any) => {
      const token = e.detail?.token
      if (token) {
        addLog('info', `AccountsView: token captured from native portal (len=${token.length})`)
        setIsValidatingToken(true)
        setLoginError('')
        const result = await fetchDiscordUserProfile(token)
        setIsValidatingToken(false)

        if (result.success && result.account) {
          addLog('info', `AccountsView: native portal login SUCCESS id=${result.account.id} username=${result.account.username}`)
          onAddAccount(result.account)
          setIsLoginModalOpen(false)
        } else {
          addLog('error', `AccountsView: native portal login FAILED ${result.error}`)
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
    // Android native bridge: opens in-app WebView OAuth2 portal
    if (window.AndroidNativeBridge?.openDiscordLoginPortal) {
      window.AndroidNativeBridge.openDiscordLoginPortal()
      return
    }

    // Web / dev mode: OAuth2 Implicit Flow via popup
    const clientId = '1572590527562391713'
    const redirectUri = 'https://discord.com'
    const oauthUrl = buildDiscordOAuthUrl({ clientId, redirectUri })

    const popup = window.open(
      oauthUrl,
      'discord-auth',
      'width=500,height=600,left=100,top=100'
    )

    if (!popup) {
      alert(
        'Popup was blocked by your browser. Please allow popups for this site, ' +
        'then try opening the Discord login portal again.'
      )
      return
    }

    // Detect when the popup navigates (Discord redirects to discord.com#access_token=...)
    const pollPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(pollPopup)
          setLoginError('Discord login window closed before sign-in completed. Try the portal again.')
        }
      } catch {
        // Cross-origin access blocked — Discord handled the redirect
        clearInterval(pollPopup)
        setLoginError('Discord login window closed before sign-in completed. Try the portal again.')
      }
    }, 1000)
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
            <DiscordIcon className="w-4 h-4 fill-white" />
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
            <DiscordIcon className="w-5 h-5 fill-white" />
            <Plus className="w-3.5 h-3.5 absolute -top-1.5 -right-2 text-white stroke-[3]" />
          </div>
        </button>
      )}

      {/* Discord Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false)
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
                icon={<DiscordIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenLoginPortal}
              >
                Open Portal
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-xl border p-2.5 text-[11px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <p>
                The Discord OAuth application is only used to obtain your access token through the redirect link. Kruzty Dynamics saves the token on this device to identify your account and bridge Rich Presence from this app to your Discord profile. It does not send messages or perform other actions as you. You can revoke authorization anytime in Discord User Settings → Authorized Apps.
              </p>
            </div>
          </div>

          {isValidatingToken && (
            <p className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Verifying your Discord account…
            </p>
          )}
          {loginError && <p className="text-xs text-red-400">{loginError}</p>}
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
