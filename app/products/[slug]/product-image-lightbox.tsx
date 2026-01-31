'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductImageLightboxProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onImageChange: (index: number) => void
  productName: string
}

// Helper function to check if a string is a valid URL
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

export function ProductImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onImageChange,
  productName,
}: ProductImageLightboxProps) {
  const [imageError, setImageError] = useState(false)

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
    onImageChange(newIndex)
    setImageError(false)
  }, [currentIndex, images.length, onImageChange])

  const handleNext = useCallback(() => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
    onImageChange(newIndex)
    setImageError(false)
  }, [currentIndex, images.length, onImageChange])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handlePrevious, handleNext, onClose])

  if (!isOpen) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Previous Button */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
          onClick={(e) => {
            e.stopPropagation()
            handlePrevious()
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Next Button */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          aria-label="Next image"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Main Image */}
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage && isValidImageUrl(currentImage) ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={currentImage}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
              priority
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-9xl opacity-50 text-white">
              {currentImage || '📦'}
            </span>
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onImageChange(index)
                  setImageError(false)
                }}
                className={cn(
                  'relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-orange-500 ring-2 ring-orange-300'
                    : 'border-white/30 hover:border-white/60'
                )}
                aria-label={`View image ${index + 1}`}
              >
                {image && isValidImageUrl(image) ? (
                  <Image
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-800">
                    <span className="text-xl opacity-50">{image || '📦'}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Hint */}
      <div className="absolute bottom-4 right-4 text-white/60 text-xs hidden md:block">
        Use arrow keys to navigate • ESC to close
      </div>
    </div>
  )
}
