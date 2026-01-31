# ImageKit Complete Integration Guide for Next.js

A comprehensive, production-ready guide for integrating ImageKit image storage, optimization, and delivery in Next.js applications. This guide is based on real-world implementation from the HeldeeLife project.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Core Service Implementation](#core-service-implementation)
5. [API Routes](#api-routes)
6. [React Components & Hooks](#react-components--hooks)
7. [Next.js Configuration](#nextjs-configuration)
8. [Image Transformations](#image-transformations)
9. [Utility Functions](#utility-functions)
10. [Testing](#testing)
11. [Best Practices](#best-practices)
12. [Security Considerations](#security-considerations)
13. [Performance Optimization](#performance-optimization)
14. [Troubleshooting](#troubleshooting)
15. [Complete Examples](#complete-examples)

---

## Overview

ImageKit is a cloud-based image optimization and delivery service that provides:

- **Global CDN**: Fast image delivery worldwide
- **Automatic Optimization**: Image compression and format conversion
- **On-the-fly Transformations**: Resize, crop, filter, and more without storing multiple copies
- **Scalable Storage**: Cloud storage that grows with your app
- **Cost-Effective**: Pay only for what you use
- **Developer-Friendly**: Simple API and SDK

### Why ImageKit?

1. **Performance**: Automatic image optimization reduces load times
2. **Bandwidth Savings**: Serve optimized images based on device
3. **Storage Efficiency**: One image, multiple sizes via transformations
4. **Global CDN**: Fast delivery regardless of user location
5. **Developer Experience**: Simple integration with Next.js

---

## Prerequisites

- **Next.js 13+** (App Router recommended)
- **Node.js 18+** (20+ recommended)
- **TypeScript** (recommended)
- **ImageKit Account**: [Sign up here](https://imagekit.io)

---

## Installation & Setup

### 1. Install ImageKit Package

```bash
npm install imagekit
# or
yarn add imagekit
# or
pnpm add imagekit
```

### 2. Get ImageKit Credentials

1. Sign up at [https://imagekit.io](https://imagekit.io)
2. Go to **Dashboard** → **Developer Options**
3. Copy your credentials:
   - **Public Key**: Your public API key (safe to expose)
   - **Private Key**: Your private API key (keep secret!)
   - **URL Endpoint**: Your ImageKit URL (e.g., `https://ik.imagekit.io/your_imagekit_id`)

### 3. Environment Variables

Create or update your `.env.local` file:

```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

**Important**: 
- Never commit `.env.local` to version control
- Add to `.gitignore`:
  ```gitignore
  .env.local
  .env*.local
  ```

### 4. Verify Setup

Create a test script to verify your configuration:

```typescript
// scripts/test-imagekit.ts
import ImageKit from 'imagekit'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

async function testImageKit() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('Missing ImageKit environment variables')
  }

  const imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint: urlEndpoint.replace(/\/$/, ''), // Remove trailing slash
  })

  // Test authentication
  const authParams = imagekit.getAuthenticationParameters()
  console.log('✅ ImageKit configured successfully!')
  console.log('Token:', authParams.token.substring(0, 20) + '...')
}

testImageKit().catch(console.error)
```

Run the test:

```bash
npx tsx scripts/test-imagekit.ts
# or add to package.json:
# "test:imagekit": "tsx scripts/test-imagekit.ts"
```

---

## Core Service Implementation

Create the ImageKit service class that handles all image operations:

```typescript
// lib/imagekit-service.ts
import ImageKit from 'imagekit'

export interface ImageKitUploadResult {
  fileId: string
  name: string
  url: string
  thumbnailUrl?: string
  fileType: string
  fileSize?: number
  height?: number
  width?: number
}

export class ImageKitService {
  private static imagekit: InstanceType<typeof ImageKit>

  /**
   * Initialize ImageKit client (singleton pattern)
   */
  static initialize() {
    if (!this.imagekit) {
      const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

      if (!publicKey || !privateKey || !urlEndpoint) {
        throw new Error(
          'ImageKit credentials are missing. Please check your environment variables.'
        )
      }

      // Remove trailing slash from urlEndpoint if present
      const cleanUrlEndpoint = urlEndpoint.replace(/\/$/, '')

      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint: cleanUrlEndpoint,
      })
    }
    return this.imagekit
  }

  /**
   * Upload image buffer to ImageKit
   * @param imageBuffer - Image file as Buffer
   * @param filename - Name for the uploaded file
   * @param folder - Folder path in ImageKit (optional)
   * @param tags - Tags for organization (optional)
   * @returns Upload result with URL and file ID
   */
  static async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    folder: string = 'uploads',
    tags: string[] = []
  ): Promise<ImageKitUploadResult> {
    try {
      const imagekit = this.initialize()

      return new Promise((resolve, reject) => {
        imagekit.upload(
          {
            file: imageBuffer,
            fileName: filename,
            folder: folder,
            tags: tags.join(','),
            useUniqueFileName: true, // Prevents overwriting files with same name
          },
          (error: any, result: any) => {
            if (error) {
              reject(error)
            } else {
              resolve(result as ImageKitUploadResult)
            }
          }
        )
      })
    } catch (error) {
      console.error('Error uploading to ImageKit:', error)
      throw error
    }
  }

  /**
   * Upload image from URL to ImageKit
   * @param imageUrl - URL of the image to upload
   * @param filename - Name for the uploaded file
   * @param folder - Folder path in ImageKit (optional)
   * @param tags - Tags for organization (optional)
   * @returns Upload result with URL and file ID
   */
  static async uploadFromUrl(
    imageUrl: string,
    filename: string,
    folder: string = 'uploads',
    tags: string[] = []
  ): Promise<ImageKitUploadResult> {
    try {
      // Fetch the image from the URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer())

      // Upload to ImageKit
      return await this.uploadImage(imageBuffer, filename, folder, tags)
    } catch (error) {
      console.error('Error uploading from URL to ImageKit:', error)
      throw error
    }
  }

  /**
   * Delete image from ImageKit
   * @param fileId - ImageKit file ID
   * @returns Success status
   */
  static async deleteImage(fileId: string): Promise<boolean> {
    try {
      const imagekit = this.initialize()

      return new Promise((resolve, reject) => {
        imagekit.deleteFile(fileId, (error: any, result: any) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
      })
    } catch (error) {
      console.error('Error deleting image from ImageKit:', error)
      return false
    }
  }

  /**
   * Get image details from ImageKit
   * @param fileId - ImageKit file ID
   * @returns Image details or null if not found
   */
  static async getImageDetails(
    fileId: string
  ): Promise<ImageKitUploadResult | null> {
    try {
      const imagekit = this.initialize()

      return new Promise((resolve, reject) => {
        imagekit.getFileDetails(fileId, (error: any, result: any) => {
          if (error) {
            reject(error)
          } else {
            resolve(result as ImageKitUploadResult)
          }
        })
      })
    } catch (error) {
      console.error('Error getting image details:', error)
      return null
    }
  }

  /**
   * Generate ImageKit URL with transformations
   * @param fileId - ImageKit file ID or file path
   * @param transformations - Image transformation options
   * @returns Transformed image URL
   */
  static getImageUrl(
    fileId: string,
    transformations?: {
      width?: number
      height?: number
      quality?: number
      format?: string
      crop?: string
      focus?: string
    }
  ): string {
    const imagekit = this.initialize()

    return imagekit.url({
      src: fileId,
      transformation: transformations
        ? [
            {
              width: transformations.width?.toString(),
              height: transformations.height?.toString(),
              quality: transformations.quality?.toString(),
              format: transformations.format,
              crop: transformations.crop,
              focus: transformations.focus,
            },
          ]
        : undefined,
    })
  }

  /**
   * Generate thumbnail URL
   * @param fileId - ImageKit file ID
   * @param width - Thumbnail width (default: 200)
   * @param height - Thumbnail height (default: 200)
   * @returns Thumbnail URL
   */
  static getThumbnailUrl(
    fileId: string,
    width: number = 200,
    height: number = 200
  ): string {
    return this.getImageUrl(fileId, {
      width,
      height,
      quality: 80,
      format: 'auto',
      crop: 'maintain_ratio',
    })
  }
}
```

### Key Features

1. **Singleton Pattern**: Initializes ImageKit client once and reuses it
2. **Error Handling**: Comprehensive error handling with logging
3. **Type Safety**: Full TypeScript support with interfaces
4. **Flexible Upload**: Supports Buffer and URL uploads
5. **Transformations**: On-the-fly image transformations
6. **Organization**: Folder and tag support for better file management

---

## API Routes

### Upload API Route

Create a secure upload endpoint with authentication and validation:

```typescript
// app/api/images/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ImageKitService } from '@/lib/imagekit-service'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization check (optional - adjust based on your needs)
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // 3. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'
    const tags = (formData.get('tags') as string)?.split(',') || []

    // 4. Validate file exists
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 5. Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // 6. Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // 7. Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 8. Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${file.name}`

    // 9. Upload to ImageKit
    const result = await ImageKitService.uploadImage(
      buffer,
      filename,
      folder,
      tags
    )

    // 10. Return success response
    return NextResponse.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      width: result.width,
      height: result.height,
      fileSize: result.fileSize,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
```

### Delete API Route

```typescript
// app/api/images/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ImageKitService } from '@/lib/imagekit-service'

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get fileId from query params
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Delete from ImageKit
    const success = await ImageKitService.deleteImage(fileId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    )
  }
}
```

---

## React Components & Hooks

### ImageUpload Component

A complete, production-ready image upload component:

```typescript
// components/ui/image-upload.tsx
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
  value?: string
  onChange: (url: string) => void
  label?: string
  description?: string
  folder?: string
  tags?: string[]
  maxSizeMB?: number
  accept?: string
  aspectRatio?: string
  previewHeight?: number
  showUrlInput?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
  onUploadSuccess?: (result: {
    url: string
    fileId: string
    width?: number
    height?: number
  }) => void
  onUploadError?: (error: Error) => void
  allowDragDrop?: boolean
}

export function ImageUpload({
  value,
  onChange,
  label = 'Image',
  description,
  folder = 'uploads',
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

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) {
        return 'Invalid file type. Only images are allowed.'
      }

      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        return `File size exceeds ${maxSizeMB}MB limit.`
      }

      return null
    },
    [maxSizeMB]
  )

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
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
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setPreview(previewUrl)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        if (tags.length > 0) {
          formData.append('tags', tags.join(','))
        }

        // Simulate progress
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
        setPreview(value || null)

        if (onUploadError) {
          onUploadError(error)
        }
      } finally {
        setUploading(false)
        setUploadProgress(0)
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
      validateFile,
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
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || disabled}
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
        </div>
      )}
    </div>
  )
}
```

### useImageUpload Hook

A reusable hook for image uploads:

```typescript
// hooks/use-image-upload.ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface UseImageUploadOptions {
  folder?: string
  tags?: string[]
  maxSizeMB?: number
  onSuccess?: (result: {
    url: string
    fileId: string
    width?: number
    height?: number
  }) => void
  onError?: (error: Error) => void
}

export interface UseImageUploadReturn {
  imageUrl: string
  uploading: boolean
  uploadProgress: number
  error: string | null
  uploadImage: (file: File) => Promise<void>
  setImageUrl: (url: string) => void
  removeImage: () => void
}

export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const {
    folder = 'uploads',
    tags = [],
    maxSizeMB = 10,
    onSuccess,
    onError,
  } = options

  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Invalid file type. Only images are allowed.'
    }

    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit.`
    }

    return null
  }

  const uploadImage = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        toast.error(validationError)
        if (onError) {
          onError(new Error(validationError))
        }
        return
      }

      setError(null)
      setUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        if (tags.length > 0) {
          formData.append('tags', tags.join(','))
        }

        // Simulate progress
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
          setImageUrl(data.url)
          toast.success('Image uploaded successfully!')

          if (onSuccess) {
            onSuccess({
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
        const errorMessage = error.message || 'Failed to upload image'
        setError(errorMessage)
        toast.error(errorMessage)

        if (onError) {
          onError(error)
        }
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [folder, tags, maxSizeMB, onSuccess, onError]
  )

  const removeImage = useCallback(() => {
    setImageUrl('')
    setError(null)
  }, [])

  return {
    imageUrl,
    uploading,
    uploadProgress,
    error,
    uploadImage,
    setImageUrl,
    removeImage,
  }
}
```

---

## Next.js Configuration

### next.config.js

Configure Next.js to allow ImageKit images and optimize delivery:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: '*.imagekit.io',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "img-src 'self' data: https: blob: https://ik.imagekit.io https://*.imagekit.io",
              // ... other CSP directives
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### app/layout.tsx

Add DNS prefetch for faster image loading:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## Image Transformations

ImageKit provides powerful on-the-fly image transformations:

### Basic Transformations

```typescript
import { ImageKitService } from '@/lib/imagekit-service'

// Resize image
const resizedUrl = ImageKitService.getImageUrl(fileId, {
  width: 800,
  height: 600,
  quality: 90,
})

// Generate thumbnail
const thumbnailUrl = ImageKitService.getThumbnailUrl(fileId, 200, 200)

// Format conversion
const webpUrl = ImageKitService.getImageUrl(fileId, {
  format: 'webp',
  quality: 85,
})

// Auto format (best format for browser)
const autoUrl = ImageKitService.getImageUrl(fileId, {
  format: 'auto',
})
```

### Using with Next.js Image Component

```typescript
import Image from 'next/image'
import { ImageKitService } from '@/lib/imagekit-service'

function OptimizedImage({ fileId }: { fileId: string }) {
  // Generate optimized URL
  const imageUrl = ImageKitService.getImageUrl(fileId, {
    width: 800,
    quality: 85,
    format: 'auto',
  })

  return (
    <Image
      src={imageUrl}
      alt="Optimized image"
      width={800}
      height={600}
      loading="lazy"
    />
  )
}
```

### Responsive Images

```typescript
function ResponsiveImage({ fileId }: { fileId: string }) {
  const mobileUrl = ImageKitService.getImageUrl(fileId, { width: 400 })
  const tabletUrl = ImageKitService.getImageUrl(fileId, { width: 800 })
  const desktopUrl = ImageKitService.getImageUrl(fileId, { width: 1200 })

  return (
    <picture>
      <source media="(max-width: 768px)" srcSet={mobileUrl} />
      <source media="(max-width: 1024px)" srcSet={tabletUrl} />
      <img src={desktopUrl} alt="Responsive image" />
    </picture>
  )
}
```

---

## Utility Functions

### ImageKit URL Utilities

```typescript
// lib/utils/blog-content.ts

/**
 * Check if a URL is an ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  return url.includes('imagekit.io') || url.includes('ik.imagekit.io')
}

/**
 * Generate optimized ImageKit URL with transformations
 */
export function optimizeImageKitUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 85
): string {
  if (!isImageKitUrl(url)) {
    return url
  }

  const urlObj = new URL(url)
  const params = new URLSearchParams(urlObj.search)

  if (width) {
    params.set('tr', `w-${width}${height ? `,h-${height}` : ''},q-${quality}`)
  }

  return `${urlObj.origin}${urlObj.pathname}?${params.toString()}`
}
```

---

## Testing

### Unit Tests

```typescript
// tests/lib/imagekit-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageKitService } from '@/lib/imagekit-service'

// Mock ImageKit
vi.mock('imagekit', () => {
  return {
    default: class MockImageKit {
      upload(options: any, callback: any) {
        callback(null, {
          fileId: 'test-id',
          name: 'test.jpg',
          url: 'https://ik.imagekit.io/test/test.jpg',
        })
      }
    },
  }
})

describe('ImageKitService', () => {
  beforeEach(() => {
    process.env.IMAGEKIT_PUBLIC_KEY = 'test-key'
    process.env.IMAGEKIT_PRIVATE_KEY = 'test-key'
    process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test'
  })

  it('should upload image successfully', async () => {
    const buffer = Buffer.from('test')
    const result = await ImageKitService.uploadImage(buffer, 'test.jpg')

    expect(result.url).toBe('https://ik.imagekit.io/test/test.jpg')
    expect(result.fileId).toBe('test-id')
  })
})
```

### E2E Tests

```typescript
// cypress/e2e/imagekit-upload.cy.ts
describe('ImageKit Upload', () => {
  it('should upload image successfully', () => {
    cy.visit('/admin/blog/new')
    cy.get('[data-testid="image-upload"]').attachFile('test-image.jpg')
    cy.get('[data-testid="upload-success"]').should('be.visible')
  })
})
```

---

## Best Practices

### 1. Organize Files with Folders

```typescript
// Good: Organized folder structure
await ImageKitService.uploadImage(
  buffer,
  filename,
  'users/avatars',
  ['avatar']
)

// Bad: All files in root
await ImageKitService.uploadImage(buffer, filename, '', [])
```

### 2. Use Tags for Search and Management

```typescript
await ImageKitService.uploadImage(buffer, filename, 'products', [
  'product',
  'electronics',
  'featured',
])
```

### 3. Validate Files Before Upload

```typescript
function validateImage(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' }
  }

  return { valid: true }
}
```

### 4. Store File IDs in Database

```typescript
interface ImageRecord {
  id: string
  imagekit_file_id: string
  imagekit_url: string
  created_at: Date
}

// Later, use fileId for transformations
const thumbnailUrl = ImageKitService.getThumbnailUrl(record.imagekit_file_id)
```

### 5. Use Transformations for Performance

```typescript
// Instead of storing multiple sizes, use transformations
function getResponsiveImageUrl(fileId: string, width: number) {
  return ImageKitService.getImageUrl(fileId, {
    width,
    quality: 85,
    format: 'auto',
  })
}
```

### 6. Error Handling

```typescript
async function safeUpload(buffer: Buffer, filename: string) {
  try {
    return await ImageKitService.uploadImage(buffer, filename)
  } catch (error: any) {
    console.error('ImageKit upload failed:', error)
    // Implement fallback strategy
    throw new Error('Failed to upload image. Please try again.')
  }
}
```

---

## Security Considerations

1. **Never expose private keys** - Keep them in server-side code only
2. **Validate file types** - Only allow safe image formats
3. **Limit file sizes** - Prevent abuse and reduce costs
4. **Use authentication** - Protect upload endpoints
5. **Sanitize filenames** - Prevent path traversal attacks
6. **Rate limiting** - Implement rate limiting on upload endpoints
7. **CORS configuration** - Configure CORS properly in ImageKit dashboard

---

## Performance Optimization

1. **Use transformations** - Generate sizes on-demand instead of storing multiple copies
2. **Optimize quality** - Use appropriate quality settings (80-90 for most cases)
3. **Use auto format** - Let ImageKit serve the best format for each browser
4. **Implement caching** - Cache transformed URLs when possible
5. **Lazy loading** - Use Next.js Image component with `loading="lazy"`
6. **Monitor usage** - Track your ImageKit usage in the dashboard

---

## Troubleshooting

### Common Issues

#### 1. "ImageKit credentials are missing"

**Solution**: Check your `.env.local` file and ensure all three variables are set:
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

#### 2. "Upload failed" Error

**Possible causes**:
- Invalid credentials
- Network issues
- File too large
- Invalid file format

**Solution**:
```typescript
try {
  const result = await ImageKitService.uploadImage(buffer, filename)
} catch (error: any) {
  console.error('Upload error details:', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
  })
}
```

#### 3. Images Not Loading

**Check**:
- URL endpoint is correct
- File ID is valid
- ImageKit account is active
- CORS settings (if using from client-side)

#### 4. Transformations Not Working

**Solution**: Ensure you're using the file ID (not URL) for transformations:

```typescript
// ✅ Correct
const url = ImageKitService.getImageUrl(result.fileId, { width: 200 })

// ❌ Wrong
const url = ImageKitService.getImageUrl(result.url, { width: 200 })
```

---

## Complete Examples

### Example 1: Blog Post Image Upload

```typescript
// app/admin/blog/new/page.tsx
'use client'

import { ImageUpload } from '@/components/ui/image-upload'
import { useState } from 'react'

export default function NewBlogPost() {
  const [featuredImage, setFeaturedImage] = useState('')

  return (
    <form>
      <ImageUpload
        value={featuredImage}
        onChange={setFeaturedImage}
        label="Featured Image"
        folder="blog/featured"
        tags={['blog', 'featured']}
        maxSizeMB={5}
        required
      />
    </form>
  )
}
```

### Example 2: Product Image Upload

```typescript
// app/admin/products/new/page.tsx
'use client'

import { useImageUpload } from '@/hooks/use-image-upload'

export default function NewProduct() {
  const { imageUrl, uploading, uploadImage } = useImageUpload({
    folder: 'products',
    tags: ['product'],
    onSuccess: (result) => {
      console.log('Uploaded:', result.url)
    },
  })

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadImage(file)
        }}
      />
      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Product" />}
    </div>
  )
}
```

### Example 3: Server-Side Image Upload

```typescript
// app/api/products/route.ts
import { ImageKitService } from '@/lib/imagekit-service'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('image') as File

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await ImageKitService.uploadImage(
    buffer,
    file.name,
    'products',
    ['product']
  )

  return Response.json({ imageUrl: result.url, fileId: result.fileId })
}
```

---

## Additional Resources

- [ImageKit Documentation](https://docs.imagekit.io/)
- [ImageKit Dashboard](https://imagekit.io/dashboard)
- [Image Transformations Guide](https://docs.imagekit.io/features/image-transformations)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/api-reference/components/image)

---

## Summary

This guide provides a complete, production-ready implementation of ImageKit in Next.js applications. Key takeaways:

1. ✅ **Service Layer**: Centralized ImageKit service with singleton pattern
2. ✅ **API Routes**: Secure upload/delete endpoints with authentication
3. ✅ **React Components**: Reusable ImageUpload component with drag-and-drop
4. ✅ **Hooks**: Custom hook for image upload functionality
5. ✅ **Transformations**: On-the-fly image optimization
6. ✅ **Security**: Authentication, validation, and error handling
7. ✅ **Performance**: Optimized delivery with CDN and transformations
8. ✅ **Testing**: Unit and E2E test examples

**Ready to use ImageKit in your Next.js app!** 🚀

For questions or issues, refer to the [ImageKit Documentation](https://docs.imagekit.io/) or check the troubleshooting section above.
