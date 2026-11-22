import React, { useState } from 'react'
import { ArrowLeft, RotateCcw, HelpCircle, Check } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Divider } from '../../components/Divider'
import { Switch } from '../../components/Switch'
import { useBackHandler } from '../navigation/useBackHandler'
import type { MediaFieldTemplates } from '../../types'
import { notifyServiceConfigChanged } from '../dashboard/serviceConfig'

interface MediaStatusFieldConfigProps {
  onBack: () => void
}

const MEDIA_FIELDS_STORAGE_KEY = 'kd_media_field_templates'

const DEFAULT_MEDIA_FIELDS: MediaFieldTemplates = {
  title: '{{MediaTitle ?? AppName}}',
  line1: '{{MediaArtist ?? MediaDescription}}',
  line2: '{{MediaAlbum ?? MediaDescription}}',
  smallText: '{{PlaybackState}}',
  smallImage: '{{HasDetectablePlaybackState ?? PlaybackStateImageLink : AppImageLink}}',
  bigText: '',
  bigImage: '{{HasMediaImage ?? MediaImageLink : AppImageLink}}',
  customButtonsEnabled: false,
  button1Label: '',
  button1Url: '',
  button2Label: '',
  button2Url: '',
}

const MEDIA_TOKENS_DOCS = [
  { token: '{{MediaTitle}}', description: 'Active media song/track title from notification metadata.' },
  { token: '{{AppName}}', description: 'Fallback application name if track title is empty.' },
  { token: '{{MediaArtist}}', description: 'Artist name / creator of the playing audio/video.' },
  { token: '{{MediaAlbum}}', description: 'Album name or playlist container.' },
  { token: '{{MediaDescription}}', description: 'Video/media description from web or video players.' },
  { token: '{{PlaybackState}}', description: 'Current playback state (Playing, Paused, Stopped).' },
  { token: '{{MediaImageLink}}', description: 'Cached ImgBB URL of the media album art / thumbnail.' },
  { token: '{{PlaybackStateImageLink}}', description: 'Asset image link for current playback indicator.' },
  { token: '{{AppImageLink}}', description: 'Fallback application icon if no artwork is available.' },
]

export const MediaStatusFieldConfig: React.FC<MediaStatusFieldConfigProps> = ({ onBack }) => {
  const [fields, setFields] = useState<MediaFieldTemplates>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_FIELDS_STORAGE_KEY)
      if (saved) return { ...DEFAULT_MEDIA_FIELDS, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_MEDIA_FIELDS
  })

  const [initialFields, setInitialFields] = useState<MediaFieldTemplates>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_FIELDS_STORAGE_KEY)
      if (saved) return { ...DEFAULT_MEDIA_FIELDS, ...JSON.parse(saved) }
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
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">Media Status Field Config</h1>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Customize expressions for media playback
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
            title="Reset to Defaults"
            aria-label="Reset Defaults"
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
            title="Available Tokens Help"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body: Scrollable medium-height textboxes */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative">
        <div className="max-w-xl w-full mx-auto p-4 space-y-4 pb-28">
          {/* Field 1: Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">Media Title (Activity Details)</label>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              The player app name appears in the “Listening to…” header.
            </p>
            <textarea
              rows={2}
              value={fields.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              placeholder="e.g. {{MediaTitle ?? AppName}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 2: Line 1 (State / Artist) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">Line 1 (Activity State / Artist)</label>
            <textarea
              rows={2}
              value={fields.line1 || ''}
              onChange={e => handleFieldChange('line1', e.target.value)}
              placeholder="e.g. {{MediaArtist ?? MediaDescription}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 3: Line 2 (Large Image Text / Album) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">Line 2 (Album / Image Text)</label>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Shown beneath the artist on Discord’s media card.
            </p>
            <textarea
              rows={2}
              value={fields.line2 || ''}
              onChange={e => handleFieldChange('line2', e.target.value)}
              placeholder="e.g. {{MediaAlbum ?? MediaDescription}}"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-base)',
              }}
            />
          </div>
          <Divider />

          {/* Field 4: Small Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">Small Text</label>
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
            <label className="text-xs font-semibold block">Small Image (Fallback Exp)</label>
            <textarea
              rows={2}
              value={fields.smallImage || ''}
              onChange={e => handleFieldChange('smallImage', e.target.value)}
              placeholder="e.g. {{HasDetectablePlaybackState ?? PlaybackStateImageLink : AppImageLink}}"
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
            <label className="text-xs font-semibold block">Big Text (Line 2 Fallback)</label>
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
            <label className="text-xs font-semibold block">Big Image (Fallback Exp)</label>
            <textarea
              rows={2}
              value={fields.bigImage || ''}
              onChange={e => handleFieldChange('bigImage', e.target.value)}
              placeholder="e.g. {{HasMediaImage ?? MediaImageLink : AppImageLink}}"
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
                <label className="text-xs font-semibold block">Custom Buttons</label>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  Add up to 2 interactive presence buttons with token expressions
                </p>
              </div>
              <div className="shrink-0">
                <Switch
                  checked={Boolean(fields.customButtonsEnabled)}
                  onChange={checked => handleFieldChange('customButtonsEnabled', checked)}
                  aria-label="Toggle Custom Buttons"
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
                  <span className="text-xs font-semibold block">Button 1</span>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>
                      Label
                    </label>
                    <input
                      type="text"
                      value={fields.button1Label || ''}
                      onChange={e => handleFieldChange('button1Label', e.target.value)}
                      placeholder="e.g. {{MediaTitle}}"
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
                      URL
                    </label>
                    <input
                      type="text"
                      value={fields.button1Url || ''}
                      onChange={e => handleFieldChange('button1Url', e.target.value)}
                      placeholder="e.g. https://something.com/{{MediaArtist}}-{{MediaTitle}}/"
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
                  <span className="text-xs font-semibold block">Button 2</span>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>
                      Label
                    </label>
                    <input
                      type="text"
                      value={fields.button2Label || ''}
                      onChange={e => handleFieldChange('button2Label', e.target.value)}
                      placeholder="e.g. Listen on {{AppName}}"
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
                      URL
                    </label>
                    <input
                      type="text"
                      value={fields.button2Url || ''}
                      onChange={e => handleFieldChange('button2Url', e.target.value)}
                      placeholder="e.g. https://music.example.com/search?q={{MediaTitle}}"
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
              title="Save Fields"
              aria-label="Save Fields"
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
        title="Media Token Reference"
        subtitle="Dynamic variables available in media expressions & buttons"
        footer={
          <Button size="sm" variant="primary" onClick={() => setIsHelpOpen(false)}>
            Got it
          </Button>
        }
      >
        <div className="space-y-2.5 text-xs">
          <p className="text-[11px] leading-relaxed pb-1" style={{ color: 'var(--color-text-muted)' }}>
            Tokens can be embedded directly in text fields and button Labels/URLs (e.g. <span className="font-mono text-[var(--color-accent)]">{'https://domain.com/{{MediaArtist}}-{{MediaTitle}}/'}</span>).
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
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal: Confirm Discard Changes */}
      <Modal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title="Discard Unsaved Changes?"
        subtitle="Unsaved modifications"
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button size="sm" variant="outline" onClick={() => setIsDiscardConfirmOpen(false)}>
              Keep Editing
            </Button>
            <Button size="sm" variant="danger" onClick={onBack}>
              Discard Changes
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          You have unsaved changes in your Media Status Fields. Leaving now will revert them to the
          previous state.
        </p>
      </Modal>
    </div>
  )
}
