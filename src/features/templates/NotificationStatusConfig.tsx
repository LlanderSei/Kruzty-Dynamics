import React, { useState } from 'react'
import { ArrowLeft, Check, CircleHelp, RotateCcw } from 'lucide-react'
import { Button } from '../../components/Button'
import { Divider } from '../../components/Divider'
import { Modal } from '../../components/Modal'
import { useBackHandler } from '../navigation/useBackHandler'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'
import { useTranslation } from '../../i18n/useTranslation'
import type { NotificationProjectionTemplates } from '../../types'
import { DEFAULT_NOTIFICATION_FIELDS, normalizeNotificationProjectionTemplates } from './fieldTemplates'

const STORAGE_KEY = 'kd_notification_field_templates'

function loadFields(): NotificationProjectionTemplates {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? normalizeNotificationProjectionTemplates(JSON.parse(saved)) : DEFAULT_NOTIFICATION_FIELDS
  } catch {
    return DEFAULT_NOTIFICATION_FIELDS
  }
}

interface NotificationStatusConfigProps {
  onBack: () => void
}

export const NotificationStatusConfig: React.FC<NotificationStatusConfigProps> = ({ onBack }) => {
  const { t } = useTranslation()
  const [fields, setFields] = useState(loadFields)
  const [initialFields, setInitialFields] = useState(loadFields)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const isDirty = JSON.stringify(fields) !== JSON.stringify(initialFields)

  const handleBack = () => {
    if (isDirty) setIsDiscardConfirmOpen(true)
    else onBack()
  }

  useBackHandler(handleBack)

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
      notifyServiceConfigChanged()
    } catch {
      // Keep the staged values available for this session if storage is unavailable.
    }
    setInitialFields(fields)
  }

  const renderProjectionFields = (
    section: string,
    titleKey: 'appTitle' | 'mediaTitle',
    subtitleKey: 'appSubtitle' | 'mediaSubtitle',
  ) => (
    <section className="space-y-4" key={section}>
      <h2 className="text-sm font-bold">{section}</h2>
      {([['title', titleKey], ['subtitle', subtitleKey]] as const).map(([labelKey, fieldKey]) => (
        <div className="space-y-1.5" key={fieldKey}>
          <label className="text-xs font-semibold block">{t.configFields.notification[labelKey]}</label>
          <textarea
            rows={3}
            value={fields[fieldKey]}
            onChange={event => setFields(previous => ({ ...previous, [fieldKey]: event.target.value }))}
            className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-y"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-base)',
            }}
          />
        </div>
      ))}
    </section>
  )

  return (
    <div
      className="h-screen w-screen flex flex-col justify-between overflow-hidden select-none"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)' }}
    >
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
            style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-base)' }}
            aria-label={t.subPages.buttons.back}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">{t.pages.settings.appPreferences.notificationProjection.title}</h1>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t.subPages.notification.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFields(DEFAULT_NOTIFICATION_FIELDS)}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
            style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            title={t.subPages.buttons.reset}
            aria-label={t.subPages.buttons.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent)] active:scale-95"
            style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            title={t.subPages.buttons.help}
            aria-label={t.subPages.buttons.help}
          >
            <CircleHelp className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-y-contain relative">
        <div className="max-w-xl w-full mx-auto p-4 space-y-5 pb-28">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t.subPages.notification.helpIntro}
          </p>
          {renderProjectionFields(t.subPages.notification.sections.application, 'appTitle', 'appSubtitle')}
          <Divider />
          {renderProjectionFields(t.subPages.notification.sections.media, 'mediaTitle', 'mediaSubtitle')}
        </div>
        {isDirty && (
          <div className="fixed bottom-6 right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={handleSave}
              className="w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
              style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
              title={t.buttons.save.fields}
              aria-label={t.buttons.save.fields}
            >
              <Check className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t.subPages.buttons.help}
        subtitle={t.pages.settings.appPreferences.notificationProjection.title}
        footer={<Button size="sm" variant="primary" onClick={() => setIsHelpOpen(false)}>{t.buttons.helpDone}</Button>}
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {t.subPages.notification.helpIntro}
        </p>
      </Modal>

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
          {t.subPages.notification.discard}
        </p>
      </Modal>
    </div>
  )
}
