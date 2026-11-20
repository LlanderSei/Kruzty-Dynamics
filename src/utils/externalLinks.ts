export function openExternalUrl(url: string) {
  if (typeof window !== 'undefined') {
    const bridge = (
      window as unknown as {
        AndroidNativeBridge?: { openExternalUrl?: (url: string) => void }
      }
    ).AndroidNativeBridge
    if (bridge?.openExternalUrl) {
      bridge.openExternalUrl(url)
      return
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
