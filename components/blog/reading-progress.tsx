'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollableHeight = documentHeight - windowHeight
      const scrolled = scrollTop / scrollableHeight
      setProgress(Math.min(100, Math.max(0, scrolled * 100)))
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress() // Initial calculation

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
      <div
        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}








