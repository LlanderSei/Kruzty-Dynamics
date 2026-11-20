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
  Plus,
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
import { fetchDiscordUserProfile } from '../accounts/discordAuth'
import type { DiscordAccount } from '../../types'

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
  const { permissions, setPermission, requestPermission } = usePermissions()
  const { accounts, activeAccount, addAccount, removeAccount } = useAccounts()
  const { theme, setMode, setAccentColor } = useTheme()
  const { settings, setLanguage } = useAppSettings()
  const { t } = useTranslation()

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Discord Login state in modal
  const [discordToken, setDiscordToken] = useState('')
  const [tokenUsername, setTokenUsername] = useState('')
  const [loginError, setLoginError] = useState('')
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
          addAccount(result.account)
          setActiveModal(null)
        } else {
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
    return () => window.removeEventListener('discordTokenCaptured', handleCaptured)
  }, [accounts.length, addAccount])

  // Pluralization helper for accounts
  const accountCount = accounts.length
  const accountSubtext =
    accountCount === 0
      ? t.onboarding.discordLoginDesc
      : `${accountCount} ${t.onboarding.accountsConnected}`

  // Check if all permissions are granted and at least 1 account is connected
  const allPermissionsGranted =
    permissions.notificationListener &&
    permissions.usageStats &&
    permissions.batteryOptimizationsIgnored &&
    permissions.postNotifications

  const hasAccount = accountCount > 0
  const isFullyConfigured = allPermissionsGranted && hasAccount

  const footerButtonText = isFullyConfigured
    ? t.onboarding.finishSetup
    : hasAccount
      ? t.onboarding.continueForNow
      : t.onboarding.skipForNow

  const handleOpenLoginPortal = () => {
    if (window.AndroidNativeBridge?.openDiscordLoginPortal) {
      window.AndroidNativeBridge.openDiscordLoginPortal()
    } else if (window.AndroidNativeBridge?.openExternalUrl) {
      window.AndroidNativeBridge.openExternalUrl('https://discord.com/login')
    } else {
      window.open('https://discord.com/login', '_blank')
    }
  }

  const handleSimulateLogin = async (e: React.FormEvent) => {
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
      addAccount(result.account)
      setDiscordToken('')
      setTokenUsername('')
      setLoginError('')
      setActiveModal(null)
    } else {
      // If validation returned an error, check if user provided a manual name
      if (tokenUsername.trim()) {
        const username = tokenUsername.trim()
        const manualAccount: DiscordAccount = {
          id: String(Date.now()),
          username,
          displayName: username,
          token: discordToken.trim(),
          isActive: accounts.length === 0,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
        }
        addAccount(manualAccount)
        setDiscordToken('')
        setTokenUsername('')
        setLoginError('')
        setActiveModal(null)
      } else {
        setLoginError(result.error || 'Failed to authenticate token with Discord')
      }
    }
  }

  const handleQuickDemoLogin = () => {
    const demoAccount: DiscordAccount = {
      id: String(Date.now()),
      username: 'KruztyPilot',
      displayName: 'Kruzty Pilot',
      token: 'demo_token_' + Math.random().toString(36).substring(2, 10),
      isActive: true,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=kruzty',
    }
    addAccount(demoAccount)
    setActiveModal(null)
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t.onboarding.title}</h1>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.onboarding.subtitle}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] pt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t.onboarding.privacyNotice}</span>
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
              {t.onboarding.permissionsSection}
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {t.onboarding.permissionsRequired}
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Special App Access > Notification Access */}
            <div
              onClick={() => setActiveModal('perm_notification')}
              className="w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-[0.99]"
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
                    <span className="text-sm font-semibold">{t.onboarding.notificationTitle}</span>
                    {!permissions.notificationListener && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {t.onboarding.notificationCrucial}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.notificationDesc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.notificationListener ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.onboarding.granted}
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
                    {t.onboarding.grant}
                  </Button>
                )}
              </div>
            </div>

            {/* 2. Usage Stats Access */}
            <div
              onClick={() => setActiveModal('perm_usage')}
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
                    <span className="text-sm font-semibold">{t.onboarding.usageTitle}</span>
                    {!permissions.usageStats && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {t.onboarding.notificationCrucial}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.usageDesc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.usageStats ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.onboarding.granted}
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
                    {t.onboarding.grant}
                  </Button>
                )}
              </div>
            </div>

            {/* 3. Battery Optimizations */}
            <div
              onClick={() => setActiveModal('perm_battery')}
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
                  <span className="text-sm font-semibold">{t.onboarding.batteryTitle}</span>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.batteryDesc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.batteryOptimizationsIgnored ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.onboarding.granted}
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
                    {t.onboarding.grant}
                  </Button>
                )}
              </div>
            </div>

            {/* 4. Foreground Service Post Notification */}
            <div
              onClick={() => setActiveModal('perm_post_notifications')}
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
                  <span className="text-sm font-semibold">{t.onboarding.postNotificationTitle}</span>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t.onboarding.postNotificationDesc}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {permissions.postNotifications ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.onboarding.granted}
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
                    {t.onboarding.grant}
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
              {t.onboarding.userControlSection}
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {t.onboarding.userControlDesc}
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
                    <span className="text-sm font-semibold">{t.onboarding.discordLoginTitle}</span>
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
                  <span className="text-sm font-semibold">{t.onboarding.themeTitle}</span>
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
                  <span className="text-sm font-semibold">{t.onboarding.languageTitle}</span>
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
                <span className="text-emerald-500 font-medium">{t.onboarding.allSet}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                <span>{t.onboarding.readyWhenYouAre}</span>
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
        isOpen={activeModal === 'perm_notification'}
        onClose={() => setActiveModal(null)}
        title="Notification Access"
        subtitle="Special App Access Configuration"
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPermission('notificationListener', !permissions.notificationListener)
                setActiveModal(null)
              }}
            >
              {permissions.notificationListener ? 'Revoke (Test)' : 'Toggle Granted'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => {
                requestPermission('notificationListener')
                setActiveModal(null)
              }}
            >
              Open Android Settings
            </Button>
          </div>
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
              <p className="font-semibold">Notice for OEM &amp; Android 13+ Devices</p>
              <p className="mt-0.5 opacity-90 leading-normal">
                Android protects notification listener access behind special permission layers. Depending on your phone brand, follow one of the methods below.
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
                <span>Method A: Special App Access (Pixel, Motorola, Infinix, Stock)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1" style={{ color: 'var(--color-text-muted)' }}>
                <li>Tap <strong>Open Android Settings</strong> below.</li>
                <li>Go to <strong>Special App Access &gt; Notification Access</strong>.</li>
                <li>Find <strong>Kruzty Dynamics</strong> and switch on <strong>Allow notification access</strong>.</li>
              </ol>
            </div>

            {/* Path 2 */}
            <div
              className="p-3 rounded-xl border space-y-1.5"
              style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span>Method B: App Info &gt; Ellipsis (Xiaomi/HyperOS, Samsung, Oppo)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1" style={{ color: 'var(--color-text-muted)' }}>
                <li>Open device Settings &gt; <strong>Apps &gt; Manage Apps / App List</strong>.</li>
                <li>Find and tap <strong>Kruzty Dynamics</strong>.</li>
                <li>Tap the <strong>⋮ (three dots / ellipsis)</strong> at the top-right corner.</li>
                <li>Tap <strong>Allow restricted settings / Special App Access</strong> &gt; Grant.</li>
                <li>Return and enable <strong>Notification Access</strong>.</li>
              </ol>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed pt-1" style={{ color: 'var(--color-text-muted)' }}>
            Notification Access enables Kruzty Dynamics to capture live media session playback events
            (Song Title, Artist, Album, and Playback State) from Spotify, YouTube Music, and media players.
          </p>
        </div>
      </Modal>

      {/* 2. Modal: Usage Stats */}
      <Modal
        isOpen={activeModal === 'perm_usage'}
        onClose={() => setActiveModal(null)}
        title="Usage Access"
        subtitle="Foreground App Detection"
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPermission('usageStats', !permissions.usageStats)
                setActiveModal(null)
              }}
            >
              {permissions.usageStats ? 'Revoke (Test)' : 'Toggle Granted'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => {
                requestPermission('usageStats')
                setActiveModal(null)
              }}
            >
              Open Usage Access
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            Usage Access is required to detect which app or game you are currently running in the
            foreground, so Kruzty Dynamics can match it against your configured Application Catalog.
          </p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Tap <strong>Open Usage Access</strong>.</li>
            <li>Locate <strong>Kruzty Dynamics</strong>.</li>
            <li>Switch on <strong>Permit usage access</strong>.</li>
          </ol>
        </div>
      </Modal>

      {/* 3. Modal: Battery Optimizations */}
      <Modal
        isOpen={activeModal === 'perm_battery'}
        onClose={() => setActiveModal(null)}
        title="Battery Optimization"
        subtitle="Background Service Whitelist"
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPermission('batteryOptimizationsIgnored', !permissions.batteryOptimizationsIgnored)
                setActiveModal(null)
              }}
            >
              {permissions.batteryOptimizationsIgnored ? 'Revoke (Test)' : 'Toggle Granted'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                requestPermission('batteryOptimizationsIgnored')
                setActiveModal(null)
              }}
            >
              Request Exemption
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            Modern Android systems put background processes to sleep after a few minutes.
            Exempting Kruzty Dynamics from battery optimization ensures continuous, uninterrupted
            Discord Rich Presence updates.
          </p>
        </div>
      </Modal>

      {/* 4. Modal: Post Notifications */}
      <Modal
        isOpen={activeModal === 'perm_post_notifications'}
        onClose={() => setActiveModal(null)}
        title="Foreground Service Notification"
        subtitle="Android 13+ Notification Permission"
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPermission('postNotifications', !permissions.postNotifications)
                setActiveModal(null)
              }}
            >
              {permissions.postNotifications ? 'Revoke (Test)' : 'Toggle Granted'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                requestPermission('postNotifications')
                setActiveModal(null)
              }}
            >
              Allow Notification
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <p>
            Required by Android 13+ to display the ongoing foreground service notification in your
            status bar, confirming that the Discord presence engine is running.
          </p>
        </div>
      </Modal>

      {/* 5. Modal: Discord Login */}
      <Modal
        isOpen={activeModal === 'discord_login'}
        onClose={() => setActiveModal(null)}
        title="Discord Accounts"
        subtitle="Manage tokens and identities"
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
                <span className="text-xs font-bold block">Discord Login Portal</span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Sign in securely with Discord in-app
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
          </div>

          {/* Existing Accounts List */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Connected Accounts ({accounts.length})
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
                          {acc.isActive ? 'Active Identity' : 'Stored'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccount(acc.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Account Form via Token */}
          <form onSubmit={handleSimulateLogin} className="space-y-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Add Account via Token
            </span>

            <div>
              <label className="block text-xs font-medium mb-1">Account Display Name (Optional)</label>
              <input
                type="text"
                value={tokenUsername}
                onChange={e => setTokenUsername(e.target.value)}
                placeholder="Auto-fetched from Discord @me"
                className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-base)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">User Token</label>
              <input
                type="password"
                value={discordToken}
                onChange={e => setDiscordToken(e.target.value)}
                placeholder="Enter Discord Token..."
                className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-hidden font-mono"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-base)',
                }}
              />
              {loginError && <p className="text-[11px] text-red-400 mt-1">{loginError}</p>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={isValidatingToken}
                icon={isValidatingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              >
                {isValidatingToken ? 'Verifying...' : 'Save Token'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleQuickDemoLogin}
              >
                Use Demo Account
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 6. Modal: Theme Settings */}
      <Modal
        isOpen={activeModal === 'theme'}
        onClose={() => setActiveModal(null)}
        title="Theme &amp; Appearance"
        subtitle="Minimalist styling with customizable accent"
      >
        <div className="space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'dark', label: 'Dark' },
                  { id: 'light', label: 'Light' },
                  { id: 'amoled', label: 'AMOLED' },
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
                Primary Accent Color
              </label>
              <button
                type="button"
                onClick={() => setAccentColor(DEFAULT_ACCENT_COLOR)}
                className="text-[11px] hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Reset to Default Orange
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
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Tap to customize</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* 7. Modal: Language Settings */}
      <Modal
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        title="Select Language"
        subtitle="Application interface localization"
      >
        <div className="space-y-1.5">
          {[
            { id: 'default', label: 'System Default' },
            { id: 'en_US', label: 'English (US)' },
            { id: 'fil_PH', label: 'Filipino / Tagalog' },
            { id: 'es_ES', label: 'Español' },
            { id: 'ja_JP', label: '日本語 (Japanese)' },
            { id: 'de_DE', label: 'Deutsch' },
            { id: 'fr_FR', label: 'Français' },
            { id: 'zh_CN', label: 'Chinese (简体中文)' },
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
