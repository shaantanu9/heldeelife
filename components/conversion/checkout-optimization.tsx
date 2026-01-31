'use client'

import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Lock,
  Truck,
  Shield,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckoutProgressProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function CheckoutProgress({
  currentStep,
  totalSteps,
  steps,
}: CheckoutProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full space-y-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 text-xs',
              index + 1 <= currentStep
                ? 'text-orange-600 font-semibold'
                : 'text-gray-400'
            )}
          >
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                index + 1 < currentStep
                  ? 'fill-green-500 text-green-500'
                  : index + 1 === currentStep
                    ? 'fill-orange-500 text-orange-500'
                    : 'text-gray-300'
              )}
            />
            <span className="hidden sm:inline">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TrustBadgesProps {
  className?: string
}

export function CheckoutTrustBadges({ className }: TrustBadgesProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-4 py-4 border-t border-b bg-gradient-to-r from-slate-50 to-orange-50/30',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
        <Lock className="h-4 w-4 text-green-600" />
        <span>256-bit SSL Encrypted</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
        <Truck className="h-4 w-4 text-blue-600" />
        <span>Free Shipping on Orders ₹500+</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
        <Shield className="h-4 w-4 text-orange-600" />
        <span>30-Day Easy Returns</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
        <CreditCard className="h-4 w-4 text-purple-600" />
        <span>100% Secure Payments</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>100% Authentic Products</span>
      </div>
    </div>
  )
}

interface GuestCheckoutOptionProps {
  onGuestCheckout: () => void
  onSignIn: () => void
  className?: string
}

export function GuestCheckoutOption({
  onGuestCheckout,
  onSignIn,
  className,
}: GuestCheckoutOptionProps) {
  return (
    <div
      className={cn(
        'p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Checkout as Guest
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            No account needed! Complete your purchase quickly without signing
            in.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onGuestCheckout}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline"
            >
              Continue as Guest
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={onSignIn}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
            >
              Sign In for Faster Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FreeShippingProgressProps {
  currentTotal: number
  threshold: number
  className?: string
}

export function FreeShippingProgress({
  currentTotal,
  threshold,
  className,
}: FreeShippingProgressProps) {
  if (currentTotal >= threshold) {
    return (
      <div
        className={cn(
          'p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <span className="font-bold text-base">
              🎉 You qualify for FREE shipping!
            </span>
            <p className="text-xs text-green-600 mt-0.5">
              Your order will be delivered at no extra cost
            </p>
          </div>
        </div>
      </div>
    )
  }

  const remaining = threshold - currentTotal
  const progress = (currentTotal / threshold) * 100

  return (
    <div
      className={cn(
        'p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            You&apos;re almost there!
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Add{' '}
            <span className="font-bold text-orange-600">
              ₹{remaining.toFixed(2)}
            </span>{' '}
            more for free shipping
          </p>
        </div>
        <Badge
          variant="secondary"
          className="text-xs bg-orange-100 text-orange-700 font-semibold"
        >
          {Math.round(progress)}%
        </Badge>
      </div>
      <Progress
        value={progress}
        className="h-2.5 bg-orange-100"
      />
      <p className="text-xs text-gray-500 text-center">
        💡 Tip: Add one more item to save on shipping!
      </p>
    </div>
  )
}

