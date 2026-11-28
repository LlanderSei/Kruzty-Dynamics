import React, { useEffect, useRef } from 'react'
import { Activity, Users, Settings } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'

export type NavTab = 'service' | 'accounts' | 'settings'

interface NavigationFooterProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

export const NavigationFooter: React.FC<NavigationFooterProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation()
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = footerRef.current
    if (!element) return
    const updateFooterHeight = () => {
      document.documentElement.style.setProperty(
        '--kd-footer-height',
        `${element.getBoundingClientRect().height}px`,
      )
    }
    updateFooterHeight()
    const observer = new ResizeObserver(updateFooterHeight)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const tabs = [
    {
      id: 'service' as NavTab,
      label: t.nav.service,
      icon: Activity,
    },
    {
      id: 'accounts' as NavTab,
      label: t.nav.accounts,
      icon: Users,
    },
    {
      id: 'settings' as NavTab,
      label: t.nav.settings,
      icon: Settings,
    },
  ]

  return (
    <footer
      ref={footerRef}
      className="shrink-0 z-30 w-full border-t backdrop-blur-lg select-none transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-95"
              style={{
                backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <Icon
                className="w-5 h-5 transition-transform duration-150"
                style={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span
                className="text-[11px] mt-1 font-medium tracking-tight"
                style={{
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </footer>
  )
}
