import { useEffect } from 'react'

type BackHandler = () => boolean | void
const backHandlers: BackHandler[] = []

export function notifyBack(): boolean {
  if (backHandlers.length > 0) {
    const handler = backHandlers[backHandlers.length - 1]
    const handled = handler()
    return handled !== false
  }
  return false
}

export function registerBackHandler(handler: BackHandler) {
  backHandlers.push(handler)
  updateAndroidBridge()
  return () => {
    const idx = backHandlers.lastIndexOf(handler)
    if (idx !== -1) {
      backHandlers.splice(idx, 1)
    }
    updateAndroidBridge()
  }
}

function updateAndroidBridge() {
  if (typeof window !== 'undefined') {
    const bridge = (
      window as unknown as {
        AndroidNativeBridge?: { setCanGoBack?: (can: boolean) => void }
      }
    ).AndroidNativeBridge
    bridge?.setCanGoBack?.(backHandlers.length > 0)
  }
}

// Global listener for native androidBack custom event
if (typeof window !== 'undefined') {
  window.addEventListener('androidBack', e => {
    e.preventDefault()
    notifyBack()
  })
}

export function useBackHandler(handler: BackHandler, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return
    return registerBackHandler(handler)
  }, [handler, enabled])
}
