'use client'

import { Button } from '@/components/ui/button'
import { Share2, Twitter, Facebook, Linkedin, Link2, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareButtonsProps {
  url: string
  title: string
  description?: string
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareData = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    text: encodeURIComponent(description || title),
  }

  const handleShare = async (platform: string) => {
    const fullUrl = typeof window !== 'undefined' ? window.location.href : url

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${shareData.url}&text=${shareData.title}`,
          '_blank',
          'noopener,noreferrer'
        )
        break
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${shareData.url}`,
          '_blank',
          'noopener,noreferrer'
        )
        break
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${shareData.url}`,
          '_blank',
          'noopener,noreferrer'
        )
        break
      case 'copy':
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(fullUrl)
          setCopied(true)
          toast.success('Link copied to clipboard!')
          setTimeout(() => setCopied(false), 2000)
        }
        break
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: description || title,
              url: fullUrl,
            })
          } catch (error) {
            // User cancelled or error occurred
          }
        }
        break
    }
  }

  const hasNativeShare = typeof window !== 'undefined' && navigator.share

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-gray-900 mr-2">Share:</span>
      {hasNativeShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('native')}
          className="border-gray-300 hover:border-orange-500 hover:text-orange-600"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('twitter')}
        className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
      >
        <Twitter className="h-4 w-4 mr-2" />
        Twitter
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('facebook')}
        className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
      >
        <Facebook className="h-4 w-4 mr-2" />
        Facebook
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('linkedin')}
        className="border-gray-300 hover:border-blue-700 hover:text-blue-700"
      >
        <Linkedin className="h-4 w-4 mr-2" />
        LinkedIn
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('copy')}
        className="border-gray-300 hover:border-orange-500 hover:text-orange-600"
      >
        {copied ? (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-2" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  )
}
