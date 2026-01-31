'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Facebook,
  Twitter,
  MessageCircle,
  Link2,
  Mail,
  Share2,
  Check,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ProductSocialShareProps {
  productName: string
  productUrl: string
  productImage?: string
  productDescription?: string
}

export function ProductSocialShare({
  productName,
  productUrl,
  productImage,
  productDescription,
}: ProductSocialShareProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [hasNativeShare, setHasNativeShare] = useState(false)

  // Check for native share API only on client side
  useEffect(() => {
    setHasNativeShare(
      typeof navigator !== 'undefined' && 'share' in navigator
    )
  }, [])

  const shareText = `Check out ${productName} on HeldeeLife!`
  const encodedUrl = encodeURIComponent(productUrl)
  const encodedText = encodeURIComponent(shareText)
  const encodedDescription = encodeURIComponent(productDescription || shareText)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedText}&body=${encodedDescription}%20${encodedUrl}`,
  }

  const handleShare = async (platform: keyof typeof shareLinks) => {
    if (platform === 'email') {
      window.location.href = shareLinks.email
      return
    }

    const width = 600
    const height = 400
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    window.open(
      shareLinks[platform],
      'share',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0`
    )
  }

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = productUrl
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setLinkCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (error) {
        toast.error('Failed to copy link')
      } finally {
        document.body.removeChild(textArea)
      }
      return
    }

    try {
      await navigator.clipboard.writeText(productUrl)
      setLinkCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (hasNativeShare && typeof navigator !== 'undefined') {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share')
        }
      }
    } else {
      // Fallback to dropdown if native share not available
      handleCopyLink()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Native Share Button (Mobile) */}
      {hasNativeShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="md:hidden"
          aria-label="Share product"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      )}

      {/* Desktop Share Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex"
            aria-label="Share product"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Share on Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            <Twitter className="h-4 w-4 mr-2 text-blue-400" />
            Share on Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            Share on WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')}>
            <Mail className="h-4 w-4 mr-2 text-gray-600" />
            Email Product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            {linkCopied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Link Copied!
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Share Buttons (Desktop) */}
      <div className="hidden lg:flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => handleShare('facebook')}
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-blue-50 hover:text-blue-400"
          onClick={() => handleShare('twitter')}
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-green-50 hover:text-green-600"
          onClick={() => handleShare('whatsapp')}
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-gray-50"
          onClick={handleCopyLink}
          aria-label="Copy link"
        >
          {linkCopied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}



