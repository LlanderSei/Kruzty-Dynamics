import { useAppSettings } from '../features/settings/useAppSettings'
import { TRANSLATIONS, type SupportedLanguage, type TranslationDictionary } from './translations'

function resolveLanguage(settingLang: string): SupportedLanguage {
  if (settingLang && settingLang !== 'System Default') {
    if (settingLang in TRANSLATIONS) {
      return settingLang as SupportedLanguage
    }
  }

  // System Default: inspect navigator
  try {
    const nav = typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : ''
    if (nav.startsWith('ja')) return '日本語 (Japanese)'
    if (nav.startsWith('es')) return 'Español'
    if (nav.startsWith('fil') || nav.startsWith('tl')) return 'Filipino / Tagalog'
    if (nav.startsWith('de')) return 'Deutsch'
    if (nav.startsWith('fr')) return 'Français'
    if (nav.startsWith('zh')) return 'Chinese (简体中文)'
  } catch {}

  return 'English (US)'
}

export function useTranslation() {
  const { settings } = useAppSettings()
  const activeLang = resolveLanguage(settings.language)
  const dict: TranslationDictionary = TRANSLATIONS[activeLang] || TRANSLATIONS['English (US)']

  return {
    t: dict,
    currentLanguage: settings.language,
    resolvedLanguage: activeLang,
  }
}
