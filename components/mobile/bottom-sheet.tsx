'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: BottomSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'fixed bottom-0 left-0 right-0 top-auto translate-y-0 rounded-t-2xl rounded-b-none max-h-[90vh] overflow-y-auto p-0 md:hidden',
          className
        )}
        hideCloseButton
      >
        {/* Handle Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 safe-area-inset-bottom">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

