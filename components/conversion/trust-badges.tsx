'use client'

import { Shield, Truck, RotateCcw, Award, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBadge {
  icon: React.ReactNode
  text: string
  subtext?: string
}

const defaultBadges: TrustBadge[] = [
  {
    icon: <Shield className="h-5 w-5" />,
    text: '100% Authentic',
    subtext: 'Ayurvedic Products',
  },
  {
    icon: <Truck className="h-5 w-5" />,
    text: 'Free Shipping',
    subtext: 'On orders above Rs. 500',
  },
  {
    icon: <RotateCcw className="h-5 w-5" />,
    text: 'Easy Returns',
    subtext: '7-day return policy',
  },
  {
    icon: <Award className="h-5 w-5" />,
    text: 'Certified Quality',
    subtext: 'GMP Certified',
  },
  {
    icon: <Lock className="h-5 w-5" />,
    text: 'Secure Payment',
    subtext: 'SSL Encrypted',
  },
]

interface TrustBadgesProps {
  badges?: TrustBadge[]
  variant?: 'horizontal' | 'grid'
  className?: string
}

export function TrustBadges({
  badges = defaultBadges,
  variant = 'horizontal',
  className,
}: TrustBadgesProps) {
  if (variant === 'grid') {
    return (
      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4',
          className
        )}
      >
        {badges.map((badge, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="text-orange-600 mb-2">{badge.icon}</div>
            <p className="font-semibold text-sm text-gray-900 mb-1">
              {badge.text}
            </p>
            {badge.subtext && (
              <p className="text-xs text-gray-600">{badge.subtext}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-4 md:gap-6 py-4',
        className
      )}
    >
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="text-orange-600">{badge.icon}</div>
          <div>
            <p className="font-semibold text-gray-900">{badge.text}</p>
            {badge.subtext && (
              <p className="text-xs text-gray-600">{badge.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}









