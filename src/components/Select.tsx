import React from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  className?: string
  wrapperClassName?: string
  fullWidth?: boolean
}

export const Select: React.FC<SelectProps> = ({
  options,
  children,
  className = '',
  wrapperClassName = '',
  fullWidth = true,
  disabled,
  style,
  ...props
}) => {
  return (
    <div
      className={`relative inline-flex items-center ${
        fullWidth ? 'w-full' : 'w-auto'
      } ${wrapperClassName}`}
    >
      <select
        disabled={disabled}
        className={`appearance-none rounded-xl border pl-3.5 pr-8.5 py-2 text-xs focus:outline-hidden transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          fullWidth ? 'w-full' : 'w-auto'
        } ${className}`}
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-base)',
          ...style,
        }}
        {...props}
      >
        {options
          ? options.map(opt => (
              <option
                key={opt.value}
                value={opt.value}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  color: 'var(--color-text-base)',
                }}
              >
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown
        className="w-3.5 h-3.5 absolute right-3 pointer-events-none transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        aria-hidden="true"
      />
    </div>
  )
}
