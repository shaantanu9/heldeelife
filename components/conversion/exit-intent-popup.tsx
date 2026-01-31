'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Gift, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ExitIntentPopupProps {
  discountCode?: string
  discountPercentage?: number
}

export function ExitIntentPopup({
  discountCode = 'WELCOME10',
  discountPercentage = 10,
}: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Check if already shown in this session
    const shown = sessionStorage.getItem('exit-intent-shown')
    if (shown === 'true') {
      setHasShown(true)
      return
    }

    // Detect mouse leaving viewport (exit intent)
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is moving upward (toward address bar)
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true)
        setHasShown(true)
        sessionStorage.setItem('exit-intent-shown', 'true')
      }
    }

    // Also detect on mobile (scroll up quickly)
    let lastScrollTop = 0
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (
        lastScrollTop > 0 &&
        scrollTop < lastScrollTop &&
        scrollTop < 100 &&
        !hasShown
      ) {
        setIsOpen(true)
        setHasShown(true)
        sessionStorage.setItem('exit-intent-shown', 'true')
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasShown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }

    setIsSubmitting(true)
    try {
      // Save email and discount code
      localStorage.setItem('heldeelife-discount-email', email)
      localStorage.setItem('heldeelife-discount-code', discountCode)

      // Here you would typically send to your API
      // await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })

      toast.success(`Discount code applied!`, {
        description: `Use code ${discountCode} at checkout`,
      })

      setIsOpen(false)
      setEmail('')
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Wait! Don&apos;t miss out! 🎁
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <Gift className="h-16 w-16 mx-auto text-orange-600 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Get {discountPercentage}% OFF your first order!
            </p>
            <p className="text-sm text-gray-600">
              Enter your email to receive your exclusive discount code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Applying...' : `Get ${discountPercentage}% OFF`}
            </Button>
          </form>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            No thanks, I&apos;ll pay full price
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}









