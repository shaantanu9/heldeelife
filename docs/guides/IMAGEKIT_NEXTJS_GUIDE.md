# ImageKit Integration Guide for Next.js

A comprehensive guide to integrating ImageKit for image storage, upload, and URL generation in your Next.js applications.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Setup](#setup)
5. [Service Implementation](#service-implementation)
6. [Usage Examples](#usage-examples)
7. [API Routes](#api-routes)
8. [Image Transformations](#image-transformations)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

ImageKit is a cloud-based image optimization and delivery service that provides:

- **Global CDN**: Fast image delivery worldwide
- **Automatic Optimization**: Image compression and format conversion
- **Transformations**: Resize, crop, filter, and more on-the-fly
- **Scalable Storage**: Cloud storage that grows with your app
- **Cost-Effective**: Pay only for what you use

## Prerequisites

- Next.js 13+ (App Router recommended)
- Node.js 18+
- ImageKit account ([Sign up here](https://imagekit.io))

## Installation

### 1. Install ImageKit Package

```bash
npm install imagekit
# or
yarn add imagekit
# or
pnpm add imagekit
```

### 2. Install TypeScript Types (Optional)

```bash
npm install --save-dev @types/node
```

## Setup

### 1. Get ImageKit Credentials

1. Sign up at [https://imagekit.io](https://imagekit.io)
2. Go to **Dashboard** → **Developer Options**
3. Copy your credentials:
   - **Public Key**: Your public API key
   - **Private Key**: Your private API key (keep this secret!)
   - **URL Endpoint**: Your ImageKit URL (e.g., `https://ik.imagekit.io/your_imagekit_id`)

### 2. Add Environment Variables

Create or update your `.env.local` file:

```bash
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=your_url_endpoint_here
```

**Important**: Never commit `.env.local` to version control. Add it to your `.gitignore`:

```gitignore
.env.local
.env*.local
```

### 3. Verify Environment Variables

Create a simple test to verify your setup:

```typescript
// test-imagekit-setup.ts
const requiredEnvVars = [
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT',
]

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})

console.log('✅ All ImageKit environment variables are set!')
```

## Service Implementation

Create the ImageKit service file:

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
   * Initialize ImageKit client
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

      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
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

## Usage Examples

### 1. Upload Image from Buffer (Server-Side)

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ImageKitService } from '@/lib/imagekit-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to ImageKit
    const result = await ImageKitService.uploadImage(
      buffer,
      file.name,
      'uploads', // folder
      ['user-upload'] // tags
    )

    return NextResponse.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
```

### 2. Upload Image from URL

```typescript
import { ImageKitService } from '@/lib/imagekit-service'

async function uploadExternalImage(imageUrl: string) {
  try {
    const result = await ImageKitService.uploadFromUrl(
      imageUrl,
      'external-image.jpg',
      'external-uploads',
      ['external', 'imported']
    )

    console.log('Uploaded:', result.url)
    return result
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
```

### 3. Upload Base64 Image

```typescript
import { ImageKitService } from '@/lib/imagekit-service'

async function uploadBase64Image(base64String: string, filename: string) {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to ImageKit
    const result = await ImageKitService.uploadImage(
      buffer,
      filename,
      'base64-uploads',
      ['base64']
    )

    return result
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
```

### 4. Delete Image

```typescript
import { ImageKitService } from '@/lib/imagekit-service'

async function deleteUploadedImage(fileId: string) {
  try {
    const success = await ImageKitService.deleteImage(fileId)

    if (success) {
      console.log('Image deleted successfully')
    }

    return success
  } catch (error) {
    console.error('Delete failed:', error)
    throw error
  }
}
```

## API Routes

### Complete Upload API Route

```typescript
// app/api/images/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ImageKitService } from '@/lib/imagekit-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'
    const tags = (formData.get('tags') as string)?.split(',') || []

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${file.name}`

    // Upload to ImageKit
    const result = await ImageKitService.uploadImage(
      buffer,
      filename,
      folder,
      tags
    )

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
import { ImageKitService } from '@/lib/imagekit-service'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

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

### Client-Side Upload Component

```typescript
// components/ImageUpload.tsx
"use client";

import { useState } from "react";

export function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "user-uploads");
      formData.append("tags", "user,upload");

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {imageUrl && (
        <div>
          <p>Uploaded successfully!</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: "300px" }} />
          <p>URL: {imageUrl}</p>
        </div>
      )}
    </div>
  );
}
```

## Image Transformations

ImageKit provides powerful on-the-fly image transformations:

### 1. Resize Images

```typescript
import { ImageKitService } from '@/lib/imagekit-service'

// Get resized image URL
const resizedUrl = ImageKitService.getImageUrl(fileId, {
  width: 800,
  height: 600,
  quality: 90,
})
```

### 2. Generate Thumbnails

```typescript
// Generate 200x200 thumbnail
const thumbnailUrl = ImageKitService.getThumbnailUrl(fileId, 200, 200)

// Generate 150x150 thumbnail
const smallThumbnail = ImageKitService.getThumbnailUrl(fileId, 150, 150)
```

### 3. Format Conversion

```typescript
// Convert to WebP
const webpUrl = ImageKitService.getImageUrl(fileId, {
  format: 'webp',
  quality: 85,
})

// Auto format (serves best format for browser)
const autoUrl = ImageKitService.getImageUrl(fileId, {
  format: 'auto',
})
```

### 4. Advanced Transformations

```typescript
// Crop and resize
const croppedUrl = ImageKitService.getImageUrl(fileId, {
  width: 400,
  height: 400,
  crop: 'maintain_ratio',
  focus: 'auto', // Smart cropping
})

// Quality optimization
const optimizedUrl = ImageKitService.getImageUrl(fileId, {
  quality: 80,
  format: 'auto',
})
```

### 5. Using in Next.js Image Component

```typescript
import Image from "next/image";
import { ImageKitService } from "@/lib/imagekit-service";

function OptimizedImage({ fileId }: { fileId: string }) {
  // Generate optimized URL
  const imageUrl = ImageKitService.getImageUrl(fileId, {
    width: 800,
    quality: 85,
    format: "auto",
  });

  return (
    <Image
      src={imageUrl}
      alt="Optimized image"
      width={800}
      height={600}
      loading="lazy"
    />
  );
}
```

## Best Practices

### 1. Organize Files with Folders

```typescript
// Good: Organized folder structure
await ImageKitService.uploadImage(buffer, filename, 'users/avatars', ['avatar'])

// Bad: All files in root
await ImageKitService.uploadImage(buffer, filename, '', [])
```

### 2. Use Tags for Search and Management

```typescript
// Tag images for easy filtering
await ImageKitService.uploadImage(buffer, filename, 'products', [
  'product',
  'electronics',
  'featured',
])
```

### 3. Validate Files Before Upload

```typescript
function validateImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' }
  }

  return { valid: true }
}
```

### 4. Store File IDs in Database

```typescript
// Store both URL and fileId for flexibility
interface ImageRecord {
  id: string
  imagekit_file_id: string
  imagekit_url: string
  local_url?: string // Fallback
  created_at: Date
}

// Later, you can use fileId for transformations
const thumbnailUrl = ImageKitService.getThumbnailUrl(record.imagekit_file_id)
```

### 5. Error Handling

```typescript
async function safeUpload(buffer: Buffer, filename: string) {
  try {
    return await ImageKitService.uploadImage(buffer, filename)
  } catch (error: any) {
    // Log error for monitoring
    console.error('ImageKit upload failed:', error)

    // Implement fallback strategy
    // e.g., save to local storage or retry
    throw new Error('Failed to upload image. Please try again.')
  }
}
```

### 6. Use Transformations for Performance

```typescript
// Instead of storing multiple sizes, use transformations
function getResponsiveImageUrl(fileId: string, width: number) {
  return ImageKitService.getImageUrl(fileId, {
    width,
    quality: 85,
    format: 'auto',
  })
}

// Usage
const mobileUrl = getResponsiveImageUrl(fileId, 400)
const tabletUrl = getResponsiveImageUrl(fileId, 800)
const desktopUrl = getResponsiveImageUrl(fileId, 1200)
```

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

### Debug Mode

Enable detailed logging:

```typescript
// lib/imagekit-service.ts
static async uploadImage(...) {
  try {
    const imagekit = this.initialize();

    // Enable debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Uploading to ImageKit:', {
        filename,
        folder,
        tags,
        size: imageBuffer.length,
      });
    }

    // ... rest of the code
  }
}
```

## Additional Resources

- [ImageKit Documentation](https://docs.imagekit.io/)
- [ImageKit Dashboard](https://imagekit.io/dashboard)
- [Image Transformations Guide](https://docs.imagekit.io/features/image-transformations)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/api-reference/components/image)

## Example: Complete Integration

Here's a complete example of integrating ImageKit in a Next.js app:

```typescript
// 1. Service: lib/imagekit-service.ts (see above)

// 2. API Route: app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ImageKitService } from "@/lib/imagekit-service";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await ImageKitService.uploadImage(
    buffer,
    file.name,
    "uploads"
  );

  return NextResponse.json({ url: result.url, fileId: result.fileId });
}

// 3. Component: components/ImageUpload.tsx (see above)

// 4. Usage in pages
import { ImageUpload } from "@/components/ImageUpload";

export default function Page() {
  return (
    <div>
      <h1>Upload Image</h1>
      <ImageUpload />
    </div>
  );
}
```

## Security Considerations

1. **Never expose private keys** - Keep them in server-side code only
2. **Validate file types** - Only allow safe image formats
3. **Limit file sizes** - Prevent abuse and reduce costs
4. **Use authentication** - Protect upload endpoints
5. **Sanitize filenames** - Prevent path traversal attacks

## Cost Optimization

1. **Use transformations** - Generate sizes on-demand instead of storing multiple copies
2. **Optimize quality** - Use appropriate quality settings (80-90 for most cases)
3. **Use auto format** - Let ImageKit serve the best format for each browser
4. **Implement caching** - Cache transformed URLs when possible
5. **Monitor usage** - Track your ImageKit usage in the dashboard

---

**Ready to use ImageKit in your Next.js app!** 🚀

For questions or issues, refer to the [ImageKit Documentation](https://docs.imagekit.io/) or check the troubleshooting section above.
