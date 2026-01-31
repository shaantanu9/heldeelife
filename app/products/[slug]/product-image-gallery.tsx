'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductImageLightbox } from './product-image-lightbox'
import { Button } from '@/components/ui/button'

interface ProductImageGalleryProps {
  mainImage: string | null
  images: (string | null)[]
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

export function ProductImageGallery({
  mainImage,
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(mainImage)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0)
  const [hoveredThumbnail, setHoveredThumbnail] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  // Filter out null/empty images and combine main image with additional images
  const allImages = [
    mainImage,
    ...(images || []).filter((img) => img && img !== mainImage),
  ].filter(Boolean) as string[]

  // Ensure selected image is always valid
  useEffect(() => {
    if (!allImages.includes(selectedImage || '')) {
      setSelectedImage(allImages[0] || null)
    }
  }, [selectedImage, allImages])

  const currentImage = selectedImage || allImages[0] || null
  const showZoom = isValidImageUrl(currentImage)

  // Handle mouse move for Amazon-style zoom effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !showZoom) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate percentage position for zoom background positioning
    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100

    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, xPercent))
    const clampedY = Math.max(0, Math.min(100, yPercent))

    setMousePosition({ x, y })
    setZoomPosition({ x: clampedX, y: clampedY })
  }

  const handleMouseEnter = () => {
    if (showZoom) {
      setIsZooming(true)
    }
  }

  const handleMouseLeave = () => {
    setIsZooming(false)
  }

  // Touch handlers for mobile zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageRef.current || !showZoom) return
    const touch = e.touches[0]
    const rect = imageRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100

    setMousePosition({ x, y })
    setZoomPosition({
      x: Math.max(0, Math.min(100, xPercent)),
      y: Math.max(0, Math.min(100, yPercent)),
    })
    setIsZooming(true)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageRef.current || !showZoom) return
    const touch = e.touches[0]
    const rect = imageRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100

    setMousePosition({ x, y })
    setZoomPosition({
      x: Math.max(0, Math.min(100, xPercent)),
      y: Math.max(0, Math.min(100, yPercent)),
    })
  }

  const handleTouchEnd = () => {
    setIsZooming(false)
  }

  // Thumbnail navigation
  const visibleThumbnails = 5 // Number of thumbnails visible at once
  const canScrollLeft = thumbnailScrollIndex > 0
  const canScrollRight =
    thumbnailScrollIndex < allImages.length - visibleThumbnails

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailContainerRef.current) return

    const container = thumbnailContainerRef.current
    const thumbnailWidth = 112 // w-28 = 7rem = 112px
    const gap = 12 // gap-3 = 0.75rem = 12px
    const scrollAmount = thumbnailWidth + gap

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      setThumbnailScrollIndex(Math.max(0, thumbnailScrollIndex - 1))
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setThumbnailScrollIndex(
        Math.min(allImages.length - visibleThumbnails, thumbnailScrollIndex + 1)
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Image with Amazon-style Zoom */}
      <div
        ref={imageRef}
        className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 group cursor-zoom-in touch-none"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          const index = allImages.findIndex((img) => img === currentImage)
          if (index !== -1) {
            setLightboxIndex(index)
            setLightboxOpen(true)
          }
        }}
      >
        {(hoveredThumbnail || currentImage) && isValidImageUrl(hoveredThumbnail || currentImage) ? (
          <>
            {/* Base Image (current selected) */}
            <div
              className="relative w-full h-full transition-opacity duration-300"
              style={{
                opacity: hoveredThumbnail && hoveredThumbnail !== currentImage ? 0.3 : 1,
              }}
            >
              <div
                className="relative w-full h-full transition-transform duration-300"
                style={{
                  transform: isZooming && !hoveredThumbnail
                    ? `scale(2.5) translate(${
                        (50 - zoomPosition.x) * 0.3
                      }%, ${(50 - zoomPosition.y) * 0.3}%)`
                    : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              >
                <Image
                  src={currentImage}
                  alt={productName}
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
            </div>
            
            {/* Hover Preview Overlay - Shows when hovering over thumbnail */}
            {hoveredThumbnail && hoveredThumbnail !== currentImage && (
              <div 
                className="absolute inset-0 z-20 transition-opacity duration-300"
                style={{
                  opacity: 1,
                }}
              >
                <Image
                  src={hoveredThumbnail}
                  alt={`${productName} preview`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}

            {/* Zoom overlay indicator (shows zoom area) */}
            {isZooming && showZoom && (
              <div className="absolute inset-0 pointer-events-none z-10 border-2 border-orange-500/50 hidden md:block" />
            )}

            {/* Mobile Zoom Overlay - Full screen zoom on touch */}
            {isZooming && showZoom && (
              <div
                className="absolute inset-0 bg-white z-30 md:hidden"
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: '300%',
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-9xl opacity-50">{currentImage || '📦'}</span>
          </div>
        )}

        {/* Zoom Indicator (mobile hint) */}
        {showZoom && !isZooming && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none md:hidden animate-pulse">
            👆 Touch to zoom
          </div>
        )}
      </div>

      {/* Thumbnail Gallery - Slider with Navigation */}
      {allImages.length > 1 && (
        <div className="relative mt-4">
          {/* Left Navigation Button */}
          {allImages.length > visibleThumbnails && canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-lg border-gray-300 hover:bg-gray-50 hover:border-orange-500 transition-all"
              onClick={() => scrollThumbnails('left')}
              aria-label="Scroll thumbnails left"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </Button>
          )}

          {/* Thumbnail Container */}
          <div
            ref={thumbnailContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory px-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onMouseLeave={() => setHoveredThumbnail(null)}
          >
            {allImages.map((image, index) => {
              const isSelected = image === currentImage
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSelectedImage(image)
                    setHoveredThumbnail(null)
                    // Auto-scroll to selected thumbnail if needed
                    if (thumbnailContainerRef.current) {
                      const thumbnailWidth = 112
                      const gap = 12
                      const scrollPosition =
                        index * (thumbnailWidth + gap) -
                        (thumbnailWidth + gap) * 2
                      thumbnailContainerRef.current.scrollTo({
                        left: Math.max(0, scrollPosition),
                        behavior: 'smooth',
                      })
                    }
                  }}
                  onMouseEnter={() => {
                    if (image && isValidImageUrl(image)) {
                      setHoveredThumbnail(image)
                    }
                  }}
                  onMouseLeave={() => {
                    // Don't clear on mouse leave - let the container handle it
                    // This allows smooth transition when moving between thumbnails
                  }}
                  className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-white rounded-lg border-2 overflow-hidden transition-all duration-200 snap-start group cursor-pointer ${
                    isSelected
                      ? 'border-orange-600 ring-2 ring-orange-200 shadow-lg scale-105'
                      : 'border-gray-300 hover:border-orange-400 hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
                  aria-label={`View ${productName} image ${index + 1}`}
                  aria-pressed={isSelected}
                >
                  {image && isValidImageUrl(image) ? (
                    <>
                      <Image
                        src={image}
                        alt={`${productName} thumbnail ${index + 1}`}
                        fill
                        className="object-cover transition-opacity duration-200 group-hover:opacity-90"
                        unoptimized
                      />
                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-600/10 pointer-events-none" />
                      )}
                      {/* Selected border indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-orange-600 rounded-lg pointer-events-none" />
                      )}
                      {/* Hover indicator */}
                      {hoveredThumbnail === image && !isSelected && (
                        <div className="absolute inset-0 bg-orange-400/20 pointer-events-none transition-opacity duration-200" />
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <span className="text-2xl opacity-50">
                        {image || '📦'}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Navigation Button */}
          {allImages.length > visibleThumbnails && canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-lg border-gray-300 hover:bg-gray-50 hover:border-orange-500 transition-all"
              onClick={() => scrollThumbnails('right')}
              aria-label="Scroll thumbnails right"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </Button>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <ProductImageLightbox
        images={allImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onImageChange={(index) => setLightboxIndex(index)}
        productName={productName}
      />
    </div>
  )
}
