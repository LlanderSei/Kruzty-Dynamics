import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { notifyServiceConfigChanged } from './serviceConfig'
import { addLog } from '../accounts/discordAuth'

const IMAGE_CACHE_KEY = 'kd_asset_cache'
const IMAGE_LINKS_KEY = 'kd_presence_image_links'
const IMAGE_SETTINGS_KEY = 'kd_app_settings'

interface CachedImage {
  hash: string
  sourceType: 'app_icon' | 'media_art'
  sourceKey: string
  remoteUrl: string
  uploadedAt: number
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || 'null')
    return (value ?? fallback) as T
  } catch {
    return fallback
  }
}

function decodeImage(dataUrl: string): { base64: string; bytes: Uint8Array } | null {
  const match = /^data:image\/[\w.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) return null
  const binary = atob(match[1])
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  return { base64: match[1], bytes }
}

async function hashImage(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function uploadDetectedImage(
  dataUrl: string,
  sourceType: CachedImage['sourceType'],
  sourceKey: string
): Promise<void> {
  const image = decodeImage(dataUrl)
  if (!image || !sourceKey) return

  const hash = await hashImage(image.bytes)
  const cache = readJson<CachedImage[]>(IMAGE_CACHE_KEY, [])
  const cachedUrl = cache.find(entry => entry.hash === hash)?.remoteUrl
  if (cachedUrl) {
    addLog('info', `Image cache HIT: source=${sourceKey} type=${sourceType} hash=${hash.slice(0, 12)} url=${cachedUrl}`)
    saveLink(sourceKey, cachedUrl)
    return
  }
  addLog('info', `Image cache MISS: source=${sourceKey} type=${sourceType} hash=${hash.slice(0, 12)}; uploading to ImgBB`)

  const requestId = `detected-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const settings = readJson<{ customImgbbKey?: string }>(IMAGE_SETTINGS_KEY, {})
  const unlisten = await listen<{ requestId: string; progress: number }>('imgbb-upload-progress', event => {
    if (event.payload.requestId === requestId) {
      window.dispatchEvent(new CustomEvent('detected-image-upload-progress', {
        detail: { sourceKey, progress: event.payload.progress },
      }))
    }
  })

  try {
    addLog('info', `ImgBB upload started: source=${sourceKey} type=${sourceType} imageBytes=${image.bytes.byteLength} requestId=${requestId}`)
    const remoteUrl = await invoke<string>('upload_app_icon', {
      imageBase64: image.base64,
      imageName: `${sourceKey.replace(/[^a-zA-Z0-9_-]/g, '-')}.png`,
      apiKey: settings.customImgbbKey || null,
      requestId,
    })
    const nextCache = cache.filter(entry => entry.hash !== hash)
    nextCache.push({ hash, sourceType, sourceKey, remoteUrl, uploadedAt: Date.now() })
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(nextCache))
    saveLink(sourceKey, remoteUrl)
    addLog('info', `ImgBB upload successful: source=${sourceKey} type=${sourceType} cached=true url=${remoteUrl}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `ImgBB upload failed: source=${sourceKey} type=${sourceType} error=${message}`)
    throw error
  } finally {
    unlisten()
    window.dispatchEvent(new CustomEvent('detected-image-upload-progress', {
      detail: { sourceKey, progress: null },
    }))
  }
}

function saveLink(sourceKey: string, remoteUrl: string) {
  const links = readJson<Record<string, string>>(IMAGE_LINKS_KEY, {})
  if (links[sourceKey] === remoteUrl) return
  links[sourceKey] = remoteUrl
  localStorage.setItem(IMAGE_LINKS_KEY, JSON.stringify(links))
  notifyServiceConfigChanged()
}
