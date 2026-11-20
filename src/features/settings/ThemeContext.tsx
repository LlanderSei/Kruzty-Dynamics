import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ThemeConfig } from '../../types'

interface ThemeContextType {
  theme: ThemeConfig
  setMode: (mode: 'light' | 'dark' | 'amoled') => void
  setAccentColor: (color: string) => void
  resetTheme: () => void
}

export const DEFAULT_ACCENT_COLOR = '#f97316' // Vibrant Orange

export const PRESET_ACCENT_COLORS = [
  { name: 'Orange (Default)', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
]

const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  customAccentColor: DEFAULT_ACCENT_COLOR,
}

const STORAGE_KEY = 'kd_theme_config'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }
  return null
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          mode: parsed.mode || 'dark',
          customAccentColor: parsed.customAccentColor || DEFAULT_ACCENT_COLOR,
        }
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_THEME
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      // Storage unavailable
    }

    const root = document.documentElement
    root.setAttribute('data-theme', theme.mode)

    const accent = theme.customAccentColor || DEFAULT_ACCENT_COLOR
    root.style.setProperty('--color-accent', accent)

    const rgb = hexToRgb(accent)
    if (rgb) {
      root.style.setProperty('--color-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`)
      root.style.setProperty('--color-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`)
    }

    // Adapt Android status bar icons (dark icons on light mode, light icons on dark/amoled mode)
    if (typeof window !== 'undefined') {
      const bridge = (window as unknown as { AndroidThemeBridge?: { setStatusBarTheme?: (mode: string) => void } }).AndroidThemeBridge
      if (bridge?.setStatusBarTheme) {
        try {
          bridge.setStatusBarTheme(theme.mode)
        } catch {
          // Native bridge call failed
        }
      }

      // Update HTML theme-color meta tag
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta')
        metaThemeColor.setAttribute('name', 'theme-color')
        document.head.appendChild(metaThemeColor)
      }
      metaThemeColor.setAttribute(
        'content',
        theme.mode === 'light' ? '#f8fafc' : theme.mode === 'amoled' ? '#000000' : '#0f172a'
      )
    }
  }, [theme])

  const setMode = (mode: 'light' | 'dark' | 'amoled') => {
    setTheme(prev => ({ ...prev, mode }))
  }

  const setAccentColor = (customAccentColor: string) => {
    setTheme(prev => ({ ...prev, customAccentColor }))
  }

  const resetTheme = () => {
    setTheme(DEFAULT_THEME)
  }

  return (
    <ThemeContext.Provider value={{ theme, setMode, setAccentColor, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
