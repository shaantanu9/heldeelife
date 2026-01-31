'use client'

import { useEffect } from 'react'
import { ShoppingBag, Search, Heart, User } from 'lucide-react'

export function AppShortcuts() {
  useEffect(() => {
    // Register app shortcuts for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // This will be handled by the service worker
      // Shortcuts are defined in manifest.json
    }
  }, [])

  // This component doesn't render anything
  // It's used to register shortcuts programmatically if needed
  return null
}









