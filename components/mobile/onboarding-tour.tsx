'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ShoppingBag, Search, Heart, User, ArrowRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to HeldeeLife! 👋',
    description:
      "Your one-stop shop for authentic Ayurvedic products. Let's take a quick tour!",
    icon: <ShoppingBag className="h-8 w-8 text-orange-600" />,
  },
  {
    id: 'search',
    title: 'Smart Search 🔍',
    description:
      "Search by product name, symptoms, or health concerns. We'll help you find exactly what you need!",
    icon: <Search className="h-8 w-8 text-orange-600" />,
    target: 'a[href="/search"]',
    position: 'bottom',
  },
  {
    id: 'wishlist',
    title: 'Save for Later ❤️',
    description:
      'Tap the heart icon to save products to your wishlist. Access them anytime from your profile!',
    icon: <Heart className="h-8 w-8 text-orange-600" />,
    position: 'bottom',
  },
  {
    id: 'profile',
    title: 'Your Profile 👤',
    description:
      'Track orders, manage addresses, and view your wishlist. Everything in one place!',
    icon: <User className="h-8 w-8 text-orange-600" />,
    target: 'a[href="/profile"], button:has-text("Profile")',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: "You're All Set! 🎉",
    description:
      'Start exploring our collection of authentic Ayurvedic products. Happy shopping!',
    icon: <ShoppingBag className="h-8 w-8 text-orange-600" />,
  },
]

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem('heldeelife-onboarding-completed')
    if (!hasCompleted) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('heldeelife-onboarding-completed', 'true')
    setIsOpen(false)
  }

  const currentStepData = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl">
              {currentStepData.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-orange-50 rounded-full">
              {currentStepData.icon}
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-gray-600 text-lg leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-gray-500">
              Step {currentStep + 1} of {tourSteps.length}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {currentStep === tourSteps.length - 1 ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Skip Link */}
          {currentStep < tourSteps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              Skip tour
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

