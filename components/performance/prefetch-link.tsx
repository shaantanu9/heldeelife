'use client'

import Link, { LinkProps } from 'next/link'
import { prefetchResource } from '@/lib/utils/performance'
import { useCallback } from 'react'

interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  prefetch?: boolean
}

/**
 * Enhanced Link component with automatic prefetching on hover
 * Improves navigation performance by prefetching pages before user clicks
 */
export function PrefetchLink({
  children,
  className,
  prefetch = true,
  href,
  ...props
}: PrefetchLinkProps) {
  const handleMouseEnter = useCallback(() => {
    if (prefetch && typeof href === 'string') {
      prefetchResource(href)
    }
  }, [href, prefetch])

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  )
}









