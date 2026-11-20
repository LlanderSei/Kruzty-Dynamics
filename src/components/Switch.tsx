import React from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault()
      e.stopPropagation()
      onChange(!checked)
    }
  }

  return (
    <div
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
      style={{
        backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </div>
  )
}
