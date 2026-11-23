import { useAppSettings } from '../features/settings/useAppSettings'
import { LOCALE_IDS, TRANSLATIONS, type LocaleId, type SupportedLanguage, type TranslationDictionary } from './translations'

function resolveLanguage(settingLang: string): LocaleId {
  const selectedLocale = LOCALE_IDS[settingLang as Exclude<SupportedLanguage, 'System Default'>]
  if (settingLang !== 'System Default' && selectedLocale) return selectedLocale

  try {
    const nav = typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : ''
    if (nav.startsWith('ja')) return 'ja_JP'
    if (nav.startsWith('ar')) return 'ar_SA'
    if (nav.startsWith('my') || nav.startsWith('mm')) return 'my_MM'
    if (nav.startsWith('hr')) return 'hr_HR'
    if (nav.startsWith('he')) return 'he_IL'
    if (nav.startsWith('hi')) return 'hi_IN'
    if (nav.startsWith('it')) return 'it_IT'
    if (nav.startsWith('fa')) return 'fa_IR'
    if (nav.startsWith('pl')) return 'pl_PL'
    if (nav.startsWith('pt')) return 'pt_BR'
    if (nav.startsWith('th')) return 'th_TH'
    if (nav.startsWith('vi')) return 'vi_VN'
    if (nav.startsWith('es')) return 'es_ES'
    if (nav.startsWith('fil') || nav.startsWith('tl')) return 'fil_PH'
    if (nav.startsWith('de')) return 'de_DE'
    if (nav.startsWith('fr')) return 'fr_FR'
    if (nav.startsWith('zh')) return nav.includes('tw') || nav.includes('hant') || nav.includes('hk') ? 'zh_TW' : 'zh_CN'
    if (nav.startsWith('id')) return 'id_ID'
    if (nav.startsWith('ko')) return 'ko_KR'
    if (nav.startsWith('nl')) return 'nl_NL'
    if (nav.startsWith('ru')) return 'ru_RU'
    if (nav.startsWith('tr')) return 'tr_TR'
  } catch {
    // Browser locale is unavailable during non-browser rendering.
  }

  return 'en_US'
}

export function useTranslation() {
  const { settings } = useAppSettings()
  const activeLang = resolveLanguage(settings.language)
  const dict: TranslationDictionary = TRANSLATIONS[activeLang] || TRANSLATIONS.en_US

  return {
    t: dict,
    currentLanguage: settings.language,
    resolvedLanguage: activeLang,
  }
}
