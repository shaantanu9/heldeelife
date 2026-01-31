# ImageUpload Component

A comprehensive, reusable image upload component for use throughout your application. Built with ImageKit integration, drag-and-drop support, progress tracking, and error handling.

## Features

✅ **Drag & Drop Support** - Intuitive file upload experience  
✅ **Progress Tracking** - Real-time upload progress indicator  
✅ **Image Preview** - Instant preview before and after upload  
✅ **URL Input** - Option to paste image URLs directly  
✅ **Error Handling** - Comprehensive validation and error messages  
✅ **Customizable** - Extensive props for different use cases  
✅ **TypeScript** - Fully typed for better DX  
✅ **Accessible** - Built with accessibility in mind  
✅ **Responsive** - Works on all screen sizes

## Installation

The component is already available at `@/components/ui/image-upload`. No additional installation needed.

## Basic Usage

```tsx
import { ImageUpload } from '@/components/ui/image-upload'

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('')

  return (
    <ImageUpload value={imageUrl} onChange={setImageUrl} label="Upload Image" />
  )
}
```

## Usage with React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form'

function MyForm() {
  const form = useForm({
    defaultValues: {
      image: '',
    },
  })

  return (
    <FormField
      control={form.control}
      name="image"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Image</FormLabel>
          <FormControl>
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              folder="uploads"
              tags={['form']}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
```

## Using the Hook

For more control, use the `useImageUpload` hook:

```tsx
import { useImageUpload } from '@/hooks/use-image-upload'

function MyComponent() {
  const { imageUrl, uploading, uploadImage, setImageUrl } = useImageUpload({
    folder: 'blog',
    tags: ['blog', 'featured'],
    onSuccess: (result) => {
      console.log('Uploaded:', result.url)
    },
  })

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadImage(file)
        }}
      />
      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  )
}
```

## Common Use Cases

### Blog Post Featured Image

```tsx
<ImageUpload
  value={featuredImage}
  onChange={setFeaturedImage}
  label="Featured Image"
  description="This image will appear at the top of your blog post"
  folder="blog/featured"
  tags={['blog', 'featured']}
  aspectRatio="16/9"
  required
/>
```

### Product Image

```tsx
<ImageUpload
  value={productImage}
  onChange={setProductImage}
  label="Product Image"
  folder="products"
  tags={['product', productId]}
  aspectRatio="1/1"
  previewHeight={400}
  maxSizeMB={5}
/>
```

### User Avatar

```tsx
<ImageUpload
  value={avatarUrl}
  onChange={setAvatarUrl}
  label="Profile Picture"
  folder="avatars"
  tags={['avatar', userId]}
  aspectRatio="1/1"
  previewHeight={200}
  maxSizeMB={2}
  showUrlInput={false}
/>
```

### Category Image

```tsx
<ImageUpload
  value={categoryImage}
  onChange={setCategoryImage}
  label="Category Image"
  folder="categories"
  tags={['category']}
  aspectRatio="4/3"
  onUploadSuccess={(result) => {
    // Save to database
    updateCategory(categoryId, { image: result.url })
  }}
/>
```

## Props

| Prop              | Type                    | Default        | Description                                |
| ----------------- | ----------------------- | -------------- | ------------------------------------------ |
| `value`           | `string?`               | -              | Current image URL                          |
| `onChange`        | `(url: string) => void` | -              | Callback when URL changes                  |
| `label`           | `string`                | `"Image"`      | Label text                                 |
| `description`     | `string?`               | -              | Help text below label                      |
| `folder`          | `string`                | `"heldeelife"` | ImageKit folder path                       |
| `tags`            | `string[]`              | `[]`           | ImageKit tags for organization             |
| `maxSizeMB`       | `number`                | `10`           | Maximum file size in MB                    |
| `accept`          | `string`                | `"image/*"`    | Accepted file types                        |
| `aspectRatio`     | `string?`               | -              | Preview aspect ratio (e.g., "16/9", "1/1") |
| `previewHeight`   | `number`                | `256`          | Preview height in pixels                   |
| `showUrlInput`    | `boolean`               | `true`         | Show URL input field                       |
| `required`        | `boolean`               | `false`        | Mark as required field                     |
| `disabled`        | `boolean`               | `false`        | Disable component                          |
| `className`       | `string?`               | -              | Custom CSS classes                         |
| `onUploadSuccess` | `function?`             | -              | Callback on successful upload              |
| `onUploadError`   | `function?`             | -              | Callback on upload error                   |
| `allowDragDrop`   | `boolean`               | `true`         | Enable drag and drop                       |

## File Validation

The component automatically validates:

- **File Type**: Only image files (JPEG, PNG, WEBP, GIF)
- **File Size**: Configurable maximum size (default: 10MB)
- **URL Format**: Validates URL format when using URL input

## Error Handling

Errors are displayed inline and via toast notifications. Common errors:

- Invalid file type
- File too large
- Upload failed
- Network errors

## ImageKit Integration

The component uses your ImageKit configuration:

- Uploads to configured ImageKit account
- Organizes by folder and tags
- Returns optimized CDN URLs
- Supports image transformations

## Best Practices

1. **Use appropriate folders**: Organize by context (blog, products, avatars)
2. **Add tags**: Use tags for better organization in ImageKit
3. **Set size limits**: Adjust `maxSizeMB` based on your needs
4. **Use aspect ratios**: Set `aspectRatio` for consistent previews
5. **Handle callbacks**: Use `onUploadSuccess` to save metadata
6. **Validate on server**: Always validate uploads on the server side too

## Examples

See `components/ui/image-upload-examples.md` for more detailed examples.

## Support

For issues or questions:

- Check ImageKit dashboard for upload status
- Verify environment variables are set
- Check browser console for errors
- Ensure user has admin role for uploads









