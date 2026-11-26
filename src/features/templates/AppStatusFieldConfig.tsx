import React, { useState } from 'react'
import { ArrowLeft, RotateCcw, HelpCircle, Check } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Divider } from '../../components/Divider'
import { useBackHandler } from '../navigation/useBackHandler'
import type { AppFieldTemplates } from '../../types'
import { DEFAULT_APP_FIELDS, normalizeAppFieldTemplates } from './fieldTemplates'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'
import { useTranslation } from '../../i18n/useTranslation'

interface AppStatusFieldConfigProps {
  onBack: () => void
}

const APP_FIELDS_STORAGE_KEY = 'kd_app_field_templates'

function loadAppFields(): AppFieldTemplates {
  try {
    const saved = localStorage.getItem(APP_FIELDS_STORAGE_KEY)
    if (!saved) return DEFAULT_APP_FIELDS
    return normalizeAppFieldTemplates(JSON.parse(saved))
  } catch {
    return DEFAULT_APP_FIELDS
  }
}

const APP_TOKENS_DOCS = [
  { token: '{{AppActivityType}}', description: 'appActivityType' },
  { token: '{{AppPlatformType}}', description: 'appPlatformType' },
  { token: '{{AppName}}', description: 'appName' },
  { token: '{{AppDetails}}', description: 'appDetails' },
  { token: '{{AppState}}', description: 'appState' },
  { token: '{{AppSmallText}}', description: 'appSmallText' },
  { token: '{{AppSmallUrl}}', description: 'appSmallUrl' },
  { token: '{{AppImageUrl}}', description: 'appImageUrl' },
  { token: '{{PackageName}}', description: 'appPackageName' },
] as const

export const AppStatusFieldConfig: React.FC<AppStatusFieldConfigProps> = ({ onBack }) => {
  const { t } = useTranslation()
  const [fields, setFields] = useState<AppFieldTemplates>(loadAppFields)
  const [initialFields, setInitialFields] = useState<AppFieldTemplates>(loadAppFields)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  const isDirty = JSON.stringify(fields) !== JSON.stringify(initialFields)

  const handleFieldChange = (key: keyof AppFieldTemplates, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleResetDefaults = () => {
    setFields(DEFAULT_APP_FIELDS)
  }

  const handleSave = () => {
    try {
      localStorage.setItem(APP_FIELDS_STORAGE_KEY, JSON.stringify(fields))
      notifyServiceConfigChanged()
    } catch {
      // Keep the values available for this session if storage is unavailable.
    }
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
            aria-label={t.subPages.buttons.back}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">{t.subPages.application.statusFieldConfig.title}</h1>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t.subPages.application.statusFieldConfig.subtitle}
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
            title={t.subPages.buttons.reset}
            aria-label={t.subPages.buttons.reset}
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
            title={t.subPages.buttons.help}
            aria-label={t.subPages.buttons.help}
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
            <label className="text-xs font-semibold block">{t.configFields.status.title}</label>
            <textarea rows={2} value={fields.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="e.g. {{AppName}}" className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
          </div>
          <Divider />

          {/* Discord activity details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.status.line1}</label>
            <textarea rows={2} value={fields.details} onChange={e => handleFieldChange('details', e.target.value)} placeholder="null / empty or custom expression" className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
          </div>
          <Divider />

          {/* Discord activity state */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.status.line2}</label>
            <textarea rows={2} value={fields.state} onChange={e => handleFieldChange('state', e.target.value)} placeholder="null / empty or custom expression" className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }} />
          </div>
          <Divider />

          {/* Field 4: Small Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.status.smallText}</label>
            <textarea
              rows={2}
              value={fields.smallText || ''}
              onChange={e => handleFieldChange('smallText', e.target.value)}
              placeholder="null / empty or custom expression"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 5: Small Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.status.smallImage}</label>
            <textarea
              rows={2}
              value={fields.smallImage || ''}
              onChange={e => handleFieldChange('smallImage', e.target.value)}
              placeholder="null / empty or custom expression"
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
            <label className="text-xs font-semibold block">{t.configFields.status.bigText}</label>
            <textarea
              rows={2}
              value={fields.bigText || ''}
              onChange={e => handleFieldChange('bigText', e.target.value)}
              placeholder="e.g. {{AppName}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 7: Big Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">{t.configFields.status.bigImage}</label>
            <textarea
              rows={2}
              value={fields.bigImage || ''}
              onChange={e => handleFieldChange('bigImage', e.target.value)}
              placeholder="e.g. {{AppImageUrl}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
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
              title={t.buttons.save.fields}
              aria-label={t.buttons.save.fields}
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
        title={t.modals.tokenReference.application.title}
        subtitle={t.modals.tokenReference.application.desc}
        footer={
          <Button size="sm" variant="primary" onClick={() => setIsHelpOpen(false)}>
            {t.buttons.helpDone}
          </Button>
        }
      >
        <div className="space-y-2.5 text-xs">
          <p className="text-[11px] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
            {t.modals.tokenReference.application.expressionOps}
          </p>
          {APP_TOKENS_DOCS.map(item => (
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
                {t.tokens[item.description]}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal: Confirm Discard Changes */}
      <Modal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title={t.modals.unsavedChanges.discard}
        subtitle={t.modals.unsavedChanges.unsaved}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsDiscardConfirmOpen(false)}>
              {t.buttons.keepEditing}
            </Button>
            <Button size="sm" variant="danger" onClick={onBack}>
              {t.buttons.discardChanges}
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {t.subPages.application.statusFieldConfig.discardMsg}
        </p>
      </Modal>
    </div>
  )
}
