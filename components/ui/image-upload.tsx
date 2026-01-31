'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  Link2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface ImageUploadProps {
  /** Current image URL value */
  value?: string
  /** Callback when image URL changes */
  onChange: (url: string) => void
  /** Label for the upload field */
  label?: string
  /** Help text below label */
  description?: string
  /** ImageKit folder path */
  folder?: string
  /** ImageKit tags */
  tags?: string[]
  /** Maximum file size in MB (default: 10) */
  maxSizeMB?: number
  /** Accepted file types (default: image/*) */
  accept?: string
  /** Aspect ratio for preview (e.g., "16/9", "1/1") */
  aspectRatio?: string
  /** Preview height (default: 256px) */
  previewHeight?: number
  /** Show URL input option */
  showUrlInput?: boolean
  /** Required field */
  required?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Custom className */
  className?: string
  /** Callback on upload success */
  onUploadSuccess?: (result: {
    url: string
    fileId: string
    width?: number
    height?: number
  }) => void
  /** Callback on upload error */
  onUploadError?: (error: Error) => void
  /** Allow drag and drop */
  allowDragDrop?: boolean
}

export function ImageUpload({
  value,
  onChange,
  label = 'Image',
  description,
  folder = 'heldeelife',
  tags = [],
  maxSizeMB = 10,
  accept = 'image/*',
  aspectRatio,
  previewHeight = 256,
  showUrlInput = true,
  required = false,
  disabled = false,
  className,
  onUploadSuccess,
  onUploadError,
  allowDragDrop = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when value changes externally
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const validateFileMemo = useCallback(
    (file: File): string | null => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return 'Invalid file type. Only images are allowed.'
      }

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        return `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }

      return null
    },
    [maxSizeMB]
  )

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate file
      const validationError = validateFileMemo(file)
      if (validationError) {
        toast.error(validationError)
        setError(validationError)
        if (onUploadError) {
          onUploadError(new Error(validationError))
        }
        return
      }

      setError(null)
      setUploading(true)
      setUploadProgress(0)

      try {
        // Create preview URL for immediate feedback
        const previewUrl = URL.createObjectURL(file)
        setPreview(previewUrl)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        if (tags.length > 0) {
          formData.append('tags', tags.join(','))
        }

        // Simulate progress (ImageKit doesn't provide real progress, so we simulate)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        const response = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        if (data.success) {
          // Clean up preview URL
          URL.revokeObjectURL(previewUrl)

          setPreview(data.url)
          onChange(data.url)
          toast.success('Image uploaded successfully!')

          if (onUploadSuccess) {
            onUploadSuccess({
              url: data.url,
              fileId: data.fileId,
              width: data.width,
              height: data.height,
            })
          }
        } else {
          throw new Error(data.error || 'Upload failed')
        }
      } catch (error: any) {
        console.error('Upload error:', error)
        const errorMessage = error.message || 'Failed to upload image'
        toast.error(errorMessage)
        setError(errorMessage)

        // Reset preview on error
        setPreview(value || null)

        if (onUploadError) {
          onUploadError(error)
        }
      } finally {
        setUploading(false)
        setUploadProgress(0)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [
      folder,
      tags,
      onChange,
      value,
      onUploadSuccess,
      onUploadError,
      validateFileMemo,
    ]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

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

      if (disabled || uploading) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        uploadFile(file)
      }
    },
    [disabled, uploading, uploadFile]
  )

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim()
    onChange(url)
    if (url) {
      setPreview(url)
      setError(null)
    } else {
      setPreview(null)
    }
  }

  const handleReplace = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div>
          <Label htmlFor="image-upload">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {preview ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div
              className={cn(
                'relative w-full bg-muted overflow-hidden',
                aspectRatio ? `aspect-[${aspectRatio}]` : ''
              )}
              style={
                !aspectRatio ? { height: `${previewHeight}px` } : undefined
              }
            >
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                    <p className="text-white text-sm">Uploading...</p>
                    {uploadProgress > 0 && (
                      <div className="w-48 mx-auto">
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReplace}
                disabled={uploading || disabled}
                className="shadow-md"
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading || disabled}
                className="shadow-md"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25',
            disabled && 'opacity-50 cursor-not-allowed',
            uploading && 'opacity-50'
          )}
          onDragEnter={allowDragDrop ? handleDrag : undefined}
          onDragLeave={allowDragDrop ? handleDrag : undefined}
          onDragOver={allowDragDrop ? handleDrag : undefined}
          onDrop={allowDragDrop ? handleDrop : undefined}
        >
          <div className="p-8 text-center space-y-4">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading image...</p>
                  <div className="w-full max-w-xs mx-auto">
                    <Progress value={uploadProgress} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complete
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-muted p-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {allowDragDrop
                      ? 'Drag and drop an image here, or click to upload'
                      : 'Click to upload an image'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP, GIF up to {maxSizeMB}MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                  className="mx-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="image-upload"
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {showUrlInput && (
        <div className="space-y-2">
          <Label htmlFor="image-url-input" className="text-sm">
            Or enter image URL
          </Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="image-url-input"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={value || ''}
              onChange={handleUrlChange}
              disabled={disabled || uploading}
              className="pl-9"
            />
          </div>
          {value && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span>URL set</span>
            </div>
          )}
        </div>
      )}

      {preview && !uploading && (
        <div className="text-xs text-muted-foreground break-all">
          <strong>URL:</strong> {preview}
        </div>
      )}
    </div>
  )
}
