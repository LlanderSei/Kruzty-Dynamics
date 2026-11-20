import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-3.5 py-2 gap-2 rounded-xl font-medium',
    lg: 'text-base px-5 py-2.5 gap-2.5 rounded-xl font-semibold',
  }[size]

  let variantStyle: React.CSSProperties = {}
  let baseClasses = 'inline-flex items-center justify-center transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]'

  switch (variant) {
    case 'primary':
      variantStyle = {
        backgroundColor: 'var(--color-accent)',
        color: '#ffffff',
      }
      baseClasses += ' shadow-sm hover:brightness-110 active:brightness-95'
      break
    case 'secondary':
      variantStyle = {
        backgroundColor: 'var(--color-bg-elevated)',
        color: 'var(--color-text-base)',
      }
      baseClasses += ' hover:brightness-110'
      break
    case 'outline':
      variantStyle = {
        backgroundColor: 'transparent',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-base)',
      }
      baseClasses += ' border hover:bg-white/5'
      break
    case 'ghost':
      variantStyle = {
        backgroundColor: 'transparent',
        color: 'var(--color-text-base)',
      }
      baseClasses += ' hover:bg-white/5 active:bg-white/10'
      break
    case 'danger':
      variantStyle = {
        backgroundColor: '#ef4444',
        color: '#ffffff',
      }
      baseClasses += ' hover:bg-red-600 active:bg-red-700'
      break
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  )
}
