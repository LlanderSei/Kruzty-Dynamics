import React, { useEffect, useState, useRef } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import {
  Palette,
  Globe,
  SlidersHorizontal,
  KeyRound,
  Hash,
  ShieldCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  CheckCircle2,
  AlertTriangle,
  LoaderCircle,
  BellRing,
} from 'lucide-react'
import { useTheme, PRESET_ACCENT_COLORS, DEFAULT_ACCENT_COLOR } from './ThemeContext'
import { useAppSettings } from './useAppSettings'
import { usePermissions } from '../permissions/usePermissions'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { openExternalUrl } from '../../utils/externalLinks'
import { useTranslation } from '../../i18n/useTranslation'
import { findNewerRelease } from '../../utils/appUpdates'
import type { ActivityType, DiscordStatus } from '../../types'
import appIcon from '../../../src-tauri/icons/icon.png'

function formatDisplayVersion(version: string): string {
  const match = version.trim().match(/^v?(\d+)\.(\d+)(?:\.\d+)?(?:[-+].*)?$/)
  return match ? `${match[1]}.${match[2]}` : version
}

interface SettingsViewProps {
  onNavigateToNotificationProjection?: () => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToNotificationProjection }) => {
  const { theme, setMode, setAccentColor } = useTheme()
  const { t } = useTranslation()
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const {
    settings,
    cachedImageCount,
    customIconCount,
    setLanguage,
    setCustomImgbbKey,
    setCustomDiscordAppId,
    setGlobalActivityType,
    setGlobalActivityStatus,
    clearImageCache,
  } = useAppSettings()
  const { permissions, requestPermission } = usePermissions()

  useEffect(() => {
    let isMounted = true
    void getVersion()
      .then(version => {
        if (isMounted) setAppVersion(version)
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])
  const colorInputRef = useRef<HTMLInputElement>(null)
  const grantedRequiredPermissionCount = [
    permissions.usageStats,
    permissions.notificationListener,
    permissions.postNotifications,
  ].filter(Boolean).length
  const requiredPermissionsGranted = grantedRequiredPermissionCount === 3
  const permissionSummary = requiredPermissionsGranted
    ? permissions.batteryOptimizationsIgnored ? t.tags.allGranted : t.tags.granted
    : `${grantedRequiredPermissionCount}/3 • ${t.tags.granted}`

  // Collapsible accordion
  const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState(false)

  // Modals
  const [activeModal, setActiveModal] = useState<
    | 'theme'
    | 'language'
    | 'global-defaults'
    | 'imgbb'
    | 'discord-id'
    | 'permissions'
    | 'clear-cache'
    | 'credits'
    | null
  >(null)

  // Local modal form states
  const [tempImgbbKey, setTempImgbbKey] = useState('')
  const [tempDiscordAppId, setTempDiscordAppId] = useState('')
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState<string | null>(null)

  const handleOpenImgbbModal = () => {
    setTempImgbbKey('')
    setActiveModal('imgbb')
  }

  const handleOpenDiscordIdModal = () => {
    setTempDiscordAppId(settings.customDiscordAppId || '')
    setActiveModal('discord-id')
  }

  const handleSaveImgbb = (e: React.FormEvent) => {
    e.preventDefault()
    const nextKey = tempImgbbKey.trim()
    if (nextKey) setCustomImgbbKey(nextKey)
    setActiveModal(null)
  }

  const handleSaveDiscordId = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomDiscordAppId(tempDiscordAppId)
    setActiveModal(null)
  }

  const handleConfirmClearCache = (includeCustomIcons: boolean) => {
    clearImageCache(includeCustomIcons)
    setCacheClearedSuccess(includeCustomIcons ? t.modals.settings.deleteCachedUrls.clearedAll : t.modals.settings.deleteCachedUrls.clearedKeeping)
    setTimeout(() => {
      setCacheClearedSuccess(null)
      setActiveModal(null)
    }, 1200)
  }

  const openExternal = (url: string) => {
    openExternalUrl(url)
  }

  const handleCheckForUpdates = async () => {
    if (isCheckingUpdates) return
    setIsCheckingUpdates(true)
    try {
      const version = await getVersion()
      setAppVersion(version)
      const release = await findNewerRelease(version)
      const message = release ? t.toast.updateDetected : t.toast.latestVersion
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message } }))
      if (release) window.setTimeout(() => openExternal(release.url), 500)
    } catch {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: t.toast.updateCheckFailed } }))
    } finally {
      setIsCheckingUpdates(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full space-y-4 pb-24">
      {/* Top App Info Card */}
      <div
        className="p-4 rounded-2xl border flex flex-col items-center text-center space-y-3 transition-colors shadow-sm"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* App Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md relative"
          style={{
            backgroundColor: 'var(--color-accent-subtle)',
            border: '2px solid var(--color-accent)',
          }}
        >
          <img src={appIcon} alt="Kruzty Dynamics app icon" className="h-full w-full rounded-[inherit] object-cover" />
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-emerald-500"
            style={{ borderColor: 'var(--color-bg-surface)' }}
          />
        </div>

        {/* 2-col Grid Info */}
        <div className="grid grid-cols-2 gap-2 w-full pt-1 text-xs">
          <div
            className="min-w-0 flex self-stretch items-center justify-center break-words rounded-xl border px-2 py-1.5 text-center text-xs font-medium leading-tight"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-base)',
            }}
          >
            {t.pages.settings.cardInfo.version.replace('{version}', formatDisplayVersion(appVersion))}
          </div>
          <div
            className="min-w-0 flex self-stretch items-center justify-center break-words rounded-xl border px-2 py-1.5 text-center text-xs font-medium leading-tight"
            onClick={() => openExternal('https://github.com/LlanderSei')}
            role="link"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') openExternal('https://github.com/LlanderSei')
            }}
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-base)',
            }}
          >
                {t.pages.settings.cardInfo.developedBy} Seiraneko
          </div>
        </div>

        {/* Full-width Architecture Description */}
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {t.pages.settings.cardInfo.architecture}
        </p>

        {/* Expand / Hide Accordion Button */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={() => setIsLearnMoreExpanded(!isLearnMoreExpanded)}
            className="w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:border-[var(--color-accent)]"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-base)',
            }}
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              <span>{t.pages.settings.cardInfo.learnMore}</span>
            </div>
            {isLearnMoreExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Accordion Content */}
          {isLearnMoreExpanded && (
            <div
              className="mt-2 p-2 rounded-xl border space-y-1 text-left text-xs transition-all"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={() => openExternal('https://github.com/LlanderSei/Kruzty-Dynamics/blob/master/PRIVACY.md')}
                className="w-full p-2 rounded-lg flex items-center justify-between hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.modals.discordLogin.content.privacyPolicy}</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => openExternal('https://github.com/LlanderSei/Kruzty-Dynamics')}
                className="w-full p-2 rounded-lg flex items-center justify-between hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.pages.settings.cardInfo.repository}</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => openExternal('https://github.com/LlanderSei/Kruzty-Dynamics/releases')}
                className="w-full p-2 rounded-lg flex items-center justify-between hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.pages.settings.cardInfo.latestRelease}</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => openExternal('https://github.com/LlanderSei/Kruzty-Dynamics/issues')}
                className="w-full p-2 rounded-lg flex items-center justify-between hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.pages.settings.cardInfo.submitIssue}</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('credits')}
                className="w-full p-2 rounded-lg flex items-center justify-between hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🎖️</span>
                  <span>{t.pages.settings.cardInfo.credits}</span>
                </span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                  {t.tags.view}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Options List */}
      <div className="space-y-2.5">
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t.pages.settings.appPreferences.title}
        </span>

        {/* Check for app updates */}
        <button
          type="button"
          onClick={() => void handleCheckForUpdates()}
          disabled={isCheckingUpdates}
          aria-label={isCheckingUpdates ? t.tags.checkingUpdates : t.pages.settings.appPreferences.checkUpdates.title}
          className="w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all hover:border-[var(--color-accent)] active:scale-[0.99] disabled:cursor-default"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.checkUpdates.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.checkUpdates.desc}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-semibold text-emerald-500">
            {isCheckingUpdates ? <LoaderCircle className="w-4 h-4 animate-spin" /> : t.tags.check}
          </span>
        </button>

        {/* Notification status projection */}
        <button
          type="button"
          onClick={onNavigateToNotificationProjection}
          className="w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
            >
              <BellRing className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.notificationProjection.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.notificationProjection.desc}
              </p>
            </div>
          </div>
        </button>

        {/* 1. Themes and Display */}
        <div
          onClick={() => setActiveModal('theme')}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.themes.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.themes.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20"
              style={{ backgroundColor: theme.customAccentColor }}
            />
            <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text-muted)' }}>
              {t.choices.theme[theme.mode]}
            </span>
          </div>
        </div>

        {/* 2. Language */}
        <div
          onClick={() => setActiveModal('language')}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.language.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.language.desc} {settings.language}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {settings.language}
          </span>
        </div>

        {/* 3. Global Defaults */}
        <div
          onClick={() => setActiveModal('global-defaults')}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.globalDefaults.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.globalDefaults.desc}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 shrink-0 text-xs font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span>{[
              t.choices.activityType.playing,
              '',
              t.choices.activityType.listening,
              t.choices.activityType.watching,
              '',
              t.choices.activityType.competing,
            ][settings.globalActivityType]}</span>
            <span>•</span>
            <span>{t.choices.activityStatus[settings.globalActivityStatus === 'dnd' ? 'dnd' : settings.globalActivityStatus]}</span>
          </div>
        </div>

        {/* 4. Set ImgBB API Key */}
        <div
          onClick={handleOpenImgbbModal}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.imgBbKey.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.imgBbKey.desc}
              </p>
            </div>
          </div>
          <span
            className="text-[11px] px-2 py-0.5 rounded-md border shrink-0 font-medium"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: settings.customImgbbKey ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {settings.customImgbbKey ? t.tags.custom : t.tags.default}
          </span>
        </div>

        {/* 4. Set Discord Application ID */}
        <div
          onClick={handleOpenDiscordIdModal}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.discordAppId.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.discordAppId.desc}
              </p>
            </div>
          </div>
          <span
            className="text-[11px] px-2 py-0.5 rounded-md border shrink-0 font-medium"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: settings.customDiscordAppId ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {settings.customDiscordAppId ? t.tags.custom : t.tags.default}
          </span>
        </div>

        {/* 5. Check Permissions */}
        <div
          onClick={() => setActiveModal('permissions')}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.pages.settings.appPreferences.checkPermissions.title}</h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.checkPermissions.desc}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-medium shrink-0"
            style={{ color: requiredPermissionsGranted ? '#22c55e' : '#f59e0b' }}
          >
            {permissionSummary}
          </span>
        </div>

        {/* 6. Delete Linked Image URLs */}
        <div
          onClick={() => setActiveModal('clear-cache')}
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-red-500/40 active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: '#ef4444',
              }}
            >
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight text-red-500">
                {t.pages.settings.appPreferences.deleteCachedUrls.title}
              </h4>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.pages.settings.appPreferences.deleteCachedUrls.desc}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border shrink-0 text-zinc-400">
            {cachedImageCount} {t.tags.cached}
          </span>
        </div>

        {/* Gap after Delete Linked Image URLs */}
        <div className="h-6 shrink-0" aria-hidden="true" />
      </div>

      {/* --- MODALS --- */}

      {/* 1. Theme Modal */}
      <Modal
        isOpen={activeModal === 'theme'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.themes.title}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
              {t.modals.settings.themes.themeMode}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'amoled'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className="py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor:
                      theme.mode === mode
                        ? 'var(--color-accent-subtle)'
                        : 'var(--color-bg-elevated)',
                    borderColor:
                      theme.mode === mode ? 'var(--color-accent)' : 'var(--color-border)',
                    color:
                      theme.mode === mode ? 'var(--color-accent)' : 'var(--color-text-base)',
                  }}
                >
                  {theme.mode === mode && <Check className="w-3.5 h-3.5" />}
                  <span>{t.choices.theme[mode]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
                {t.modals.settings.themes.accentColor}
              </label>
              <button
                type="button"
                onClick={() => setAccentColor(DEFAULT_ACCENT_COLOR)}
                className="text-[11px] cursor-pointer hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                {t.modals.settings.themes.resetAccent}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {PRESET_ACCENT_COLORS.map(preset => {
                const isSelected =
                  theme.customAccentColor.toLowerCase() === preset.value.toLowerCase()
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAccentColor(preset.value)}
                    className="p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--color-accent-subtle)'
                        : 'var(--color-bg-elevated)',
                      borderColor: isSelected
                        ? 'var(--color-accent)'
                        : 'var(--color-border)',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/20"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="text-[10px] truncate max-w-full font-medium">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Custom Hex Color Picker - Entire area is clickable */}
            <div
              onClick={() => colorInputRef.current?.click()}
              className="flex items-center gap-2.5 mt-2.5 p-2.5 rounded-xl border cursor-pointer hover:border-[var(--color-accent)] transition-all select-none"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <input
                ref={colorInputRef}
                type="color"
                value={theme.customAccentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
              />
              <span className="text-xs font-mono font-medium flex-1">
                {theme.customAccentColor.toUpperCase()}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {t.modals.settings.themes.tapCustomize}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setActiveModal(null)}>
              {t.buttons.done}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Language Modal */}
      <Modal
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        title={t.modals.settings.language.title}
      >
        <div className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.settings.language.desc}
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t.modals.settings.language.availableLanguages}</label>
            <Select
              value={settings.language}
              onChange={e => {
                setLanguage(e.target.value)
                setActiveModal(null)
              }}
              options={[
                { value: 'System Default', label: 'System Default (Recommended)' },
                { value: 'English (US)', label: 'English (US)' },
                { value: 'English (Shakespearean)', label: 'English (Shakespearean)' },
                { value: 'Alien (Zorblaxian)', label: 'Alien (Zorblaxian)' },
                { value: 'Pirate', label: 'Pirate' },
                { value: 'Alien (Unknown)', label: 'Alien (Unknown)' },
                { value: 'UwU', label: 'UwU' },
                { value: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
                { value: '\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c', label: '\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c' },
                { value: 'Hrvatski', label: 'Hrvatski' },
                { value: '\u05e2\u05d1\u05e8\u05d9\u05ea', label: '\u05e2\u05d1\u05e8\u05d9\u05ea' },
                { value: '\u0939\u093f\u0928\u094d\u0926\u0940', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
                { value: 'Italiano', label: 'Italiano' },
                { value: '\u0641\u0627\u0631\u0633\u06cc', label: '\u0641\u0627\u0631\u0633\u06cc' },
                { value: 'Polski', label: 'Polski' },
                { value: 'Portugu\u00eas Brasileiro', label: 'Portugu\u00eas Brasileiro' },
                { value: '\u7e41\u9ad4\u4e2d\u6587', label: '\u7e41\u9ad4\u4e2d\u6587' },
                { value: 'Ti\u1ebfng Vi\u1ec7t', label: 'Ti\u1ebfng Vi\u1ec7t' },
                { value: '\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22', label: '\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22' },
                { value: 'Filipino / Tagalog', label: 'Filipino / Tagalog' },
                { value: 'Espa\u00f1ol', label: 'Espa\u00f1ol' },
                { value: '\u65e5\u672c\u8a9e (Japanese)', label: '\u65e5\u672c\u8a9e (Japanese)' },
                { value: 'Deutsch', label: 'Deutsch' },
                { value: 'Fran\u00e7ais', label: 'Fran\u00e7ais' },
                { value: 'Chinese (\u7b80\u4f53\u4e2d\u6587)', label: 'Chinese (\u7b80\u4f53\u4e2d\u6587)' },
                { value: 'Bahasa Indonesia', label: 'Bahasa Indonesia' },
                { value: '\ud55c\uad6d\uc5b4', label: '\ud55c\uad6d\uc5b4' },
                { value: 'Nederlands', label: 'Nederlands' },
                { value: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
                { value: 'T\u00fcrk\u00e7e', label: 'T\u00fcrk\u00e7e' },
                { value: 'Hmph!!... Baka...', label: 'Hmph!!... Baka...' },
              ]}
            />
          </div>

          <div className="pt-2">
            <Button variant="ghost" className="w-full" onClick={() => setActiveModal(null)}>
              {t.buttons.close}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2.5 Global Defaults Modal */}
      <Modal
        isOpen={activeModal === 'global-defaults'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.globalDefaults.title}
        subtitle={t.pages.settings.appPreferences.globalDefaults.desc}
      >
        <div className="space-y-4 text-xs">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.settings.globalDefaults.note}
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
                {t.modals.settings.globalDefaults.activityType}
              </label>
              <Select
                value={settings.globalActivityType}
                onChange={e => setGlobalActivityType(Number(e.target.value) as ActivityType)}
                fullWidth={true}
              >
                <option value={0}>{t.choices.activityType.playing}</option>
                <option value={2}>{t.choices.activityType.listening}</option>
                <option value={3}>{t.choices.activityType.watching}</option>
                <option value={5}>{t.choices.activityType.competing}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
                {t.modals.settings.globalDefaults.activityStatus}
              </label>
              <Select
                value={settings.globalActivityStatus}
                onChange={e => setGlobalActivityStatus(e.target.value as DiscordStatus)}
                fullWidth={true}
              >
                <option value="online">{t.choices.activityStatus.online}</option>
                <option value="idle">{t.choices.activityStatus.idle}</option>
                <option value="dnd">{t.choices.activityStatus.dnd}</option>
                <option value="offline">{t.choices.activityStatus.offline}</option>
                <option value="invisible">{t.choices.activityStatus.invisible}</option>
                <option value="streaming">{t.choices.activityStatus.streaming}</option>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setActiveModal(null)}>
              {t.buttons.done}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Set ImgBB API Key Modal */}
      <Modal
        isOpen={activeModal === 'imgbb'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.imgBbKey.title}
      >
        <form onSubmit={handleSaveImgbb} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.settings.imgBb.help}{' '}
            <button
              type="button"
              onClick={() => openExternal('https://api.imgbb.com')}
              className="underline cursor-pointer font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              api.imgbb.com
            </button>{' '}
            {t.modals.settings.imgBb.getApiKey}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">{t.pages.settings.appPreferences.imgBbKey.title}</label>
              {settings.customImgbbKey && (
                <button
                  type="button"
                  onClick={() => {
                    setTempImgbbKey('')
                    setCustomImgbbKey('')
                  }}
                  className="text-[11px] flex items-center gap-1 text-red-500 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.subPages.buttons.reset}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempImgbbKey}
                onChange={e => setTempImgbbKey(e.target.value)}
                placeholder={
                  settings.customImgbbKey
                    ? `${'•'.repeat(12)} (${t.modals.settings.imgBb.customKeySet})`
                    : t.modals.settings.imgBb.usingDefaultKey
                }
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-base)',
                }}
              />
              {settings.customImgbbKey && (
                <button
                  type="button"
                  onClick={() => {
                    setTempImgbbKey('')
                    setCustomImgbbKey('')
                  }}
                  title={t.subPages.buttons.reset}
                  className="p-2 rounded-xl border shrink-0 text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {t.modals.settings.imgBb.apiPrivacy}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              {t.buttons.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {t.buttons.save.key}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Set Discord Application ID Modal */}
      <Modal
        isOpen={activeModal === 'discord-id'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.discordAppId.title}
      >
        <form onSubmit={handleSaveDiscordId} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.settings.discordApp.help}{' '}
            <button
              type="button"
              onClick={() => openExternal('https://discord.com/developers/applications/')}
              className="underline cursor-pointer font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              {t.modals.settings.discordApp.developerPortal}
            </button>
            .
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">{t.pages.settings.appPreferences.discordAppId.title}</label>
              {settings.customDiscordAppId && (
                <button
                  type="button"
                  onClick={() => {
                    setTempDiscordAppId('')
                    setCustomDiscordAppId('')
                  }}
                  className="text-[11px] flex items-center gap-1 text-red-500 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.subPages.buttons.reset}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempDiscordAppId}
                onChange={e => setTempDiscordAppId(e.target.value)}
                placeholder={`1572590527562391713 (${t.tags.default})`}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-base)',
                }}
              />
              {settings.customDiscordAppId && (
                <button
                  type="button"
                  onClick={() => {
                    setTempDiscordAppId('')
                    setCustomDiscordAppId('')
                  }}
                  title={t.buttons.resetDefault}
                  className="p-2 rounded-xl border shrink-0 text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {t.modals.settings.discordApp.idPrivacy}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              {t.buttons.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {t.buttons.save.id}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Check Permissions Modal */}
      <Modal
        isOpen={activeModal === 'permissions'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.checkPermissions.title}
      >
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.settings.checkPermissions.desc}
          </p>

          <div className="space-y-2">
            {/* Notification Access */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="min-w-0 pr-2">
                <h5 className="text-xs font-semibold">{t.onboarding.surface.permissionsSection.notificationAccess.title}</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t.modals.settings.checkPermissions.notificationAccessDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestPermission('notificationListener')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: permissions.notificationListener
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'var(--color-accent-subtle)',
                  color: permissions.notificationListener ? '#10b981' : 'var(--color-accent)',
                }}
              >
                {permissions.notificationListener ? t.tags.granted : t.buttons.grant}
              </button>
            </div>

            {/* Usage Access */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="min-w-0 pr-2">
                <h5 className="text-xs font-semibold">{t.onboarding.surface.permissionsSection.usageAccess.title}</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t.modals.settings.checkPermissions.usageAccessDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestPermission('usageStats')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: permissions.usageStats
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'var(--color-accent-subtle)',
                  color: permissions.usageStats ? '#10b981' : 'var(--color-accent)',
                }}
              >
                {permissions.usageStats ? t.tags.granted : t.buttons.grant}
              </button>
            </div>

            {/* Battery Optimization */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="min-w-0 pr-2">
                <h5 className="text-xs font-semibold">{t.onboarding.surface.permissionsSection.batteryOptimization.title}</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t.modals.settings.checkPermissions.batteryDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestPermission('batteryOptimizationsIgnored')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: permissions.batteryOptimizationsIgnored
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'var(--color-accent-subtle)',
                  color: permissions.batteryOptimizationsIgnored
                    ? '#10b981'
                    : 'var(--color-accent)',
                }}
              >
                {permissions.batteryOptimizationsIgnored ? t.tags.granted : t.buttons.grant}
              </button>
            </div>

            {/* Foreground Service Notification */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="min-w-0 pr-2">
                <h5 className="text-xs font-semibold">{t.onboarding.surface.permissionsSection.foregroundNotification.title}</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t.modals.settings.checkPermissions.foregroundDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestPermission('postNotifications')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: permissions.postNotifications
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'var(--color-accent-subtle)',
                  color: permissions.postNotifications ? '#10b981' : 'var(--color-accent)',
                }}
              >
                {permissions.postNotifications ? t.tags.granted : t.buttons.grant}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setActiveModal(null)}>
              {t.buttons.understood}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Delete Linked Image URLs Modal */}
      <Modal
        isOpen={activeModal === 'clear-cache'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.appPreferences.deleteCachedUrls.title}
      >
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.settings.deleteCachedUrls.cacheWarning.replace('{total}', String(cachedImageCount)).replace('{custom}', String(customIconCount))}
          </p>

          <div
            className="p-3 rounded-xl border flex items-center justify-between text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span>{t.modals.settings.deleteCachedUrls.linkedImageUrls}:</span>
            <span className="font-mono">{cachedImageCount} URLs</span>
          </div>

          {cacheClearedSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{cacheClearedSuccess}</span>
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>
                {t.buttons.cancel}
              </Button>
              <Button variant="outline" onClick={() => handleConfirmClearCache(false)}>
                {t.modals.settings.deleteCachedUrls.buttons.clearCacheKeep}
              </Button>
              <Button variant="danger" onClick={() => handleConfirmClearCache(true)}>
                {t.modals.settings.deleteCachedUrls.buttons.clearCacheAll}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* 7. Credits Modal */}
      <Modal
        isOpen={activeModal === 'credits'}
        onClose={() => setActiveModal(null)}
        title={t.pages.settings.cardInfo.credits}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Kruzty Dynamics Maintainer */}
          <div className="space-y-2">
            <h5
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t.modals.settings.credits.developerSection}
            </h5>
            <div
              className="p-3 rounded-xl border flex items-center gap-3"
              onClick={() => openExternal('https://github.com/LlanderSei')}
              role="link"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') openExternal('https://github.com/LlanderSei')
              }}
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <img
                src="https://avatars.githubusercontent.com/u/126699188?v=4"
                alt="Seiraneko"
                className="w-10 h-10 rounded-full border-2"
                style={{ borderColor: 'var(--color-accent)' }}
              />
              <div className="min-w-0">
                <h6 className="text-xs font-bold leading-tight">Seiraneko</h6>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t.modals.settings.credits.maintainerRole}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Libraries Used */}
          <div className="space-y-2">
            <h5
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t.modals.settings.credits.librariesSection}
            </h5>
            <div className="space-y-1 text-xs">
              {[
                { name: 'Tauri v2', desc: t.modals.settings.credits.libraries.tauri, url: 'https://v2.tauri.app' },
                { name: 'Rust Tokio', desc: t.modals.settings.credits.libraries.tokio, url: 'https://tokio.rs' },
                { name: 'Discord Social SDK', desc: t.modals.settings.credits.libraries.sdk, url: 'https://discord.com/developers/docs/social-sdk/index.html' },
                { name: 'React 19', desc: t.modals.settings.credits.libraries.react, url: 'https://react.dev' },
                { name: 'Tailwind CSS v4', desc: t.modals.settings.credits.libraries.tailwind, url: 'https://tailwindcss.com' },
                { name: 'Lucide Icons', desc: t.modals.settings.credits.libraries.lucide, url: 'https://lucide.dev' },
              ].map(lib => (
                <div
                  key={lib.name}
                  onClick={() => openExternal(lib.url)}
                  className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="min-w-0">
                    <span className="font-semibold">{lib.name}</span>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {lib.desc}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Kizzy Contributors */}
          <div className="space-y-2">
            <h5
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t.modals.settings.credits.contributorsSection}
            </h5>
            <div
              onClick={() => openExternal('https://github.com/dead8309/Kizzy')}
              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-[var(--color-accent)] transition-colors text-xs"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="font-medium">{t.pages.settings.cardInfo.repository}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {[
                { name: 'dead8309', avatar: 'https://avatars.githubusercontent.com/u/68665948?v=4', url: 'https://github.com/dead8309' },
                { name: 'kyrie25', avatar: 'https://avatars.githubusercontent.com/u/77577746?v=4', url: 'https://github.com/kyrie25' },
                { name: 'MegaSa1nt', avatar: 'https://avatars.githubusercontent.com/u/49565695?v=4', url: 'https://github.com/MegaSa1nt' },
                { name: 'kyoyacchi', avatar: 'https://avatars.githubusercontent.com/u/63583961?v=4', url: 'https://github.com/kyoyacchi' },
                { name: 'BlackusPL', avatar: 'https://avatars.githubusercontent.com/u/45206560?v=4', url: 'https://github.com/BlackusPL' },
                { name: 'SillyDark', avatar: 'https://avatars.githubusercontent.com/u/116559191?v=4', url: 'https://github.com/SillyDark' },
                { name: 'rukamori', avatar: 'https://avatars.githubusercontent.com/u/107134739?v=4', url: 'https://github.com/rukamori' },
                { name: 'adib-yg', avatar: 'https://avatars.githubusercontent.com/u/92677767?v=4', url: 'https://github.com/adib-yg' },
                { name: 'Keitalith', avatar: 'https://avatars.githubusercontent.com/u/70456337?v=4', url: 'https://github.com/Keitalith' },
                { name: 'Hiyurin', avatar: 'https://avatars.githubusercontent.com/u/99401538?v=4', url: 'https://github.com/Hiyurin' },
                { name: 'Luiizx', avatar: 'https://avatars.githubusercontent.com/u/78708921?v=4', url: 'https://github.com/Luiizx' },
                { name: 'Sencaid', avatar: 'https://avatars.githubusercontent.com/u/146421267?v=4', url: 'https://github.com/Sencaid' },
                { name: 'Szafranek13', avatar: 'https://avatars.githubusercontent.com/u/53099243?v=4', url: 'https://github.com/Szafranek13' },
                { name: 'alecchangod', avatar: 'https://avatars.githubusercontent.com/u/88945170?v=4', url: 'https://github.com/alecchangod' },
                { name: 'clxf12', avatar: 'https://avatars.githubusercontent.com/u/123844876?v=4', url: 'https://github.com/clxf12' },
                { name: 'pachiris', avatar: 'https://avatars.githubusercontent.com/u/74104241?v=4', url: 'https://github.com/pachiris' },
                { name: 'fann22', avatar: 'https://avatars.githubusercontent.com/u/116457057?v=4', url: 'https://github.com/fann22' },
                { name: 'thijsi123', avatar: 'https://avatars.githubusercontent.com/u/64159148?v=4', url: 'https://github.com/thijsi123' },
                { name: 'OrdinaryEnder', avatar: 'https://avatars.githubusercontent.com/u/109149031?v=4', url: 'https://github.com/OrdinaryEnder' },
                { name: 'KeffSchwift', avatar: 'https://avatars.githubusercontent.com/u/141948346?v=4', url: 'https://github.com/KeffSchwift' },
                { name: 'Giasko0', avatar: 'https://avatars.githubusercontent.com/u/42590808?v=4', url: 'https://github.com/Giasko0' },
                { name: '0123-smallbottle', avatar: 'https://avatars.githubusercontent.com/u/82559028?v=4', url: 'https://github.com/0123-smallbottle' },
                { name: 'rootdevss', avatar: 'https://avatars.githubusercontent.com/u/230255491?v=4', url: 'https://github.com/rootdevss' },
                { name: 'mingokrb', avatar: 'https://avatars.githubusercontent.com/u/82242100?v=4', url: 'https://github.com/mingokrb' },
                { name: 'haz3d', avatar: 'https://avatars.githubusercontent.com/u/125324123?v=4', url: 'https://github.com/haz3d' },
                { name: 'Lqm1', avatar: 'https://avatars.githubusercontent.com/u/154405627?v=4', url: 'https://github.com/Lqm1' },
                { name: 'XanderID', avatar: 'https://avatars.githubusercontent.com/u/55838823?v=4', url: 'https://github.com/XanderID' },
                { name: 'Wans22', avatar: 'https://avatars.githubusercontent.com/u/82324747?v=4', url: 'https://github.com/Wans22' },
                { name: 'theOrangePaws', avatar: 'https://avatars.githubusercontent.com/u/135684633?v=4', url: 'https://github.com/theOrangePaws' },
                { name: 'ThanaReka', avatar: 'https://avatars.githubusercontent.com/u/96094922?v=4', url: 'https://github.com/ThanaReka' },
              ].map(c => (
                <div
                  key={c.name}
                  onClick={() => openExternal(c.url)}
                  className="p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-8 h-8 rounded-full border"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <span className="text-[10px] font-semibold truncate w-full">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button variant="ghost" className="w-full" onClick={() => setActiveModal(null)}>
              {t.buttons.close}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
