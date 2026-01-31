# ImageUpload Component Usage Examples

## Basic Usage

```tsx
import { ImageUpload } from '@/components/ui/image-upload'

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('')

  return (
    <ImageUpload
      value={imageUrl}
      onChange={setImageUrl}
      label="Featured Image"
    />
  )
}
```

## With Form Integration (React Hook Form)

```tsx
import { useForm } from 'react-hook-form'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form'

function BlogPostForm() {
  const form = useForm({
    defaultValues: {
      title: '',
      featuredImage: '',
    },
  })

  return (
    <FormField
      control={form.control}
      name="featuredImage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Featured Image</FormLabel>
          <FormControl>
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              folder="blog"
              tags={['blog', 'featured']}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
```

## Product Image Upload

```tsx
<ImageUpload
  value={productImage}
  onChange={setProductImage}
  label="Product Image"
  folder="products"
  tags={['product', productId]}
  maxSizeMB={5}
  aspectRatio="1/1"
  previewHeight={300}
  onUploadSuccess={(result) => {
    console.log('Uploaded:', result.url)
    console.log('Dimensions:', result.width, 'x', result.height)
  }}
/>
```

## Blog Post Featured Image

```tsx
<ImageUpload
  value={featuredImage}
  onChange={setFeaturedImage}
  label="Featured Image"
  description="This image will be used as the featured image for your blog post"
  folder="blog/featured"
  tags={['blog', 'featured']}
  aspectRatio="16/9"
  required
/>
```

## User Avatar Upload

```tsx
<ImageUpload
  value={avatarUrl}
  onChange={setAvatarUrl}
  label="Profile Picture"
  folder="avatars"
  tags={['avatar', userId]}
  maxSizeMB={2}
  aspectRatio="1/1"
  previewHeight={200}
  showUrlInput={false}
/>
```

## Category/Collection Image

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

## With Custom Error Handling

```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="Image"
  onUploadSuccess={(result) => {
    toast.success('Image uploaded!')
    // Additional success logic
  }}
  onUploadError={(error) => {
    toast.error(`Upload failed: ${error.message}`)
    // Log to error tracking service
    logError(error)
  }}
/>
```

## Disabled State

```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="Image"
  disabled={!isAdmin}
/>
```

## Without URL Input

```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="Image"
  showUrlInput={false} // Only allow file uploads
/>
```

## Without Drag and Drop

```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="Image"
  allowDragDrop={false} // Only allow click to upload
/>
```

## Props Reference

| Prop              | Type                    | Default        | Description                         |
| ----------------- | ----------------------- | -------------- | ----------------------------------- |
| `value`           | `string?`               | -              | Current image URL                   |
| `onChange`        | `(url: string) => void` | -              | Callback when URL changes           |
| `label`           | `string`                | `"Image"`      | Label text                          |
| `description`     | `string?`               | -              | Help text below label               |
| `folder`          | `string`                | `"heldeelife"` | ImageKit folder path                |
| `tags`            | `string[]`              | `[]`           | ImageKit tags                       |
| `maxSizeMB`       | `number`                | `10`           | Maximum file size in MB             |
| `accept`          | `string`                | `"image/*"`    | Accepted file types                 |
| `aspectRatio`     | `string?`               | -              | Preview aspect ratio (e.g., "16/9") |
| `previewHeight`   | `number`                | `256`          | Preview height in pixels            |
| `showUrlInput`    | `boolean`               | `true`         | Show URL input field                |
| `required`        | `boolean`               | `false`        | Mark as required                    |
| `disabled`        | `boolean`               | `false`        | Disable component                   |
| `className`       | `string?`               | -              | Custom CSS classes                  |
| `onUploadSuccess` | `function?`             | -              | Callback on successful upload       |
| `onUploadError`   | `function?`             | -              | Callback on upload error            |
| `allowDragDrop`   | `boolean`               | `true`         | Enable drag and drop                |

## Best Practices

1. **Use appropriate folders**: Organize images by context (blog, products, avatars, etc.)
2. **Add tags**: Use tags for better organization and filtering in ImageKit
3. **Set size limits**: Adjust `maxSizeMB` based on your needs
4. **Use aspect ratios**: Set `aspectRatio` for consistent previews
5. **Handle errors**: Use `onUploadError` for custom error handling
6. **Track uploads**: Use `onUploadSuccess` to save metadata to your database









