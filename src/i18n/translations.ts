import enUS from './localization/en_US.json'
import filPH from './localization/fil_PH.json'
import esES from './localization/es_ES.json'
import jaJP from './localization/ja_JP.json'
import deDE from './localization/de_DE.json'
import frFR from './localization/fr_FR.json'
import zhCN from './localization/zh_CN.json'
import idID from './localization/id_ID.json'
import koKR from './localization/ko_KR.json'
import nlNL from './localization/nl_NL.json'
import ruRU from './localization/ru_RU.json'
import trTR from './localization/tr_TR.json'
import enShakespearean from './localization/en_Shakespearean.json'
import enAlienZorblaxian from './localization/xx_Alien_Zorblaxian.json'
import enPirate from './localization/xx_Pirate.json'
import enAlienUnknown from './localization/xx_Alien_Unknown.json'
import enUwU from './localization/xx_UwU.json'
import arSA from './localization/ar_SA.json'
import myMM from './localization/my_MM.json'
import hrHR from './localization/hr_HR.json'
import heIL from './localization/he_IL.json'
import hiIN from './localization/hi_IN.json'
import itIT from './localization/it_IT.json'
import faIR from './localization/fa_IR.json'
import plPL from './localization/pl_PL.json'
import ptBR from './localization/pt_BR.json'
import zhTW from './localization/zh_TW.json'
import viVN from './localization/vi_VN.json'
import thTH from './localization/th_TH.json'

export type LocaleId = 'en_US' | 'en_Shakespearean' | 'xx_Alien_Zorblaxian' | 'xx_Pirate' | 'xx_Alien_Unknown' | 'xx_UwU' | 'ar_SA' | 'my_MM' | 'hr_HR' | 'he_IL' | 'hi_IN' | 'it_IT' | 'fa_IR' | 'pl_PL' | 'pt_BR' | 'zh_TW' | 'vi_VN' | 'th_TH' | 'fil_PH' | 'es_ES' | 'ja_JP' | 'de_DE' | 'fr_FR' | 'zh_CN' | 'id_ID' | 'ko_KR' | 'nl_NL' | 'ru_RU' | 'tr_TR'
export type SupportedLanguage =
  | 'System Default'
  | 'English (US)'
  | 'English (Shakespearean)'
  | 'Alien (Zorblaxian)'
  | 'Pirate'
  | 'Alien (Unknown)'
  | 'UwU'
  | '\u0627\u0644\u0639\u0631\u0628\u064a\u0629'
  | '\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c'
  | 'Hrvatski'
  | '\u05e2\u05d1\u05e8\u05d9\u05ea'
  | '\u0939\u093f\u0928\u094d\u0926\u0940'
  | 'Italiano'
  | '\u0641\u0627\u0631\u0633\u06cc'
  | 'Polski'
  | 'Portugu\u00eas Brasileiro'
  | '\u7e41\u9ad4\u4e2d\u6587'
  | 'Ti\u1ebfng Vi\u1ec7t'
  | '\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22'
  | 'Filipino / Tagalog'
  | 'Espa\u00f1ol'
  | '\u65e5\u672c\u8a9e (Japanese)'
  | 'Deutsch'
  | 'Fran\u00e7ais'
  | 'Chinese (\u7b80\u4f53\u4e2d\u6587)'
  | 'Bahasa Indonesia'
  | '\ud55c\uad6d\uc5b4'
  | 'Nederlands'
  | '\u0420\u0443\u0441\u0441\u043a\u0438\u0439'
  | 'T\u00fcrk\u00e7e'
export type TranslationDictionary = typeof enUS

export const LOCALE_IDS: Record<Exclude<SupportedLanguage, 'System Default'>, LocaleId> = {
  'English (US)': 'en_US',
  'English (Shakespearean)': 'en_Shakespearean',
  'Alien (Zorblaxian)': 'xx_Alien_Zorblaxian',
  'Pirate': 'xx_Pirate',
  'Alien (Unknown)': 'xx_Alien_Unknown',
  'UwU': 'xx_UwU',
  '\u0627\u0644\u0639\u0631\u0628\u064a\u0629': 'ar_SA',
  '\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c': 'my_MM',
  'Hrvatski': 'hr_HR',
  '\u05e2\u05d1\u05e8\u05d9\u05ea': 'he_IL',
  '\u0939\u093f\u0928\u094d\u0926\u0940': 'hi_IN',
  'Italiano': 'it_IT',
  '\u0641\u0627\u0631\u0633\u06cc': 'fa_IR',
  'Polski': 'pl_PL',
  'Portugu\u00eas Brasileiro': 'pt_BR',
  '\u7e41\u9ad4\u4e2d\u6587': 'zh_TW',
  'Ti\u1ebfng Vi\u1ec7t': 'vi_VN',
  '\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22': 'th_TH',
  'Filipino / Tagalog': 'fil_PH',
  'Espa\u00f1ol': 'es_ES',
  '\u65e5\u672c\u8a9e (Japanese)': 'ja_JP',
  'Deutsch': 'de_DE',
  'Fran\u00e7ais': 'fr_FR',
  'Chinese (\u7b80\u4f53\u4e2d\u6587)': 'zh_CN',
  'Bahasa Indonesia': 'id_ID',
  '\ud55c\uad6d\uc5b4': 'ko_KR',
  'Nederlands': 'nl_NL',
  '\u0420\u0443\u0441\u0441\u043a\u0438\u0439': 'ru_RU',
  'T\u00fcrk\u00e7e': 'tr_TR',
}

function withEnglishFallback<T>(base: T, localized: unknown): T {
  if (typeof base === 'string') return (typeof localized === 'string' ? localized : base) as T
  if (!base || typeof base !== 'object' || Array.isArray(base)) return base

  const localizedObject = localized && typeof localized === 'object' && !Array.isArray(localized)
    ? localized as Record<string, unknown>
    : {}
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(base)) {
    result[key] = withEnglishFallback(value, localizedObject[key])
  }
  return result as T
}

export const TRANSLATIONS: Record<LocaleId, TranslationDictionary> = {
  en_US: enUS,
  en_Shakespearean: withEnglishFallback(enUS, enShakespearean),
  xx_Alien_Zorblaxian: withEnglishFallback(enUS, enAlienZorblaxian),
  xx_Pirate: withEnglishFallback(enUS, enPirate),
  xx_Alien_Unknown: withEnglishFallback(enUS, enAlienUnknown),
  xx_UwU: withEnglishFallback(enUS, enUwU),
  ar_SA: withEnglishFallback(enUS, arSA),
  my_MM: withEnglishFallback(enUS, myMM),
  hr_HR: withEnglishFallback(enUS, hrHR),
  he_IL: withEnglishFallback(enUS, heIL),
  hi_IN: withEnglishFallback(enUS, hiIN),
  it_IT: withEnglishFallback(enUS, itIT),
  fa_IR: withEnglishFallback(enUS, faIR),
  pl_PL: withEnglishFallback(enUS, plPL),
  pt_BR: withEnglishFallback(enUS, ptBR),
  zh_TW: withEnglishFallback(enUS, zhTW),
  vi_VN: withEnglishFallback(enUS, viVN),
  th_TH: withEnglishFallback(enUS, thTH),
  fil_PH: withEnglishFallback(enUS, filPH),
  es_ES: withEnglishFallback(enUS, esES),
  ja_JP: withEnglishFallback(enUS, jaJP),
  de_DE: withEnglishFallback(enUS, deDE),
  fr_FR: withEnglishFallback(enUS, frFR),
  zh_CN: withEnglishFallback(enUS, zhCN),
  id_ID: withEnglishFallback(enUS, idID),
  ko_KR: withEnglishFallback(enUS, koKR),
  nl_NL: withEnglishFallback(enUS, nlNL),
  ru_RU: withEnglishFallback(enUS, ruRU),
  tr_TR: withEnglishFallback(enUS, trTR),
}
