import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  ImagePlus,
  Loader2,
} from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { useBackHandler } from '../navigation/useBackHandler'
import type { OutsideAppBehavior, AppTimestampMode } from '../../types'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useAppSettings } from '../settings/useAppSettings'
import { useTranslation } from '../../i18n/useTranslation'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'
import { addLog } from '../accounts/discordAuth'

const APP_CONFIG_STORAGE_KEY = 'kd_app_presence_config'

interface StoredAppConfig {
  outsidePolicy: OutsideAppBehavior
  timestampStrategy: AppTimestampMode
  customDateTime: string
  customName: string
  customDetails: string
  customState: string
  customSmallText: string
  customSmallImage: string
  customBigText: string
  customBigImage: string
}

const DEFAULT_APP_CONFIG: StoredAppConfig = {
  outsidePolicy: 'freeze',
  timestampStrategy: 'persistent',
  customDateTime: '',
  customName: 'Chilling on Phone',
  customDetails: 'Home Screen',
  customState: 'Away from apps',
  customSmallText: '',
  customSmallImage: '',
  customBigText: '',
  customBigImage: '',
}

function loadAppConfig(): StoredAppConfig {
  try {
    const saved = localStorage.getItem(APP_CONFIG_STORAGE_KEY)
    return saved ? { ...DEFAULT_APP_CONFIG, ...JSON.parse(saved) } : DEFAULT_APP_CONFIG
  } catch {
    return DEFAULT_APP_CONFIG
  }
}

interface AppPresenceConfigProps {
  onBack: () => void
  onNavigateToCatalogue: () => void
  onNavigateToStatusFields: () => void
}

export const AppPresenceConfig: React.FC<AppPresenceConfigProps> = ({
  onBack,
  onNavigateToCatalogue,
  onNavigateToStatusFields,
}) => {
  const { t } = useTranslation()
  const [initialConfig] = useState(loadAppConfig)
  const [outsidePolicy, setOutsidePolicy] = useState<OutsideAppBehavior>(initialConfig.outsidePolicy)
  const [timestampStrategy, setTimestampStrategy] = useState<AppTimestampMode>(initialConfig.timestampStrategy)
  const [customDateTime, setCustomDateTime] = useState<string>(initialConfig.customDateTime)

  // Custom Fallback Fields when policy === 'custom'
  const [customName, setCustomName] = useState(initialConfig.customName)
  const [customDetails, setCustomDetails] = useState(initialConfig.customDetails)
  const [customState, setCustomState] = useState(initialConfig.customState)
  const [customSmallText, setCustomSmallText] = useState(initialConfig.customSmallText)
  const [customSmallImage, setCustomSmallImage] = useState(initialConfig.customSmallImage)
  const [customBigText, setCustomBigText] = useState(initialConfig.customBigText)
  const [customBigImage, setCustomBigImage] = useState(initialConfig.customBigImage)
  const [uploadingImage, setUploadingImage] = useState<'small' | 'big' | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { settings } = useAppSettings()

  // Modals for Help
  const [helpModal, setHelpModal] = useState<'policy' | 'timestamp' | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify({
        outsidePolicy,
        timestampStrategy,
        customDateTime,
        customName,
        customDetails,
        customState,
        customSmallText,
        customSmallImage,
        customBigText,
        customBigImage,
      }))
      notifyServiceConfigChanged()
    } catch {
      // Keep the configuration active for this session if storage is unavailable.
    }
  }, [outsidePolicy, timestampStrategy, customDateTime, customName, customDetails, customState, customSmallText, customSmallImage, customBigText, customBigImage])

  const uploadFallbackImage = async (kind: 'small' | 'big', file: File) => {
    setUploadingImage(kind)
    setUploadProgress(0)
    const requestId = `fallback-${kind}-${Date.now()}`
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Could not read image.'))
        reader.onload = () => resolve(String(reader.result).split(',', 2)[1] || '')
        reader.readAsDataURL(file)
      })
      const unlisten = await listen<{ requestId: string; progress: number }>('imgbb-upload-progress', event => {
        if (event.payload.requestId === requestId) setUploadProgress(event.payload.progress)
      })
      try {
        addLog('info', `Fallback image upload started: kind=${kind} file=${file.name} bytes=${file.size} requestId=${requestId}`)
        const url = await invoke<string>('upload_app_icon', { imageBase64, imageName: file.name, apiKey: settings.customImgbbKey || null, requestId })
        addLog('info', `Fallback image upload successful: kind=${kind} url=${url}`)
        if (kind === 'small') setCustomSmallImage(url)
        else setCustomBigImage(url)
      } catch (error) {
        addLog('error', `Fallback image upload failed: kind=${kind} error=${error instanceof Error ? error.message : String(error)}`)
        throw error
      } finally {
        unlisten()
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: error instanceof Error ? error.message : 'Image upload failed.' } }))
    } finally {
      setUploadingImage(null)
    }
  }

  useBackHandler(onBack)

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
        className="shrink-0 px-4 pb-3 border-b z-20 backdrop-blur-md flex items-center gap-3"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-base)',
          }}
          aria-label={t.configFields.back}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{t.appPresence.title}</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t.appPresence.subtitle}
          </p>
        </div>
      </header>

      {/* Body: Scrollable Column */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative">
        <div className="max-w-xl w-full mx-auto p-4 space-y-3 pb-24">
          {/* Link 1: Application Catalogue */}
          <div
            onClick={onNavigateToCatalogue}
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{t.appPresence.catalogue}</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.appPresence.catalogueDesc}
              </p>
            </div>
            <div className="p-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Option 2: Outside Detected App Policies */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">{t.appPresence.outsidePolicies}</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.appPresence.outsideDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('policy')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title={t.appPresence.policyHelp}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={outsidePolicy}
              onChange={e => setOutsidePolicy(e.target.value as OutsideAppBehavior)}
              fullWidth={true}
            >
              <option value="freeze">{t.appPresence.freeze}</option>
              <option value="custom">{t.appPresence.customFallback}</option>
              <option value="drop">{t.appPresence.drop}</option>
            </Select>

            {/* If Custom is selected: Expands custom fallback fields */}
            {outsidePolicy === 'custom' && (
              <div
                className="p-3 rounded-xl border space-y-2 mt-2 animate-in fade-in duration-150"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span className="text-[11px] font-semibold block text-[var(--color-accent)]">
                  {t.appPresence.fallbackPresence}
                </span>

                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t.appPresence.activityName}
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-base)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t.appPresence.details}
                  </label>
                  <input
                    type="text"
                    value={customDetails}
                    onChange={e => setCustomDetails(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-base)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t.appPresence.state}
                  </label>
                  <input
                    type="text"
                    value={customState}
                    onChange={e => setCustomState(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-base)',
                    }}
                  />
                </div>

                {([
                  [t.appPresence.smallText, customSmallText, setCustomSmallText],
                  [t.appPresence.bigText, customBigText, setCustomBigText],
                ] as const).map(([label, value, setter]) => (
                  <div key={label}>
                    <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                    <input type="text" value={value} onChange={event => setter(event.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
                  </div>
                ))}

                {([
                  [t.appPresence.smallImage, customSmallImage, setCustomSmallImage, 'small'],
                  [t.appPresence.bigImage, customBigImage, setCustomBigImage, 'big'],
                ] as const).map(([label, value, setter, kind]) => (
                  <div key={label}>
                    <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                    <div className="flex gap-2">
                    <input type="url" value={value} onChange={event => setter(event.target.value)} className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} placeholder={t.appPresence.imageUrl} />
                      <label className="p-2 rounded-lg border cursor-pointer" title={`${t.appPresence.uploadImage} ${label}`} style={{ borderColor: 'var(--color-border)' }}>
                        {uploadingImage === kind ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingImage !== null} onChange={event => { const file = event.target.files?.[0]; if (file) void uploadFallbackImage(kind, file); event.currentTarget.value = '' }} />
                      </label>
                    </div>
                  </div>
                ))}
                {uploadingImage && <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t.appPresence.uploadingImage} {uploadProgress}%</div>}
              </div>
            )}
          </div>

          {/* Option 3: Timestamp Strategy */}
          <div
            className="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">{t.appPresence.timestampStrategy}</span>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.appPresence.timestampDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpModal('timestamp')}
                className="p-1.5 rounded-xl border hover:border-[var(--color-accent)] text-[var(--color-text-muted)] shrink-0 transition-colors"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                title={t.appPresence.timestampHelp}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={timestampStrategy}
              onChange={e => setTimestampStrategy(e.target.value as AppTimestampMode)}
              fullWidth={true}
            >
              <option value="persistent">{t.appPresence.persistent}</option>
              <option value="reset">{t.appPresence.resetOnLaunch}</option>
              <option value="custom">{t.appPresence.customFixedTime}</option>
            </Select>

            {/* If Custom is selected: Expands DateTime picker */}
            {timestampStrategy === 'custom' && (
              <div
                className="p-3 rounded-xl border space-y-2 mt-2 animate-in fade-in duration-150"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-[11px] font-semibold text-[var(--color-accent)]">
                    {t.appPresence.fixedStart}
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={e => setCustomDateTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-base)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Link 4: Status Field Configuration */}
          <div
            onClick={onNavigateToStatusFields}
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--color-accent)] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{t.appPresence.statusFieldConfig}</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t.appPresence.statusFieldDescription}
              </p>
            </div>
            <div className="p-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={Boolean(helpModal)}
        onClose={() => setHelpModal(null)}
        title={helpModal === 'policy' ? t.appPresence.outsideHelpTitle : t.appPresence.timestampHelpTitle}
        subtitle={t.appPresence.configurationDetails}
        footer={
          <Button size="sm" variant="primary" onClick={() => setHelpModal(null)}>
            {t.appPresence.understood}
          </Button>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {helpModal === 'policy' ? (
            <>
              <p>
                <strong>{t.appPresence.freeze}:</strong> {t.appPresence.freezeHelp}
              </p>
              <p>
                <strong>{t.appPresence.customFallback}:</strong> {t.appPresence.customHelp}
              </p>
              <p>
                <strong>{t.appPresence.drop}:</strong> {t.appPresence.dropHelp}
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>{t.appPresence.persistent}:</strong> {t.appPresence.persistentHelp}
              </p>
              <p>
                <strong>{t.appPresence.resetOnLaunch}:</strong> {t.appPresence.resetHelp}
              </p>
              <p>
                <strong>{t.appPresence.customFixedTime}:</strong> {t.appPresence.fixedHelp}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
