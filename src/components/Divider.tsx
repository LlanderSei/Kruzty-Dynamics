import React from 'react'

interface DividerProps {
  label?: string
  className?: string
}

export const Divider: React.FC<DividerProps> = ({ label, className = '' }) => {
  if (label) {
    return (
      <div className={`relative flex py-2 items-center ${className}`}>
        <div className="flex-grow border-t" style={{ borderColor: 'var(--color-border)' }} />
        <span
          className="shrink-0 px-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </span>
        <div className="flex-grow border-t" style={{ borderColor: 'var(--color-border)' }} />
      </div>
    )
  }

  return (
    <hr
      className={`border-t my-3 ${className}`}
      style={{ borderColor: 'var(--color-border)' }}
    />
  )
}
