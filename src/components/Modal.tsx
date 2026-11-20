import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { useBackHandler } from '../features/navigation/useBackHandler'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useBackHandler(onClose, isOpen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`relative w-full ${maxWidthClass} rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] z-10 transition-all border drawer-slide-up`}
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-base)',
        }}
      >
        {/* Mobile Drawer Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-3 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="text-lg font-semibold leading-6">{title}</h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80 -mr-1"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-muted)',
            }}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="pt-3 border-t flex items-center justify-end gap-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
