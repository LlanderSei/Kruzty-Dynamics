import React, { useState } from 'react'
import { ArrowLeft, RotateCcw, HelpCircle, Check } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Divider } from '../../components/Divider'
import { Switch } from '../../components/Switch'
import { useBackHandler } from '../navigation/useBackHandler'
import type { MediaFieldTemplates } from '../../types'
import { DEFAULT_MEDIA_FIELDS, normalizeMediaFieldTemplates } from './fieldTemplates'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'
import { useTranslation } from '../../i18n/useTranslation'

interface MediaStatusFieldConfigProps {
  onBack: () => void
}

const MEDIA_FIELDS_STORAGE_KEY = 'kd_media_field_templates'

const MEDIA_TOKENS_DOCS = [
  { token: '{{AppName}}', description: 'mediaTokenAppName' },
  { token: '{{MediaTitle}}', description: 'mediaTokenTitle' },
  { token: '{{MediaArtist}}', description: 'mediaTokenArtist' },
  { token: '{{MediaAlbum}}', description: 'mediaTokenAlbum' },
  { token: '{{MediaDescription}}', description: 'mediaTokenDescription' },
  { token: '{{PlaybackState}}', description: 'mediaTokenPlaybackState' },
  { token: '{{MediaImageUrl}}', description: 'mediaTokenImageUrl' },
  { token: '{{PlaybackStateImageUrl}}', description: 'mediaTokenPlaybackImageUrl' },
  { token: '{{AppImageUrl}}', description: 'mediaTokenFallbackImageUrl' },
] as const

export const MediaStatusFieldConfig: React.FC<MediaStatusFieldConfigProps> = ({ onBack }) => {
  const { t } = useTranslation()
  const mediaTokenIntro = t.configFields.mediaTokenIntro.split('{example}')
  const [fields, setFields] = useState<MediaFieldTemplates>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_FIELDS_STORAGE_KEY)
      if (saved) return normalizeMediaFieldTemplates(JSON.parse(saved))
    } catch {}
    return DEFAULT_MEDIA_FIELDS
  })

  const [initialFields, setInitialFields] = useState<MediaFieldTemplates>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_FIELDS_STORAGE_KEY)
      if (saved) return normalizeMediaFieldTemplates(JSON.parse(saved))
    } catch {}
    return DEFAULT_MEDIA_FIELDS
  })

  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  const isDirty = JSON.stringify(fields) !== JSON.stringify(initialFields)

  const handleFieldChange = (key: keyof MediaFieldTemplates, value: string | boolean) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleResetDefaults = () => {
    setFields(DEFAULT_MEDIA_FIELDS)
  }

  const handleSave = () => {
    try {
      localStorage.setItem(MEDIA_FIELDS_STORAGE_KEY, JSON.stringify(fields))
      notifyServiceConfigChanged()
    } catch {}
    setInitialFields(fields)
  }

  const handleBack = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true)
    } else {
      onBack()
    }
  }

  useBackHandler(handleBack)

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
        className="shrink-0 px-4 pb-3 border-b z-20 backdrop-blur-md flex items-center justify-between"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleBack}
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
            <h1 className="text-sm font-bold truncate">{t.configFields.mediaTitle}</h1>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t.configFields.mediaConfigSubtitle}
            </p>
          </div>
        </div>

        {/* Right Action Icons: Reset & Help */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            title={t.configFields.reset}
            aria-label={t.configFields.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            title={t.configFields.help}
            aria-label={t.configFields.help}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body: Scrollable medium-height textboxes */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative">
        <div className="max-w-xl w-full mx-auto p-4 space-y-4 pb-28">
          {/* Discord activity name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.titleHeader}</label>
            <textarea rows={2} value={fields.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="e.g. {{AppName}}" className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
          </div>
          <Divider />

          {/* Discord activity details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.detailsField}</label>
            <textarea rows={2} value={fields.details} onChange={e => handleFieldChange('details', e.target.value)} placeholder="e.g. {{MediaTitle ?? AppName}}" className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
          </div>
          <Divider />

          {/* Discord activity state */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.stateField}</label>
            <textarea rows={2} value={fields.state} onChange={e => handleFieldChange('state', e.target.value)} placeholder="e.g. {{MediaArtist ?? MediaDescription}}" className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
          </div>
          <Divider />

          {/* Field 4: Small Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.smallText}</label>
            <textarea
              rows={2}
              value={fields.smallText || ''}
              onChange={e => handleFieldChange('smallText', e.target.value)}
              placeholder="e.g. {{PlaybackState}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 5: Small Image (Fallback Expression) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.smallImage}</label>
            <textarea
              rows={2}
              value={fields.smallImage || ''}
              onChange={e => handleFieldChange('smallImage', e.target.value)}
              placeholder="e.g. {{HasDetectablePlaybackState ?? PlaybackStateImageUrl : AppImageUrl}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 6: Big Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.bigText}</label>
            <textarea
              rows={2}
              value={fields.bigText || ''}
              onChange={e => handleFieldChange('bigText', e.target.value)}
              placeholder="e.g. {{MediaAlbum}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 7: Big Image (Fallback Expression) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.bigImage}</label>
            <textarea
              rows={2}
              value={fields.bigImage || ''}
              onChange={e => handleFieldChange('bigImage', e.target.value)}
              placeholder="e.g. {{HasMediaImage ?? MediaImageUrl : AppImageUrl}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 8: Custom Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold block">{t.configFields.buttons}</label>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t.configFields.mediaButtonDescription}
                </p>
              </div>
              <div className="shrink-0">
                <Switch
                  checked={Boolean(fields.customButtonsEnabled)}
                  onChange={checked => handleFieldChange('customButtonsEnabled', checked)}
                  aria-label={t.catalogue.toggleButtons}
                />
              </div>
            </div>

            {/* Revealed Custom Button 1/2 fields when enabled */}
            {fields.customButtonsEnabled && (
              <div className="space-y-3 pt-1">
                {/* Button 1 Container */}
                <div
                  className="p-3 rounded-2xl border space-y-2.5"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="text-xs font-semibold block">{t.configFields.button1}</span>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>
                      {t.configFields.mediaButtonLabel}
                    </label>
                    <input
                      type="text"
                      value={fields.button1Label || ''}
                      onChange={e => handleFieldChange('button1Label', e.target.value)}
                      placeholder={`${t.configFields.mediaButtonExample}{{MediaTitle}}`}
                      className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>
                      {t.configFields.mediaButtonUrl}
                    </label>
                    <input
                      type="text"
                      value={fields.button1Url || ''}
                      onChange={e => handleFieldChange('button1Url', e.target.value)}
                      placeholder={`${t.configFields.mediaButtonExample}https://something.com/{{MediaArtist}}-{{MediaTitle}}/`}
                      className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                  </div>
                </div>

                {/* Button 2 Container */}
                <div
                  className="p-3 rounded-2xl border space-y-2.5"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="text-xs font-semibold block">{t.configFields.button2}</span>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>
                      {t.configFields.mediaButtonLabel}
                    </label>
                    <input
                      type="text"
                      value={fields.button2Label || ''}
                      onChange={e => handleFieldChange('button2Label', e.target.value)}
                      placeholder={`${t.configFields.mediaButtonExample}${t.configFields.mediaButtonListen} {{AppName}}`}
                      className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>
                      {t.configFields.mediaButtonUrl}
                    </label>
                    <input
                      type="text"
                      value={fields.button2Url || ''}
                      onChange={e => handleFieldChange('button2Url', e.target.value)}
                      placeholder={`${t.configFields.mediaButtonExample}https://music.example.com/search?q={{MediaTitle}}`}
                      className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-base)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB Check) - Appears when dirty */}
        {isDirty && (
          <div className="fixed bottom-6 right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={handleSave}
              className="w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
              }}
              title={t.configFields.save}
              aria-label={t.configFields.save}
            >
              <Check className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Modal: Token Documentation Help */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t.configFields.mediaReference}
        subtitle={t.configFields.mediaTokenSubtitle}
        footer={
          <Button size="sm" variant="primary" onClick={() => setIsHelpOpen(false)}>
            {t.configFields.helpDone}
          </Button>
        }
      >
        <div className="space-y-2.5 text-xs">
          <p className="text-[11px] leading-relaxed pb-1" style={{ color: 'var(--color-text-muted)' }}>
            {mediaTokenIntro[0]}<span className="font-mono text-[var(--color-accent)]">{'https://domain.com/{{MediaArtist}}-{{MediaTitle}}/'}</span>{mediaTokenIntro[1]}
          </p>
          {MEDIA_TOKENS_DOCS.map(item => (
            <div
              key={item.token}
              className="p-3 rounded-xl border space-y-1"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="font-mono font-bold text-[var(--color-accent)]">{item.token}</span>
              <p className="text-[11px] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {t.configFields[item.description]}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal: Confirm Discard Changes */}
      <Modal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title={t.configFields.discard}
        subtitle={t.configFields.unsaved}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsDiscardConfirmOpen(false)}>
              {t.catalogue.keepEditing}
            </Button>
            <Button size="sm" variant="danger" onClick={onBack}>
              {t.catalogue.discardChanges}
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {t.configFields.mediaDiscardMessage}
        </p>
      </Modal>
    </div>
  )
}
