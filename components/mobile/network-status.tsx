'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Show brief "back online" message
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  if (isOnline && !wasOffline) return null

  return (
    <div
      className={cn(
        'fixed top-16 left-0 right-0 z-50 px-4 py-3 transition-transform duration-300',
        isOnline && wasOffline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      )}
    >
      <div className="container mx-auto flex items-center gap-2 justify-center">
        {isOnline && wasOffline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">
              Back online! Your connection has been restored.
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              You&apos;re offline. Some features may be limited.
            </span>
          </>
        )}
      </div>
    </div>
  )
}









