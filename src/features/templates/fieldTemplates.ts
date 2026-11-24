import type { AppFieldTemplates, MediaFieldTemplates, NotificationProjectionTemplates } from '../../types'

export const DEFAULT_APP_FIELDS: AppFieldTemplates = {
  title: '{{AppActivityType == "Playing" ?? AppName : AppPlatformType}}',
  details: '{{AppActivityType == "Playing" ?? AppDetails : AppName}}',
  state: '{{AppActivityType == "Playing" ?? AppState : AppDetails}}',
  smallText: '{{AppSmallText}}',
  smallImage: '{{AppSmallUrl}}',
  bigText: '{{AppActivityType == "Playing" ?? AppName : AppState}}',
  bigImage: '{{AppImageUrl}}',
}

export const DEFAULT_MEDIA_FIELDS: MediaFieldTemplates = {
  title: '{{AppName}}',
  details: '{{MediaTitle ?? AppName}}',
  state: '{{MediaArtist ?? MediaDescription}}',
  smallText: '{{PlaybackState}}',
  smallImage: '{{HasDetectablePlaybackState ?? PlaybackStateImageUrl : AppImageUrl}}',
  bigText: '{{MediaAlbum ?? MediaDescription}}',
  bigImage: '{{HasMediaImage ?? MediaImageUrl : AppImageUrl}}',
  customButtonsEnabled: false,
  button1Label: '',
  button1Url: '',
  button2Label: '',
  button2Url: '',
}

export const DEFAULT_NOTIFICATION_FIELDS: NotificationProjectionTemplates = {
  appTitle: '{{AppActivityType == "Playing" ?? getFieldCfgStr("AppTitle") : getFieldCfgStr("AppDetails")}}',
  appSubtitle: '{{AppActivityType == "Playing" ?? joinNonBlank(getFieldCfgStr("AppDetails"), getFieldCfgStr("AppState")) : joinNonBlank(getFieldCfgStr("AppState"), getFieldCfgStr("AppBigText"))}}',
  mediaTitle: '{{getFieldCfgStr("MediaDetails")}}',
  mediaSubtitle: '{{joinNonBlank(getFieldCfgStr("MediaState"), getFieldCfgStr("MediaBigText"))}}',
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

export function normalizeAppFieldTemplates(value: unknown): AppFieldTemplates {
  const saved = asRecord(value)
  const legacyHasHeader = typeof saved.header === 'string'
  const hadLegacyAppDefaults = legacyHasHeader
    && saved.title === '{{AppActivityType == "Playing" ?? "" : AppName}}'
    && saved.line1 === '{{AppDetails}}'
    && saved.line2 === '{{AppState}}'
  const appBigText = saved.bigText === '{{AppName}}'
    ? DEFAULT_APP_FIELDS.bigText ?? ''
    : stringValue(saved.bigText, DEFAULT_APP_FIELDS.bigText ?? '')
  return {
    smallText: stringValue(saved.smallText, DEFAULT_APP_FIELDS.smallText ?? ''),
    smallImage: stringValue(saved.smallImage, DEFAULT_APP_FIELDS.smallImage ?? ''),
    bigImage: stringValue(saved.bigImage, DEFAULT_APP_FIELDS.bigImage ?? ''),
    title: stringValue(
      legacyHasHeader ? saved.header : saved.title === '{{AppName}}' ? DEFAULT_APP_FIELDS.title : saved.title,
      DEFAULT_APP_FIELDS.title,
    ),
    details: stringValue(saved.details, legacyHasHeader
      ? hadLegacyAppDefaults ? DEFAULT_APP_FIELDS.details : stringValue(saved.title, DEFAULT_APP_FIELDS.details)
      : stringValue(saved.line1, DEFAULT_APP_FIELDS.details)),
    state: stringValue(saved.state, hadLegacyAppDefaults
      ? DEFAULT_APP_FIELDS.state
      : stringValue(saved.line2, DEFAULT_APP_FIELDS.state)),
    bigText: appBigText,
  }
}

export function normalizeMediaFieldTemplates(value: unknown): MediaFieldTemplates {
  const saved = asRecord(value)
  const legacyHasHeader = typeof saved.header === 'string'
  const migratedBigText = typeof saved.line2 === 'string' && saved.line2.length > 0
    ? saved.line2
    : stringValue(saved.bigText, DEFAULT_MEDIA_FIELDS.bigText ?? '')
  return {
    smallText: stringValue(saved.smallText, DEFAULT_MEDIA_FIELDS.smallText ?? ''),
    smallImage: stringValue(saved.smallImage, DEFAULT_MEDIA_FIELDS.smallImage ?? ''),
    bigImage: stringValue(saved.bigImage, DEFAULT_MEDIA_FIELDS.bigImage ?? ''),
    customButtonsEnabled: Boolean(saved.customButtonsEnabled ?? DEFAULT_MEDIA_FIELDS.customButtonsEnabled),
    button1Label: stringValue(saved.button1Label, DEFAULT_MEDIA_FIELDS.button1Label ?? ''),
    button1Url: stringValue(saved.button1Url, DEFAULT_MEDIA_FIELDS.button1Url ?? ''),
    button2Label: stringValue(saved.button2Label, DEFAULT_MEDIA_FIELDS.button2Label ?? ''),
    button2Url: stringValue(saved.button2Url, DEFAULT_MEDIA_FIELDS.button2Url ?? ''),
    title: stringValue(legacyHasHeader ? saved.header : saved.title, DEFAULT_MEDIA_FIELDS.title),
    details: stringValue(saved.details, legacyHasHeader
      ? stringValue(saved.title, DEFAULT_MEDIA_FIELDS.details)
      : stringValue(saved.line1, DEFAULT_MEDIA_FIELDS.details)),
    state: stringValue(saved.state, stringValue(saved.line1, DEFAULT_MEDIA_FIELDS.state)),
    bigText: legacyHasHeader && !saved.line2 && !saved.bigText
      ? DEFAULT_MEDIA_FIELDS.bigText ?? ''
      : migratedBigText,
  }
}

export function normalizeNotificationProjectionTemplates(value: unknown): NotificationProjectionTemplates {
  const saved = asRecord(value)
  return {
    appTitle: stringValue(saved.appTitle, DEFAULT_NOTIFICATION_FIELDS.appTitle),
    appSubtitle: stringValue(saved.appSubtitle, DEFAULT_NOTIFICATION_FIELDS.appSubtitle),
    mediaTitle: stringValue(saved.mediaTitle, DEFAULT_NOTIFICATION_FIELDS.mediaTitle),
    mediaSubtitle: stringValue(saved.mediaSubtitle, DEFAULT_NOTIFICATION_FIELDS.mediaSubtitle),
  }
}
