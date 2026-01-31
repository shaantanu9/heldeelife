'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPulling = useRef(false)

  const PULL_THRESHOLD = 80
  const MAX_PULL = 120

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || window.scrollY > 0) {
        isPulling.current = false
        return
      }

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        e.preventDefault()
        const pullDistance = Math.min(distance * 0.5, MAX_PULL)
        setPullDistance(pullDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }

      isPulling.current = false
    }

    container.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing, onRefresh])

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 z-50"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 60)}px)`,
          opacity:
            pullDistance > 0 ? Math.min(1, pullDistance / PULL_THRESHOLD) : 0,
        }}
      >
        <div className="bg-white rounded-full p-3 shadow-lg">
          {isRefreshing ? (
            <Loader2 className="h-6 w-6 text-orange-600 animate-spin" />
          ) : (
            <div
              className="h-6 w-6 border-2 border-orange-600 border-t-transparent rounded-full transition-transform"
              style={{
                transform: `rotate(${Math.min(180, (pullDistance / PULL_THRESHOLD) * 180)}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.max(0, pullDistance)}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}









