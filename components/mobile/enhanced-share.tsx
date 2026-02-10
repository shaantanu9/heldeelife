'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from './bottom-sheet'

interface EnhancedShareProps {
  title: string
  text?: string
  url: string
  className?: string
  variant?: 'button' | 'icon'
}

export function EnhancedShare({
  title,
  text,
  url,
  className,
  variant = 'icon',
}: EnhancedShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareData = {
    title,
    text: text || title,
    url,
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setIsOpen(false)
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      setIsOpen(true)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => {
      setCopied(false)
      setIsOpen(false)
    }, 2000)
  }

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(text || title)
    let shareUrl = ''

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      setIsOpen(false)
    }
  }

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNativeShare}
          className={className}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Share"
        >
          <div className="space-y-4 py-4">
            {/* Native Share Button */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                onClick={handleNativeShare}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share via...
              </Button>
            )}

            {/* Social Media Options */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="h-8 w-8 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  MessageCircle
                </span>
              </button>
              <button
                onClick={() => handleSocialShare('facebook')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Facebook className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Facebook
                </span>
              </button>
              <button
                onClick={() => handleSocialShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
              >
                <Twitter className="h-8 w-8 text-sky-600" />
                <span className="text-sm font-medium text-gray-700">
                  Twitter
                </span>
              </button>
            </div>

            {/* Copy Link */}
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </BottomSheet>
      </>
    )
  }

  return (
    <Button variant="outline" onClick={handleNativeShare} className={className}>
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  )
}









