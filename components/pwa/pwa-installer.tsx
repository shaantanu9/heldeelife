'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isMobile) return

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
    }

    setDeferredPrompt(null)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:right-auto md:w-auto z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 safe-area-inset-bottom">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Download className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Install App</p>
            <p className="text-xs text-gray-600">
              Add to home screen for better experience
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Install
          </Button>
          <Button
            onClick={() => setShowInstallPrompt(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}









