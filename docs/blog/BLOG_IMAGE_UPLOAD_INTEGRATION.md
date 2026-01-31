# Blog Image Upload Integration

## Overview

The blog editor now has a comprehensive image upload system integrated with ImageKit, ensuring proper static site generation and optimized image delivery.

## Features

### 1. **Rich Text Editor Image Upload**

- **Dialog-based upload**: Professional image upload dialog with tabs for upload and URL
- **Drag & Drop**: Upload images directly from the editor toolbar
- **Progress tracking**: Real-time upload progress with visual feedback
- **Error handling**: Comprehensive error messages and validation
- **Image preview**: Preview images before inserting into content

### 2. **Featured Image Upload**

- **Dedicated component**: Blog-specific ImageUpload component with 16:9 aspect ratio
- **Organized storage**: Images stored in `blog/featured` folder
- **Tagged properly**: Images tagged with `["blog", "featured"]`

### 3. **Content Image Processing**

- **Static generation ready**: Images processed for optimal static site generation
- **SEO optimized**: Images include proper alt attributes and dimensions
- **Performance**: Lazy loading for content images
- **ImageKit optimization**: Automatic URL optimization for ImageKit images

## Usage

### In Blog Editor

1. **Click the image icon** in the editor toolbar
2. **Choose upload method**:
   - **Upload**: Drag & drop or click to select file
   - **From URL**: Paste an image URL directly
3. **Image is inserted** at cursor position

### Featured Image

The featured image component is already integrated in the blog post form:

```tsx
<ImageUpload
  value={featuredImage || ''}
  onChange={(url) => setValue('featured_image', url)}
  label="Featured Image"
  folder="blog/featured"
  tags={['blog', 'featured']}
/>
```

## Image Processing

### Automatic Processing

Blog content is automatically processed for static generation:

- **Alt attributes**: Added to images without alt text
- **Loading attributes**: Lazy loading for better performance
- **Dimensions**: Width/height hints for ImageKit URLs
- **Sanitization**: Scripts and dangerous content removed

### Image Extraction

Images from blog content are:

- Extracted for Open Graph metadata
- Included in structured data
- Optimized for social sharing

## Static Generation

### How It Works

1. **Build time**: Blog posts are statically generated
2. **Image processing**: Content HTML is processed
3. **ImageKit URLs**: Optimized for CDN delivery
4. **Metadata**: Images included in Open Graph tags

### ImageKit Integration

- **CDN delivery**: All images served via ImageKit CDN
- **Automatic optimization**: Images optimized on-the-fly
- **Transformations**: Can apply transformations via URL parameters
- **Global delivery**: Fast image delivery worldwide

## File Structure

```
components/
  editor/
    rich-text-editor.tsx      # Main editor with image upload
    image-upload-dialog.tsx    # Image upload dialog
  blog/
    image-upload.tsx           # Blog-specific image upload wrapper
  ui/
    image-upload.tsx           # Reusable image upload component

lib/
  utils/
    blog-content.ts           # Blog content processing utilities

app/
  blog/
    [slug]/
      page.tsx                # Blog post page with image processing
```

## Best Practices

1. **Use appropriate folders**:
   - Featured images: `blog/featured`
   - Content images: `blog/content`

2. **Add tags**:
   - Featured: `["blog", "featured"]`
   - Content: `["blog", "content"]`

3. **Image sizes**:
   - Featured: 16:9 aspect ratio recommended
   - Content: Flexible, but keep under 10MB

4. **Alt text**: Always add descriptive alt text for accessibility

5. **Optimization**: Let ImageKit handle optimization automatically

## Troubleshooting

### Images not uploading

- Check admin role (only admins can upload)
- Verify ImageKit credentials
- Check file size (max 10MB)
- Verify file type (images only)

### Images not displaying

- Check ImageKit URL format
- Verify Next.js image configuration
- Check browser console for errors
- Ensure images are published

### Static generation issues

- Verify images are accessible
- Check image URLs in content
- Ensure proper error handling
- Check build logs for errors

## API Reference

### ImageUploadDialog

```tsx
<ImageUploadDialog
  open={boolean}
  onOpenChange={(open: boolean) => void}
  onInsert={(url: string) => void}
  folder?: string
  tags?: string[]
/>
```

### Blog Content Utilities

```tsx
// Process content for static generation
processBlogContent(html: string): string

// Extract image URLs
extractImageUrls(html: string): string[]

// Check if ImageKit URL
isImageKitUrl(url: string): boolean

// Optimize ImageKit URL
optimizeImageKitUrl(url: string, width?: number, height?: number, quality?: number): string
```

## Next Steps

1. ✅ Image upload in editor - **Complete**
2. ✅ Featured image upload - **Complete**
3. ✅ Static generation support - **Complete**
4. ✅ Image processing utilities - **Complete**
5. ✅ SEO optimization - **Complete**

The blog image upload system is now fully integrated and ready for production use!

