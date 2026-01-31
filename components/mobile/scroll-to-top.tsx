'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        'fixed bottom-20 md:bottom-6 right-4 z-40 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700 text-white h-12 w-12 md:h-14 md:w-14',
        'safe-area-inset-bottom'
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
    </Button>
  )
}









