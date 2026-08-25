'use client'

import { useEffect } from 'react'

export function PWAProvider() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('PWA service worker registration failed:', error)
      })
  }, [])

  return null
}
