const LATEST_RELEASE_API = 'https://api.github.com/repos/LlanderSei/Kruzty-Dynamics/releases/latest'
const LATEST_RELEASE_PAGE = 'https://github.com/LlanderSei/Kruzty-Dynamics/releases/latest'

interface ParsedVersion {
  core: number[]
  prerelease: string[] | null
}

interface GitHubRelease {
  tag_name?: string
  html_url?: string
}

function parseVersion(version: string): ParsedVersion | null {
  const normalized = version.trim().replace(/^v/i, '').split('+', 1)[0]
  const prereleaseSeparator = normalized.indexOf('-')
  const coreText = prereleaseSeparator === -1 ? normalized : normalized.slice(0, prereleaseSeparator)
  const prereleaseText = prereleaseSeparator === -1 ? undefined : normalized.slice(prereleaseSeparator + 1)
  const coreParts = coreText.split('.')
  if (coreParts.length < 2 || coreParts.length > 3 || coreParts.some(part => !/^\d+$/.test(part))) return null

  return {
    core: [Number(coreParts[0]), Number(coreParts[1]), Number(coreParts[2] || 0)],
    prerelease: prereleaseText ? prereleaseText.split('.') : null,
  }
}

function comparePrerelease(left: string[], right: string[]): number {
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index++) {
    const leftPart = left[index]
    const rightPart = right[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1
    if (leftPart === rightPart) continue

    const leftNumeric = /^\d+$/.test(leftPart)
    const rightNumeric = /^\d+$/.test(rightPart)
    if (leftNumeric && rightNumeric) return Number(leftPart) < Number(rightPart) ? -1 : 1
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    return leftPart < rightPart ? -1 : 1
  }
  return 0
}

function isNewerVersion(candidate: string, current: string): boolean {
  const candidateVersion = parseVersion(candidate)
  const currentVersion = parseVersion(current)
  if (!candidateVersion || !currentVersion) throw new Error('Could not compare app versions.')

  for (let index = 0; index < candidateVersion.core.length; index++) {
    if (candidateVersion.core[index] !== currentVersion.core[index]) {
      return candidateVersion.core[index] > currentVersion.core[index]
    }
  }

  if (!candidateVersion.prerelease) return Boolean(currentVersion.prerelease)
  if (!currentVersion.prerelease) return false
  return comparePrerelease(candidateVersion.prerelease, currentVersion.prerelease) > 0
}

export async function findNewerRelease(currentVersion: string): Promise<{ version: string; url: string } | null> {
  const response = await fetch(LATEST_RELEASE_API, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Could not fetch latest release.')

  const release = await response.json() as GitHubRelease
  if (!release.tag_name) throw new Error('Latest release has no version tag.')
  if (!isNewerVersion(release.tag_name, currentVersion)) return null

  return {
    version: release.tag_name,
    url: release.html_url || LATEST_RELEASE_PAGE,
  }
}
