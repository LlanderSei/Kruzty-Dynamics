import React, { useState, useRef, useEffect } from 'react'
import {
  Bell,
  Activity,
  BatteryCharging,
  Palette,
  Globe,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Divider } from '../../components/Divider'
import { DiscordIcon } from '../../components/DiscordIcon'
import { usePermissions } from '../permissions/usePermissions'
import { useAccounts } from '../accounts/useAccounts'
import { useTheme, PRESET_ACCENT_COLORS, DEFAULT_ACCENT_COLOR } from '../settings/ThemeContext'
import { useAppSettings } from '../settings/useAppSettings'
import { useTranslation } from '../../i18n/useTranslation'
import { fetchDiscordUserProfile, buildDiscordOAuthUrl, addLog } from '../accounts/discordAuth'
import type { DiscordAccount } from '../../types'
import { openExternalUrl } from '../../utils/externalLinks'

interface OnboardingScreenProps {
  onComplete: () => void
}

type ModalType =
  | 'perm_notification'
  | 'perm_usage'
  | 'perm_battery'
  | 'perm_post_notifications'
  | 'discord_login'
  | 'theme'
  | 'language'
  | null

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { permissions, requestPermission } = usePermissions()
  const { accounts, activeAccount, addAccount, removeAccount } = useAccounts()
  const { theme, setMode, setAccentColor } = useTheme()
  const { settings, setLanguage } = useAppSettings()
  const { t } = useTranslation()

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Discord Login state in modal
  const [loginError, setLoginError] = useState('')
  const [isValidatingToken, setIsValidatingToken] = useState(false)

  // Listen for Discord token captured from native In-App Login Portal
  useEffect(() => {
    const handleSocialAccountLinked = (event: Event) => {
      const account = (event as CustomEvent<DiscordAccount>).detail
      if (!account?.id) return
      if (accounts.some(existing => existing.id === account.id)) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: `Presence link saved for ${account.displayName || account.username}.` },
        }))
      } else {
        addAccount({ ...account, socialSdkLinked: true, isActive: accounts.length === 0 })
      }
      window.dispatchEvent(new CustomEvent('kd-presence-config-changed', {
        detail: { activeAccountId: accounts.length === 0 ? account.id : activeAccount?.id || undefined },
      }))
      setActiveModal(null)
      setLoginError('')
    }
    const handleSocialLoginError = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message
      setLoginError(message || 'Discord account linking failed.')
    }
    window.addEventListener('discordSocialAccountLinked', handleSocialAccountLinked)
    window.addEventListener('discordSocialLoginError', handleSocialLoginError)
    const handleCaptured = async (e: Event) => {
      const token = (e as CustomEvent<{ token?: string }>).detail?.token
      if (token) {
        addLog('info', `Onboarding: token captured from native portal (len=${token.length})`)
        setIsValidatingToken(true)
        setLoginError('')
        const result = await fetchDiscordUserProfile(token)
        setIsValidatingToken(false)

        if (result.success && result.account) {
          addLog('info', `Onboarding: native portal login SUCCESS id=${result.account.id} username=${result.account.username}`)
          addAccount(result.account)
          setActiveModal(null)
        } else {
          addLog('error', `Onboarding: native portal login FAILED ${result.error}`)
          // If network validation failed, save with token directly
          const fallbackAccount: DiscordAccount = {
            id: String(Date.now()),
            username: 'DiscordUser',
            displayName: 'Discord User',
            token: token.trim(),
            isActive: accounts.length === 0,
            avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=discord',
          }
          addAccount(fallbackAccount)
          setActiveModal(null)
        }
      }
    }

    window.addEventListener('discordTokenCaptured', handleCaptured)
    return () => {
      window.removeEventListener('discordSocialAccountLinked', handleSocialAccountLinked)
      window.removeEventListener('discordSocialLoginError', handleSocialLoginError)
      window.removeEventListener('discordTokenCaptured', handleCaptured)
    }
  }, [accounts, addAccount, activeAccount?.id])

  // Listen for Discord OAuth2 token from popup callback (web/dev mode)
  useEffect(() => {
    const handleOAuthMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'DISCORD_TOKEN') {
        const token = e.data.token
        if (token) {
          setIsValidatingToken(true)
          setLoginError('')
          fetchDiscordUserProfile(token).then((result) => {
            setIsValidatingToken(false)
            if (result.success && result.account) {
              addAccount(result.account)
              setActiveModal(null)
            } else {
              setLoginError(result.error || 'Failed to fetch Discord profile')
            }
          })
        }
      }
    }

    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [accounts.length, addAccount])

  // Pluralization helper for accounts
  const accountCount = accounts.length
  const accountSubtext =
    accountCount === 0
      ? t.onboarding.surface.userSection.discordLogin.desc
      : `${accountCount} ${t.onboarding.surface.userSection.discordLogin.accountsConnected}`

  // Check if all permissions are granted and at least 1 account is connected
  const allPermissionsGranted =
    permissions.notificationListener &&
    permissions.usageStats &&
    permissions.batteryOptimizationsIgnored &&
    permissions.postNotifications

  const hasAccount = accountCount > 0
  const isFullyConfigured = allPermissionsGranted && hasAccount

  const footerButtonText = isFullyConfigured
    ? t.onboarding.footer.buttons.finishSetup
    : hasAccount
      ? t.onboarding.footer.buttons.continueForNow
      : t.onboarding.footer.buttons.skipForNow

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
        className="shrink-0 px-4 pb-3 border-b z-10 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
        }}
      >
        <div className="max-w-xl mx-auto w-full space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t.onboarding.surface.title}</h1>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.onboarding.surface.subtitle}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] pt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t.onboarding.surface.privacyNotice}</span>
          </div>
        </div>
      </header>

      {/* Middle Scrollable Area */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain w-full max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Section 1: Permissions Control */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t.onboarding.surface.permissionsSection.title}
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {t.onboarding.surface.permissionsSection.desc}
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Special App Access > Notification Access */}
            <div
              onClick={() => !permissions.notificationListener && setActiveModal('perm_notification')}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${permissions.notificationListener ? '' : 'cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]'}`}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: permissions.notificationListener
                  ? 'var(--color-border)'
                  : 'var(--color-accent-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: permissions.notificationListener
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'var(--color-accent-subtle)',
                    color: permissions.notificationListener
                      ? '#22c55e'
                      : 'var(--color-accent)',
                  }}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold">{t.onboarding.surface.permissionsSection.notificationAccess.title}</span>
                    {!permissions.notificationListener && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {t.tags.notificationCrucial}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.surface.permissionsSection.notificationAccess.desc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.notificationListener ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.tags.granted}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={e => {
                      e.stopPropagation()
                      setActiveModal('perm_notification')
                    }}
                  >
                    {t.buttons.grant}
                  </Button>
                )}
              </div>
            </div>

            {/* 2. Usage Stats Access */}
            <div
              onClick={() => !permissions.usageStats && setActiveModal('perm_usage')}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${permissions.usageStats ? '' : 'cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]'}`}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: permissions.usageStats
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'var(--color-bg-elevated)',
                    color: permissions.usageStats ? '#22c55e' : 'var(--color-text-muted)',
                  }}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold">{t.onboarding.surface.permissionsSection.usageAccess.title}</span>
                    {!permissions.usageStats && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {t.tags.notificationCrucial}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.surface.permissionsSection.usageAccess.desc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.usageStats ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.tags.granted}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={e => {
                      e.stopPropagation()
                      setActiveModal('perm_usage')
                    }}
                  >
                    {t.buttons.grant}
                  </Button>
                )}
              </div>
            </div>

            {/* 3. Battery Optimizations */}
            <div
              onClick={() => !permissions.batteryOptimizationsIgnored && setActiveModal('perm_battery')}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${permissions.batteryOptimizationsIgnored ? '' : 'cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]'}`}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: permissions.batteryOptimizationsIgnored
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'var(--color-bg-elevated)',
                    color: permissions.batteryOptimizationsIgnored
                      ? '#22c55e'
                      : 'var(--color-text-muted)',
                  }}
                >
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold">{t.onboarding.surface.permissionsSection.batteryOptimization.title}</span>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.surface.permissionsSection.batteryOptimization.desc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.batteryOptimizationsIgnored ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.tags.granted}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={e => {
                      e.stopPropagation()
                      setActiveModal('perm_battery')
                    }}
                  >
                    {t.buttons.grant}
                  </Button>
                )}
              </div>
            </div>

            {/* 4. Foreground Service Post Notification */}
            <div
              onClick={() => !permissions.postNotifications && setActiveModal('perm_post_notifications')}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${permissions.postNotifications ? '' : 'cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]'}`}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: permissions.postNotifications
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'var(--color-bg-elevated)',
                    color: permissions.postNotifications
                      ? '#22c55e'
                      : 'var(--color-text-muted)',
                  }}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold">{t.onboarding.surface.permissionsSection.foregroundNotification.title}</span>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.surface.permissionsSection.foregroundNotification.desc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.postNotifications ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.tags.granted}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={e => {
                      e.stopPropagation()
                      setActiveModal('perm_post_notifications')
                    }}
                  >
                    {t.buttons.grant}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <Divider />

        {/* Section 2: User Control */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t.onboarding.surface.userSection.title}
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {t.onboarding.surface.userSection.desc}
            </span>
          </div>

          <div className="space-y-2">
            {/* Discord Login Option */}
            <div
              onClick={() => setActiveModal('discord_login')}
              className="w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: accounts.length > 0 ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)',
                    color: accounts.length > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}
                >
                  <DiscordIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{t.onboarding.surface.userSection.discordLogin.title}</span>
                    {accounts.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{
                      color: accounts.length > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      fontWeight: accounts.length > 0 ? 500 : 400,
                    }}
                  >
                    {accountSubtext}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {activeAccount?.avatarUrl ? (
                  <img
                    src={activeAccount.avatarUrl}
                    alt={activeAccount.username}
                    className="w-7 h-7 rounded-full border"
                    style={{ borderColor: 'var(--color-accent)' }}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant={accounts.length > 0 ? 'outline' : 'primary'}
                    onClick={e => {
                      e.stopPropagation()
                      setActiveModal('discord_login')
                    }}
                  >
                    {accounts.length > 0 ? 'Manage' : 'Login'}
                  </Button>
                )}
              </div>
            </div>

            {/* Theme Option */}
            <div
              onClick={() => setActiveModal('theme')}
              className="w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold">{t.onboarding.surface.userSection.themeTitle}</span>
                  <p
                    className="text-xs mt-0.5 capitalize leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {theme.mode === 'amoled'
                      ? 'AMOLED (True Black)'
                      : `${theme.mode} Mode`}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.customAccentColor }}
                />
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            {/* Language Option */}
            <div
              onClick={() => setActiveModal('language')}
              className="w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold">{t.onboarding.surface.userSection.languageTitle}</span>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {settings.language}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom Footer */}
      <footer
        className="shrink-0 z-20 w-full border-t backdrop-blur-md px-4 pt-2.5"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {isFullyConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">{t.onboarding.footer.allSet}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                <span>{t.onboarding.footer.readyWhenYouAre}</span>
              </>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onComplete}
            icon={<ChevronRight className="w-4 h-4" />}
            iconPosition="right"
          >
            {footerButtonText}
          </Button>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODALS / DRAWERS */}
      {/* ======================================================== */}

      {/* 1. Modal: Special App Access > Notification Access */}
      <Modal
        isOpen={activeModal === 'perm_notification' && !permissions.notificationListener}
        onClose={() => setActiveModal(null)}
        title={t.onboarding.surface.permissionsSection.notificationAccess.title}
        subtitle={t.onboarding.surface.permissionsSection.notificationAccess.modal.subtitle}
        footer={
          <Button
            variant="primary"
            size="sm"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={() => {
              requestPermission('notificationListener')
              setActiveModal(null)
            }}
          >
            {t.onboarding.surface.permissionsSection.notificationAccess.modal.openAndroidSettings}
          </Button>
        }
      >
        <div className="space-y-3">
          <div
            className="p-3 rounded-xl border flex items-start gap-2.5 text-xs"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-text-base)',
            }}
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="font-semibold">{t.onboarding.surface.permissionsSection.notificationAccess.modal.oemNotice.title}</p>
              <p className="mt-0.5 opacity-90 leading-normal">
                {t.onboarding.surface.permissionsSection.notificationAccess.modal.oemNotice.desc}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Path 1 */}
            <div
              className="p-3 rounded-xl border space-y-1.5"
              style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodA.title}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1" style={{ color: 'var(--color-text-muted)' }}>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodA.step1}</li>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodA.step2}</li>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodA.step3}</li>
              </ol>
            </div>

            {/* Path 2 */}
            <div
              className="p-3 rounded-xl border space-y-1.5"
              style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodB.title}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1" style={{ color: 'var(--color-text-muted)' }}>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodB.step1}</li>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodB.step2}</li>
                <li>Tap the <strong>⋮ (three dots / ellipsis)</strong> at the top-right corner.</li>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodB.step4}</li>
                <li>{t.onboarding.surface.permissionsSection.notificationAccess.modal.methodB.step5}</li>
              </ol>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed pt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t.onboarding.surface.permissionsSection.notificationAccess.modal.desc}
          </p>
        </div>
      </Modal>

      {/* 2. Modal: Usage Stats */}
      <Modal
        isOpen={activeModal === 'perm_usage' && !permissions.usageStats}
        onClose={() => setActiveModal(null)}
        title={t.onboarding.surface.permissionsSection.usageAccess.title}
        subtitle={t.onboarding.surface.permissionsSection.usageAccess.modal.subtitle}
        footer={
          <Button
            variant="primary"
            size="sm"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={() => {
              requestPermission('usageStats')
              setActiveModal(null)
            }}
          >
            {t.onboarding.surface.permissionsSection.usageAccess.modal.openUsageAccess}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            {t.onboarding.surface.permissionsSection.usageAccess.modal.desc}
          </p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>{t.onboarding.surface.permissionsSection.usageAccess.modal.step1}</li>
            <li>{t.onboarding.surface.permissionsSection.usageAccess.modal.step2}</li>
            <li>{t.onboarding.surface.permissionsSection.usageAccess.modal.step3}</li>
          </ol>
        </div>
      </Modal>

      {/* 3. Modal: Battery Optimizations */}
      <Modal
        isOpen={activeModal === 'perm_battery' && !permissions.batteryOptimizationsIgnored}
        onClose={() => setActiveModal(null)}
        title={t.onboarding.surface.permissionsSection.batteryOptimization.title}
        subtitle={t.onboarding.surface.permissionsSection.batteryOptimization.modal.subtitle}
        footer={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              requestPermission('batteryOptimizationsIgnored')
              setActiveModal(null)
            }}
          >
            {t.onboarding.surface.permissionsSection.batteryOptimization.modal.requestExemption}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            {t.onboarding.surface.permissionsSection.batteryOptimization.modal.desc}
          </p>
        </div>
      </Modal>

      {/* 4. Modal: Post Notifications */}
      <Modal
        isOpen={activeModal === 'perm_post_notifications' && !permissions.postNotifications}
        onClose={() => setActiveModal(null)}
        title={t.onboarding.surface.permissionsSection.foregroundNotification.modal.title}
        subtitle={t.onboarding.surface.permissionsSection.foregroundNotification.modal.subtitle}
        footer={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              requestPermission('postNotifications')
              setActiveModal(null)
            }}
          >
            {t.onboarding.surface.permissionsSection.foregroundNotification.modal.allowNotification}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            {t.onboarding.surface.permissionsSection.foregroundNotification.modal.desc}
          </p>
        </div>
      </Modal>

      {/* 5. Modal: Discord Login */}
      <Modal
        isOpen={activeModal === 'discord_login'}
        onClose={() => setActiveModal(null)}
        title={t.pages.accounts.title}
        subtitle={t.modals.discordLogin.content.subtitle}
      >
        <div className="space-y-4">
          {/* Quick In-App Login Portal Button */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">{t.modals.discordLogin.content.title}</span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {t.modals.discordLogin.content.subtitle}
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={<DiscordIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenLoginPortal}
              >
                {t.buttons.openPortal}
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-xl border p-2.5 text-[11px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <p>
                Discord's Social SDK authorization includes broader social capabilities with Rich Presence. Kruzty Dynamics currently uses it to identify your account and publish or clear your configured activity; it does not call the SDK's friend, block, invite, message, or voice APIs. On Android, tokens are encrypted and stored on this device. Read the{' '}
                <a
                  href="https://github.com/LlanderSei/Kruzty-Dynamics/blob/master/PRIVACY.md"
                  onClick={event => {
                    event.preventDefault()
                    openExternalUrl(event.currentTarget.href)
                  }}
                  className="text-[var(--color-accent)] underline"
                >
                  Privacy Policy
                </a>.
                {' '}You can revoke authorization anytime in Discord User Settings → Authorized Apps.
              </p>
            </div>
          </div>

          {/* Existing Accounts List */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.accounts.body.hasAccount.currentAccount} ({accounts.length})
              </span>
              <div className="space-y-1.5">
                {accounts.map(acc => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: acc.isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={acc.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                        alt={acc.username}
                        className="w-7 h-7 rounded-full border shrink-0"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <div className="truncate">
                        <div className="font-semibold truncate">{acc.displayName || acc.username}</div>
                        <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {acc.isActive ? t.modals.discordLogin.onboarding.activeIdentity : t.modals.discordLogin.onboarding.stored}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccount(acc.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                      title={t.buttons.remove}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isValidatingToken && (
            <p className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Verifying your Discord account…
            </p>
          )}
          {loginError && <p className="text-xs text-red-400">{loginError}</p>}
        </div>
      </Modal>

      {/* 6. Modal: Theme Settings */}
      <Modal
        isOpen={activeModal === 'theme'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.themes.title}
        subtitle={t.pages.settings.appPreferences.themes.desc}
      >
        <div className="space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              {t.modals.settings.themes.themeMode}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'dark', label: t.choices.theme.dark },
                  { id: 'light', label: t.choices.theme.light },
                  { id: 'amoled', label: t.choices.theme.amoled },
                ] as const
              ).map(item => {
                const isSelected = theme.mode === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className="p-3 rounded-xl border text-center transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)',
                      borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text-base)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span className="text-xs">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Primary Accent Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {t.modals.settings.themes.accentColor}
              </label>
              <button
                type="button"
                onClick={() => setAccentColor(DEFAULT_ACCENT_COLOR)}
                className="text-[11px] hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                {t.modals.settings.themes.resetAccent}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PRESET_ACCENT_COLORS.map(preset => {
                const isSelected = theme.customAccentColor.toLowerCase() === preset.value.toLowerCase()
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAccentColor(preset.value)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)',
                      borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span
                      className="text-[10px] truncate max-w-full text-center"
                      style={{
                        color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Custom Hex Color Picker - Entire area is clickable */}
            <div
              onClick={() => colorInputRef.current?.click()}
              className="flex items-center gap-2.5 mt-3 p-2.5 rounded-xl border cursor-pointer hover:border-[var(--color-accent)] transition-all select-none"
              style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
            >
              <input
                ref={colorInputRef}
                type="color"
                value={theme.customAccentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
              />
              <span className="text-xs font-mono font-medium flex-1">{theme.customAccentColor.toUpperCase()}</span>
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{t.modals.settings.themes.tapCustomize}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* 7. Modal: Language Settings */}
      <Modal
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        title={t.modals.settings.language.title}
        subtitle={t.modals.settings.language.desc}
      >
        <div className="space-y-1.5">
          {[
            { id: 'default', label: 'System Default' },
            { id: 'en_US', label: 'English (US)' },
            { id: 'en_Shakespearean', label: 'English (Shakespearean)' },
            { id: 'xx_Alien_Zorblaxian', label: 'Alien (Zorblaxian)' },
            { id: 'xx_Pirate', label: 'Pirate' },
            { id: 'xx_Alien_Unknown', label: 'Alien (Unknown)' },
            { id: 'xx_UwU', label: 'UwU' },
            { id: 'ar_SA', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
            { id: 'my_MM', label: '\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c' },
            { id: 'hr_HR', label: 'Hrvatski' },
            { id: 'he_IL', label: '\u05e2\u05d1\u05e8\u05d9\u05ea' },
            { id: 'hi_IN', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
            { id: 'it_IT', label: 'Italiano' },
            { id: 'fa_IR', label: '\u0641\u0627\u0631\u0633\u06cc' },
            { id: 'pl_PL', label: 'Polski' },
            { id: 'pt_BR', label: 'Portugu\u00eas Brasileiro' },
            { id: 'zh_TW', label: '\u7e41\u9ad4\u4e2d\u6587' },
            { id: 'vi_VN', label: 'Ti\u1ebfng Vi\u1ec7t' },
            { id: 'th_TH', label: '\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22' },
            { id: 'fil_PH', label: 'Filipino / Tagalog' },
            { id: 'es_ES', label: 'Espa\u00f1ol' },
            { id: 'ja_JP', label: '\u65e5\u672c\u8a9e (Japanese)' },
            { id: 'de_DE', label: 'Deutsch' },
            { id: 'fr_FR', label: 'Fran\u00e7ais' },
            { id: 'zh_CN', label: 'Chinese (\u7b80\u4f53\u4e2d\u6587)' },
            { id: 'id_ID', label: 'Bahasa Indonesia' },
            { id: 'ko_KR', label: '\ud55c\uad6d\uc5b4' },
            { id: 'nl_NL', label: 'Nederlands' },
            { id: 'ru_RU', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
            { id: 'tr_TR', label: 'T\u00fcrk\u00e7e' },
            { id: 'en_HmphBaka', label: 'Hmph!!... Baka...' },
          ].map(lang => {
            const isSelected = settings.language === lang.label
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  setLanguage(lang.label)
                  setActiveModal(null)
                }}
                className="w-full text-left p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer"
                style={{
                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)',
                  borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-text-base)',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span>{lang.label}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
