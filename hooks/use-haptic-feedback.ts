'use client'

/**
 * Hook for haptic feedback on mobile devices
 * Provides tactile feedback for user interactions
 */
export function useHapticFeedback() {
  const trigger = (
    type:
      | 'light'
      | 'medium'
      | 'heavy'
      | 'success'
      | 'warning'
      | 'error' = 'light'
  ) => {
    // Check if device supports vibration API
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      const patterns: Record<string, number | number[]> = {
        light: 10, // Very short vibration
        medium: 20, // Medium vibration
        heavy: 30, // Strong vibration
        success: [10, 50, 10], // Success pattern
        warning: [20, 50, 20], // Warning pattern
        error: [30, 100, 30, 100, 30], // Error pattern
      }

      const pattern = patterns[type] || patterns.light
      navigator.vibrate(pattern)
    }
  }

  return { trigger }
}
