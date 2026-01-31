# ImageKit Connection Test Guide

## Quick Test

I've created two ways to test your ImageKit configuration:

### Option 1: Run Test Script (Recommended)

```bash
npm run test:imagekit
```

Or directly:

```bash
npx tsx scripts/test-imagekit.ts
```

This will:

- ✅ Check if all environment variables are set
- ✅ Test ImageKit initialization
- ✅ Test authentication parameter generation
- ✅ Test URL generation
- ✅ Test API connection (optional)

### Option 2: Test via API Endpoint

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Visit or curl the test endpoint:

   ```bash
   curl http://localhost:3000/api/images/test
   ```

   Or open in browser:

   ```
   http://localhost:3000/api/images/test
   ```

## What to Check

### ✅ Success Indicators

If everything is working, you should see:

- ✅ All environment variables are set
- ✅ ImageKit initialized successfully
- ✅ Authentication parameters generated
- ✅ URL generation working
- ✅ API connection successful (if credentials are valid)

### ❌ Common Issues

1. **Missing Environment Variables**
   - Make sure `.env.local` exists in your project root
   - Verify all three variables are set:
     - `IMAGEKIT_PUBLIC_KEY`
     - `IMAGEKIT_PRIVATE_KEY`
     - `IMAGEKIT_URL_ENDPOINT`

2. **Invalid Credentials**
   - Double-check your ImageKit dashboard
   - Ensure keys are copied correctly (no extra spaces)
   - Verify URL endpoint format: `https://ik.imagekit.io/your_imagekit_id`

3. **API Connection Failed**
   - Check your internet connection
   - Verify ImageKit account is active
   - Ensure credentials have proper permissions

## Environment Variables Format

Your `.env.local` should look like:

```env
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## Next Steps

Once the test passes:

- ✅ You can upload images via `/api/images/upload`
- ✅ Use `ImageKitService` in your code
- ✅ Images will be stored in ImageKit CDN
- ✅ Use transformations for optimized delivery

## Using ImageKit in Your App

### Upload Image (Admin Only)

```typescript
// POST /api/images/upload
const formData = new FormData()
formData.append('file', imageFile)
formData.append('folder', 'blog') // optional
formData.append('tags', 'blog,featured') // optional

const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData,
})
```

### Use ImageKitService

```typescript
import { ImageKitService } from '@/lib/imagekit-service'

// Upload image
const result = await ImageKitService.uploadImage(buffer, 'image.jpg', 'blog', [
  'tag1',
  'tag2',
])

// Get transformed URL
const thumbnailUrl = ImageKitService.getThumbnailUrl(result.fileId, 200, 200)
```

## Support

If tests fail:

1. Check the error message for specific issues
2. Verify credentials in ImageKit dashboard
3. Ensure `.env.local` is in project root
4. Restart dev server after changing env variables

