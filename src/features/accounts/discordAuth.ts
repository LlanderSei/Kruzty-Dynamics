import type { DiscordAccount } from '../../types'

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
  const token = rawToken.trim().replace(/^"(.*)"$/, '$1')

  if (!token) {
    return { success: false, error: 'Token cannot be empty' }
  }

  const authHeader = token.startsWith('Bot ') ? token : token

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
  } catch (err: any) {
    // If running in development with CORS / offline restriction, provide informative message or fallback
    return {
      success: false,
      error: err?.message ? `Network request failed: ${err.message}` : 'Failed to reach Discord API',
    }
  }
}
