import React, { useState, useRef } from 'react'
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
} from 'lucide-react'
import { useTheme, PRESET_ACCENT_COLORS, DEFAULT_ACCENT_COLOR } from './ThemeContext'
import { useAppSettings } from './useAppSettings'
import { usePermissions } from '../permissions/usePermissions'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { openExternalUrl } from '../../utils/externalLinks'
import { useTranslation } from '../../i18n/useTranslation'
import type { ActivityType, DiscordStatus } from '../../types'

const ACTIVITY_TYPE_NAMES: Record<number, string> = {
  0: 'Playing',
  1: 'Streaming',
  2: 'Listening',
  3: 'Watching',
  5: 'Competing',
}

const STATUS_NAMES: Record<string, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
  invisible: 'Invisible',
}

export const SettingsView: React.FC = () => {
  const { theme, setMode, setAccentColor } = useTheme()
  const { t } = useTranslation()
  const {
    settings,
    cachedImageCount,
    setLanguage,
    setCustomImgbbKey,
    setCustomDiscordAppId,
    setGlobalActivityType,
    setGlobalActivityStatus,
    clearImageCache,
  } = useAppSettings()
  const { permissions, requestPermission } = usePermissions()
  const colorInputRef = useRef<HTMLInputElement>(null)

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
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false)

  const handleOpenImgbbModal = () => {
    setTempImgbbKey(settings.customImgbbKey || '')
    setActiveModal('imgbb')
  }

  const handleOpenDiscordIdModal = () => {
    setTempDiscordAppId(settings.customDiscordAppId || '')
    setActiveModal('discord-id')
  }

  const handleSaveImgbb = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomImgbbKey(tempImgbbKey)
    setActiveModal(null)
  }

  const handleSaveDiscordId = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomDiscordAppId(tempDiscordAppId)
    setActiveModal(null)
  }

  const handleConfirmClearCache = () => {
    clearImageCache()
    setCacheClearedSuccess(true)
    setTimeout(() => {
      setCacheClearedSuccess(false)
      setActiveModal(null)
    }, 1200)
  }

  const openExternal = (url: string) => {
    openExternalUrl(url)
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
          <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-accent)' }}>
            KD
          </span>
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-emerald-500"
            style={{ borderColor: 'var(--color-bg-surface)' }}
          />
        </div>

        {/* 2-col Grid Info */}
        <div className="grid grid-cols-2 gap-2 w-full pt-1 text-xs">
          <div
            className="py-1.5 px-2 rounded-xl border text-center font-medium"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-base)',
            }}
          >
            Kruzty Dynamics v1.0
          </div>
          <div
            className="py-1.5 px-2 rounded-xl border text-center font-medium"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-base)',
            }}
          >
            Developed by Seiraneko
          </div>
        </div>

        {/* Full-width Architecture Description */}
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Built using Rust Core (Tokio + Tauri v2) with React 19 and TailwindCSS Frontend including Native Android Plugin Bridge. Based on the original Kizzy's Experimental RPC.
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
              <span>Learn More About This App</span>
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
                  <span>Privacy Policy</span>
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
                  <span>Check GitHub Repository</span>
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
                  <span>Go to Latest Release</span>
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
                  <span>Submit an Issue</span>
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
                  <span>Credits</span>
                </span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                  View
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
          {t.settings.appPreferences}
        </span>

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
              <h4 className="text-xs font-semibold leading-tight">{t.settings.themes}</h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.themesDesc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20"
              style={{ backgroundColor: theme.customAccentColor }}
            />
            <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text-muted)' }}>
              {theme.mode}
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
              <h4 className="text-xs font-semibold leading-tight">{t.settings.language}</h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.languageDesc} {settings.language}
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
              <h4 className="text-xs font-semibold leading-tight">{t.settings.globalDefaults}</h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.globalDefaultsDesc}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 shrink-0 text-xs font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span>{ACTIVITY_TYPE_NAMES[settings.globalActivityType]}</span>
            <span>•</span>
            <span className="capitalize">{STATUS_NAMES[settings.globalActivityStatus]}</span>
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
              <h4 className="text-xs font-semibold leading-tight">{t.settings.imgbbKey}</h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.imgbbKeyDesc}
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
            {settings.customImgbbKey ? 'Custom' : 'Default'}
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
              <h4 className="text-xs font-semibold leading-tight">{t.settings.discordAppId}</h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.discordAppIdDesc}
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
            {settings.customDiscordAppId ? 'Custom' : 'Default'}
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
              <h4 className="text-xs font-semibold leading-tight">{t.settings.checkPermissions}</h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.checkPermissionsDesc}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-500 shrink-0">
            Check
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
                {t.settings.deleteCache}
              </h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.settings.deleteCacheDesc}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border shrink-0 text-zinc-400">
            {cachedImageCount} cached
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
        title="Themes and Display"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
              Theme Mode
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
                  <span>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
                Accent Color
              </label>
              <button
                type="button"
                onClick={() => setAccentColor(DEFAULT_ACCENT_COLOR)}
                className="text-[11px] cursor-pointer hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Reset to Default
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
                Tap to customize
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setActiveModal(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Language Modal */}
      <Modal
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        title="Choose Language"
      >
        <div className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Select your preferred display language for UI labels and notifications.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Available Languages</label>
            <Select
              value={settings.language}
              onChange={e => {
                setLanguage(e.target.value)
                setActiveModal(null)
              }}
              options={[
                { value: 'System Default', label: 'System Default (Recommended)' },
                { value: 'English (US)', label: 'English (US)' },
                { value: 'Filipino / Tagalog', label: 'Filipino / Tagalog' },
                { value: 'Español', label: 'Español' },
                { value: '日本語 (Japanese)', label: '日本語 (Japanese)' },
                { value: 'Deutsch', label: 'Deutsch' },
                { value: 'Français', label: 'Français' },
                { value: 'Chinese (简体中文)', label: 'Chinese (简体中文)' },
              ]}
            />
          </div>

          <div className="pt-2">
            <Button variant="ghost" className="w-full" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2.5 Global Defaults Modal */}
      <Modal
        isOpen={activeModal === 'global-defaults'}
        onClose={() => setActiveModal(null)}
        title="Global Defaults"
        subtitle="Default presence configuration for unconfigured apps"
      >
        <div className="space-y-4 text-xs">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            These defaults are automatically used when an app or presence activity does not specify its own activity type or status.
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
                Activity Type
              </label>
              <Select
                value={settings.globalActivityType}
                onChange={e => setGlobalActivityType(Number(e.target.value) as ActivityType)}
                fullWidth={true}
              >
                <option value={0}>Playing</option>
                <option value={1}>Streaming</option>
                <option value={2}>Listening</option>
                <option value={3}>Watching</option>
                <option value={5}>Competing</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
                Activity Status
              </label>
              <Select
                value={settings.globalActivityStatus}
                onChange={e => setGlobalActivityStatus(e.target.value as DiscordStatus)}
                fullWidth={true}
              >
                <option value="online">Online</option>
                <option value="idle">Idle</option>
                <option value="dnd">Do Not Disturb</option>
                <option value="offline">Offline</option>
                <option value="invisible">Invisible</option>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setActiveModal(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Set ImgBB API Key Modal */}
      <Modal
        isOpen={activeModal === 'imgbb'}
        onClose={() => setActiveModal(null)}
        title="Set ImgBB API Key"
      >
        <form onSubmit={handleSaveImgbb} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Set your own ImgBB API Key to upload custom app and media asset images to Discord CDN.
            Visit{' '}
            <button
              type="button"
              onClick={() => openExternal('https://api.imgbb.com')}
              className="underline cursor-pointer font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              api.imgbb.com
            </button>{' '}
            to obtain a key.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">ImgBB API Key</label>
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
                  <span>Reset to Default</span>
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
                    ? '•••••••••••••••• (Custom Key Set)'
                    : 'Using default system key'
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
                  title="Reset to default"
                  className="p-2 rounded-xl border shrink-0 text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Leaving this field empty resets to the built-in default API key. Custom keys are never exposed in plaintext.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Set Discord Application ID Modal */}
      <Modal
        isOpen={activeModal === 'discord-id'}
        onClose={() => setActiveModal(null)}
        title="Set Discord Application ID"
      >
        <form onSubmit={handleSaveDiscordId} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Set your own Discord Application ID from the{' '}
            <button
              type="button"
              onClick={() => openExternal('https://discord.com/developers/applications/')}
              className="underline cursor-pointer font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Discord Developer Portal
            </button>
            .
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Discord Application ID</label>
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
                  <span>Reset to Default</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempDiscordAppId}
                onChange={e => setTempDiscordAppId(e.target.value)}
                placeholder="1572590527562391713 (Default)"
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
                  title="Reset to default"
                  className="p-2 rounded-xl border shrink-0 text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Leaving this field empty will reset back to the default Kruzty Dynamics application ID.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save ID
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Check Permissions Modal */}
      <Modal
        isOpen={activeModal === 'permissions'}
        onClose={() => setActiveModal(null)}
        title="Android System Permissions"
      >
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Status of permissions required to read active media notifications and foreground applications:
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
                <h5 className="text-xs font-semibold">Notification Access</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Special App Access for media detection
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
                {permissions.notificationListener ? 'Granted' : 'Grant'}
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
                <h5 className="text-xs font-semibold">Usage Access</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Detect running foreground games & apps
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
                {permissions.usageStats ? 'Granted' : 'Grant'}
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
                <h5 className="text-xs font-semibold">Battery Optimization</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Prevents Android from killing presence service
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
                {permissions.batteryOptimizationsIgnored ? 'Granted' : 'Grant'}
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
                <h5 className="text-xs font-semibold">Foreground Service Notification</h5>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Status bar indicator for ongoing Discord presence
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
                {permissions.postNotifications ? 'Granted' : 'Grant'}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setActiveModal(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Delete Linked Image URLs Modal */}
      <Modal
        isOpen={activeModal === 'clear-cache'}
        onClose={() => setActiveModal(null)}
        title="Delete Linked Image URLs"
      >
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Clears associated URLs of uploaded images used on app (including custom) or media status projection. The service will then reupload the images again when needed.
          </p>

          <div
            className="p-3 rounded-xl border flex items-center justify-between text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span>Cached Upload Records:</span>
            <span className="font-mono">{cachedImageCount} URLs</span>
          </div>

          {cacheClearedSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Image URL cache cleared!</span>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmClearCache}>
                Clear Image Cache
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* 7. Credits Modal */}
      <Modal
        isOpen={activeModal === 'credits'}
        onClose={() => setActiveModal(null)}
        title="Credits"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Kruzty Dynamics Maintainer */}
          <div className="space-y-2">
            <h5
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Kruzty Dynamics
            </h5>
            <div
              className="p-3 rounded-xl border flex items-center gap-3"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=seiraneko"
                alt="Seiraneko"
                className="w-10 h-10 rounded-full border-2"
                style={{ borderColor: 'var(--color-accent)' }}
              />
              <div className="min-w-0">
                <h6 className="text-xs font-bold leading-tight">Seiraneko</h6>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  Current Maintainer & Developer
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
              Libraries Used in this App
            </h5>
            <div className="space-y-1 text-xs">
              {[
                { name: 'Tauri v2', desc: 'Lightweight cross-platform native runtime', url: 'https://v2.tauri.app' },
                { name: 'Rust Tokio', desc: 'Asynchronous event-driven network runtime', url: 'https://tokio.rs' },
                { name: 'React 19', desc: 'Modern user interface component architecture', url: 'https://react.dev' },
                { name: 'Tailwind CSS v4', desc: 'Utility-first modern responsive styling', url: 'https://tailwindcss.com' },
                { name: 'Lucide Icons', desc: 'Community crafted clean vector icons', url: 'https://lucide.dev' },
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
              Kizzy Contributors
            </h5>
            <div
              onClick={() => openExternal('https://github.com/dead8309/Kizzy')}
              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-[var(--color-accent)] transition-colors text-xs"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="font-medium">Go to the Kizzy repository</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {[
                { name: 'dead8309', role: 'Original Kizzy Creator' },
                { name: 'satoru8', role: 'Contributor' },
                { name: 'general-s-slime', role: 'Contributor' },
                { name: 'x0a0', role: 'Contributor' },
                { name: 'dread-0', role: 'Contributor' },
                { name: 'Kizzy Community', role: 'Design & Testers' },
              ].map(c => (
                <div
                  key={c.name}
                  onClick={() => openExternal(`https://github.com/${c.name}`)}
                  className="p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${c.name}`}
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
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
