'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

interface Video {
  id: string
  title: string
  url: string
  thumbnail?: string
  duration?: string
  type: 'testimonial' | 'demo' | 'reel'
}

interface ProductVideosProps {
  productId: string
  productName: string
}

// Mock videos - In production, fetch from database or API
const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Customer Testimonial - Real Results',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/api/placeholder/400/300',
    duration: '2:30',
    type: 'testimonial',
  },
  {
    id: '2',
    title: 'Product Demo - How to Use',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/api/placeholder/400/300',
    duration: '1:45',
    type: 'demo',
  },
  {
    id: '3',
    title: 'Quick Reel - Before & After',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/api/placeholder/400/300',
    duration: '0:30',
    type: 'reel',
  },
]

export function ProductVideos({ productId, productName }: ProductVideosProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [videos] = useState<Video[]>([]) // TODO: Fetch from API when video support is added

  if (videos.length === 0) {
    return null
  }

  const currentVideo = videos[currentIndex]

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length)
  }

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Watch & Learn</h2>
        <p className="text-gray-600">
          See {productName} in action through customer testimonials and product
          demos
        </p>
      </div>

      {/* Main Video Player */}
      <Card className="border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            <iframe
              src={currentVideo.url}
              title={currentVideo.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1">
              {currentVideo.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className="text-xs">
                {currentVideo.type}
              </Badge>
              {currentVideo.duration && (
                <span className="text-xs">{currentVideo.duration}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Thumbnails Carousel */}
      {videos.length > 1 && (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {videos.map((video, index) => (
              <Card
                key={video.id}
                className={`flex-shrink-0 w-48 cursor-pointer border-2 transition-all ${
                  index === currentIndex
                    ? 'border-orange-500 shadow-lg'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                    {video.thumbnail && (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover opacity-50"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2">
                      {video.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {videos.length > 3 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                onClick={prevVideo}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                onClick={nextVideo}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
