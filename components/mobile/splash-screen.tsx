'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Minimum display time for branding
    const minDisplayTime = 1500 // 1.5 seconds
    const startTime = Date.now()

    // Wait for page to be fully loaded
    const handleLoad = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDisplayTime - elapsed)

      setTimeout(() => {
        setIsVisible(false)
        setTimeout(onComplete, 300) // Fade out animation
      }, remaining)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-orange-50 via-white to-orange-50/40 flex items-center justify-center animate-fade-out">
      <div className="text-center space-y-6">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <h1 className="text-4xl font-light tracking-wider text-gray-900">
            heldeelife
          </h1>
          <p className="text-sm text-gray-600">Ayurveda & Modern Medicine</p>
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      </div>
    </div>
  )
}









