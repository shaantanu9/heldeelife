'use client'

import { useState, useEffect } from 'react'
import { formatDateDisplay, formatDateTimeDisplay } from '@/lib/utils/date'

/**
 * Client-only date formatter to prevent hydration mismatches
 * Only renders date after component mounts on client
 */
export function ClientDate({
  date,
  format = 'DD/MM/YYYY',
  className,
}: {
  date: string | number | Date
  format?: string
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [formatted, setFormatted] = useState('')

  useEffect(() => {
    setMounted(true)
    setFormatted(formatDateDisplay(date, format))
  }, [date, format])

  if (!mounted) {
    return <span className={className}>--</span>
  }

  return <span className={className}>{formatted}</span>
}

/**
 * Client-only date-time formatter
 */
export function ClientDateTime({
  date,
  format = 'DD/MM/YYYY HH:mm',
  className,
}: {
  date: string | number | Date
  format?: string
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [formatted, setFormatted] = useState('')

  useEffect(() => {
    setMounted(true)
    setFormatted(formatDateTimeDisplay(date, format))
  }, [date, format])

  if (!mounted) {
    return <span className={className}>--</span>
  }

  return <span className={className}>{formatted}</span>
}









