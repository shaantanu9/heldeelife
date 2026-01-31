'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from './splash-screen'

export function AppClientWrapper({ children }: { children: React.ReactNode }) {
  // Start with false to match server render (prevents hydration mismatch)
  const [showSplash, setShowSplash] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted (client-side only)
    setIsMounted(true)
    
    // Check if this is first load (only on client)
    try {
      const hasVisited = sessionStorage.getItem('heldeelife-has-visited')
      if (!hasVisited) {
        // First visit - show splash
        setShowSplash(true)
        setIsFirstLoad(true)
        sessionStorage.setItem('heldeelife-has-visited', 'true')
      }
    } catch (error) {
      // sessionStorage might not be available (e.g., in private mode)
      console.error('Error accessing sessionStorage:', error)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  // Don't render splash until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <>
      {showSplash && isFirstLoad && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <div
        className={
          showSplash
            ? 'opacity-0'
            : 'opacity-100 transition-opacity duration-300'
        }
      >
        {children}
      </div>
    </>
  )
}

