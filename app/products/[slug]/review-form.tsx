'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  ImageIcon,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  productId: string
  productName: string
  orderId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Poor', color: 'text-red-600' },
  2: { label: 'Fair', color: 'text-orange-600' },
  3: { label: 'Good', color: 'text-yellow-600' },
  4: { label: 'Very Good', color: 'text-green-600' },
  5: { label: 'Excellent', color: 'text-green-700' },
}

export function ReviewForm({
  productId,
  productName,
  orderId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState(false)

  const totalSteps = 3

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      if (reviewImages.length + files.length > 5) {
        toast.error('Maximum 5 images allowed per review')
        return
      }

      setUploadingImages(true)
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          if (!file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Only images are allowed.')
          }

          const maxSize = 10 * 1024 * 1024 // 10MB
          if (file.size > maxSize) {
            throw new Error(`File size exceeds 10MB limit.`)
          }

          const formData = new FormData()
          formData.append('file', file)
          formData.append('folder', 'reviews')

          const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          })

          const data = await response.json()
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Upload failed')
          }

          return data.url
        })

        const uploadedUrls = await Promise.all(uploadPromises)
        setReviewImages((prev) => [...prev, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`)
      } catch (error: any) {
        console.error('Error uploading images:', error)
        toast.error(error.message || 'Failed to upload images')
      } finally {
        setUploadingImages(false)
      }
    },
    [reviewImages.length]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files)
      }
    },
    [handleImageUpload]
  )

  const removeImage = useCallback((index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!session?.user) {
        toast.error('Please sign in to submit a review')
        return
      }

      if (rating === 0) {
        toast.error('Please select a rating')
        setCurrentStep(1)
        return
      }

      if (!comment.trim() && !title.trim()) {
        toast.error('Please provide a title or comment')
        setCurrentStep(2)
        return
      }

      setSubmitting(true)
      try {
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: productId,
            order_id: orderId,
            rating,
            title: title.trim() || null,
            comment: comment.trim() || null,
            review_images: reviewImages.length > 0 ? reviewImages : null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit review')
        }

        setSubmitted(true)
        toast.success('Review submitted successfully!')

        // Reset form after delay
        setTimeout(() => {
          setRating(0)
          setTitle('')
          setComment('')
          setPros('')
          setCons('')
          setReviewImages([])
          setCurrentStep(1)
          setSubmitted(false)
          onSuccess?.()
        }, 2000)
      } catch (error: any) {
        console.error('Error submitting review:', error)
        toast.error(error.message || 'Failed to submit review')
      } finally {
        setSubmitting(false)
      }
    },
    [
      session,
      rating,
      title,
      comment,
      reviewImages,
      productId,
      orderId,
      onSuccess,
    ]
  )

  if (!session?.user) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-600 mb-6">
            Please sign in to write a review and help other customers
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <a href="/auth/signin">Sign In to Continue</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You for Your Review!
          </h3>
          <p className="text-gray-600 mb-4">
            Your review has been submitted and will be visible after approval.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>
              Your feedback helps other customers make better decisions
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-orange-200 shadow-xl bg-white">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Write a Review
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Share your experience with {productName}
            </p>
          </div>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                        ? 'bg-orange-600 text-white ring-4 ring-orange-200'
                        : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {step < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < totalSteps && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-all',
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span
            className={cn(
              currentStep >= 1 ? 'font-semibold text-orange-600' : ''
            )}
          >
            Rating
          </span>
          <span
            className={cn(
              currentStep >= 2 ? 'font-semibold text-orange-600' : ''
            )}
          >
            Details
          </span>
          <span
            className={cn(
              currentStep >= 3 ? 'font-semibold text-orange-600' : ''
            )}
          >
            Photos
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Rating */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-4 block">
                  How would you rate this product?{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star)
                          setTimeout(() => setCurrentStep(2), 300)
                        }}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none transform transition-all hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={cn(
                            'h-12 w-12 transition-all',
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                              : 'text-gray-300'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {(rating > 0 || hoveredRating > 0) && (
                    <div
                      className={cn(
                        'text-lg font-semibold transition-all',
                        RATING_LABELS[hoveredRating || rating]?.color ||
                          'text-gray-600'
                      )}
                    >
                      {RATING_LABELS[hoveredRating || rating]?.label}
                    </div>
                  )}
                  {rating === 0 && (
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      Click on a star to rate this product. Your rating helps
                      other customers make informed decisions.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={rating === 0}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label
                  htmlFor="title"
                  className="text-base font-semibold mb-2 block"
                >
                  Review Title{' '}
                  <span className="text-gray-500 font-normal text-sm">
                    (Optional but recommended)
                  </span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 'Great product, highly recommend!'"
                  maxLength={100}
                  className="text-base"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/100 characters
                </p>
              </div>

              <div>
                <Label
                  htmlFor="comment"
                  className="text-base font-semibold mb-2 block"
                >
                  Your Review <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your detailed experience with this product. What did you like? What could be improved?"
                  rows={6}
                  maxLength={2000}
                  className="text-base resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {comment.length}/2000 characters
                  </p>
                  {comment.length < 50 && comment.length > 0 && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Add more details for a helpful review
                    </p>
                  )}
                </div>
              </div>

              {/* Pros and Cons - Optional but helpful */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="pros"
                    className="text-base font-semibold mb-2 block"
                  >
                    What you liked{' '}
                    <span className="text-gray-500 font-normal text-sm">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id="pros"
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    placeholder="What did you like about this product?"
                    rows={3}
                    maxLength={500}
                    className="text-base resize-none"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="cons"
                    className="text-base font-semibold mb-2 block"
                  >
                    What could be improved{' '}
                    <span className="text-gray-500 font-normal text-sm">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id="cons"
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    placeholder="Any suggestions for improvement?"
                    rows={3}
                    maxLength={500}
                    className="text-base resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!comment.trim()}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Add Photos{' '}
                  <span className="text-gray-500 font-normal text-sm">
                    (Optional - Up to 5 images)
                  </span>
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Photos help other customers see the product in real use
                </p>

                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-all',
                    dragActive
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/30',
                    uploadingImages && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e.target.files)}
                    disabled={uploadingImages || reviewImages.length >= 5}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    {uploadingImages ? (
                      <>
                        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
                        <p className="text-gray-600">Uploading images...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium mb-1">
                            Drag & drop images here, or{' '}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-orange-600 hover:text-orange-700 font-semibold underline"
                            >
                              browse
                            </button>
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB each
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Image Preview Grid */}
                {reviewImages.length > 0 && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {reviewImages.map((url, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm"
                        >
                          <Image
                            src={url}
                            alt={`Review image ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Image {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    {reviewImages.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4"
                        disabled={uploadingImages}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add More Images ({reviewImages.length}/5)
                      </Button>
                    )}
                  </div>
                )}

                {/* Review Guidelines */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Tips for a Great Review
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Be honest and specific about your experience</li>
                    <li>Include details about quality, size, and usage</li>
                    <li>Photos of the product in use are very helpful</li>
                    <li>Focus on facts and your personal experience</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting || rating === 0 || !comment.trim()}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 min-w-[140px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
