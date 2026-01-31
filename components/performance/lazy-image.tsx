'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { lazyLoadImage } from '@/lib/utils/performance'

interface LazyImageProps extends Omit<ImageProps, 'src'> {
  src: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

/**
 * Lazy-loaded Image component with Intersection Observer
 * Only loads images when they're about to enter the viewport
 */
export function LazyImage({
  src,
  alt,
  className,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current && !imageSrc) {
      lazyLoadImage(imgRef.current, src)
      setImageSrc(src)
    }
  }, [src, imageSrc])

  return (
    <div className={`relative ${className || ''}`}>
      {!isLoaded && placeholder === 'blur' && blurDataURL && (
        <Image
          src={blurDataURL}
          alt={alt}
          fill
          className="blur-sm"
          aria-hidden="true"
        />
      )}
      <Image
        ref={imgRef}
        src={imageSrc || src}
        alt={alt}
        className={className}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        {...props}
      />
    </div>
  )
}









