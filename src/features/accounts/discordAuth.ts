import type { DiscordAccount } from '../../types'

interface LogEntry { level: 'info' | 'warn' | 'error'; msg: string; ts: number }
const LOG_STORE: LogEntry[] = []
const MAX_LOGS = 200
const SECRET_PATTERN = /(access_token|refresh_token|authorization|bearer|token|secret|client_secret)(["'\s:=]+)([^\s,"'&}]+)/gi

function redactSecrets(value: string): string {
  return value
    .replace(/\b(Bearer|Bot)\s+[A-Za-z0-9._-]{20,}/gi, '$1 [REDACTED]')
    .replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]')
    .replace(/([?&](?:key|api_key|apiKey|access_token|refresh_token)=)[^&#\s]+/gi, '$1[REDACTED]')
    .replace(SECRET_PATTERN, '$1$2[REDACTED]')
    .replace(/mfa\.[A-Za-z0-9_-]{20,}/g, '[REDACTED]')
}

export function addLog(level: LogEntry['level'], msg: string) {
  const entry = { level, msg: redactSecrets(msg), ts: Date.now() }
  LOG_STORE.push(entry)
  if (LOG_STORE.length > MAX_LOGS) LOG_STORE.shift()
  const tag = level === 'error' ? '[ERROR]' : level === 'warn' ? '[WARN]' : '[INFO]'
  const output = `[Dynamics] ${tag} ${entry.msg}`
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.info(output)
}
export function getLogs(): LogEntry[] {
  return [...LOG_STORE]
}

/**
 * Builds a Discord OAuth2 authorization URL (Implicit Flow).
 * After the user authorizes, Discord redirects to redirect_uri with
 * the access_token exposed in the URL fragment (#access_token=...).
 */
export function buildDiscordOAuthUrl(params: {
  clientId: string
  redirectUri: string
  scope?: string
}): string {
  const base = 'https://discord.com/api/oauth2/authorize'
  const searchParams = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'token',
    scope: params.scope ?? 'identify',
    prompt: 'consent',
  })
  return `${base}?${searchParams.toString()}`
}

/**
 * Extracts the access_token from a URL fragment/hash.
 * Returns null if no token is present.
 */
export function extractTokenFromHash(hash: string): string | null {
  if (!hash) return null
  const clean = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(clean)
  return params.get('access_token') || null
}

interface DiscordApiUser {
  id: string
  username: string
  discriminator: string
  global_name?: string
  avatar?: string
  bot?: boolean
}

export async function fetchDiscordUserProfile(rawToken: string): Promise<{
  success: boolean
  account?: DiscordAccount
  error?: string
}> {
  // URL-decode the token (OAuth2 fragment values may be percent-encoded)
  let decodedToken: string
  try {
    decodedToken = decodeURIComponent(rawToken.trim())
  } catch {
    decodedToken = rawToken.trim()
  }
  const token = decodedToken.replace(/^"(.*)"$/, '$1')

  if (!token) {
    return { success: false, error: 'Token cannot be empty' }
  }

  // OAuth2 access tokens require the "Bearer " prefix; Bot tokens start with "Bot "
  const authHeader = token.startsWith('Bot ') ? token : `Bearer ${token}`

  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: authHeader,
      },
    })

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: 'Invalid Discord Token (401 Unauthorized)' }
      }
      return { success: false, error: `Discord API Error: ${res.status} ${res.statusText}` }
    }

    const data: DiscordApiUser = await res.json()

    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.discriminator || '0') % 5}.png`

    const account: DiscordAccount = {
      id: data.id,
      username: data.username,
      displayName: data.global_name || data.username,
      avatarUrl,
      token,
      isActive: true,
    }

    return { success: true, account }
  } catch (err: unknown) {
    // If running in development with CORS / offline restriction, provide informative message or fallback
    return {
      success: false,
      error: err instanceof Error ? `Network request failed: ${err.message}` : 'Failed to reach Discord API',
    }
  }
}
