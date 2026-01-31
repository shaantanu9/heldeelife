'use client'

/**
 * Blog-specific ImageUpload component
 * Wraps the reusable ImageUpload with blog-specific defaults
 */
import { ImageUpload as BaseImageUpload } from '@/components/ui/image-upload'
import type { ImageUploadProps } from '@/components/ui/image-upload'

interface BlogImageUploadProps
  extends Omit<ImageUploadProps, 'folder' | 'tags'> {
  folder?: string
  tags?: string[]
}

export function ImageUpload({
  label = 'Featured Image',
  folder = 'blog',
  tags = ['blog'],
  ...props
}: BlogImageUploadProps) {
  return (
    <BaseImageUpload
      label={label}
      folder={folder}
      tags={tags}
      aspectRatio="16/9"
      description="This image will be used as the featured image for your blog post"
      {...props}
    />
  )
}
