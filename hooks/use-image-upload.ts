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

/**
 * Hook for handling image uploads to ImageKit
 *
 * @example
 * ```tsx
 * const { imageUrl, uploading, uploadImage, setImageUrl } = useImageUpload({
 *   folder: "blog",
 *   tags: ["blog", "featured"],
 *   onSuccess: (result) => {
 *     console.log("Uploaded:", result.url);
 *   }
 * });
 * ```
 */
export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const {
    folder = 'heldeelife',
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
      return `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
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









