/**
 * Upload Test Image to ImageKit
 *
 * Run with: npm run upload:test-image
 * This will upload the image.png file to ImageKit
 */

import ImageKit from 'imagekit'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

// Load environment variables
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
]

let envLoaded = false
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
    envLoaded = true
    break
  }
}

if (!envLoaded) {
  console.error('❌ No .env.local or .env file found!')
  process.exit(1)
}

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

if (!publicKey || !privateKey || !urlEndpoint) {
  console.error('❌ Missing ImageKit environment variables!')
  process.exit(1)
}

async function uploadTestImage() {
  console.log('📤 Uploading test image to ImageKit...\n')

  // Initialize ImageKit
  const imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint: urlEndpoint.replace(/\/$/, ''),
  })

  // Read the image file
  const imagePath = resolve(process.cwd(), 'image.png')

  if (!existsSync(imagePath)) {
    console.error(`❌ Image file not found: ${imagePath}`)
    process.exit(1)
  }

  console.log(`📁 Reading image: ${imagePath}`)
  const imageBuffer = readFileSync(imagePath)
  const fileSize = (imageBuffer.length / 1024).toFixed(2)
  console.log(`📊 File size: ${fileSize} KB\n`)

  // Upload to ImageKit
  console.log('🚀 Uploading to ImageKit...')

  try {
    const result = await new Promise<any>((resolve, reject) => {
      imagekit.upload(
        {
          file: imageBuffer,
          fileName: `test-image-${Date.now()}.png`,
          folder: 'heldeelife/test',
          tags: ['test', 'upload'],
          useUniqueFileName: true,
        },
        (error: any, result: any) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )
    })

    console.log('\n✅ Upload successful!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Upload Details:')
    console.log(`  File ID: ${result.fileId}`)
    console.log(`  File Name: ${result.name}`)
    console.log(
      `  File Size: ${result.fileSize ? (result.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}`
    )
    console.log(
      `  Dimensions: ${result.width || 'N/A'} x ${result.height || 'N/A'}`
    )
    console.log(`  File Type: ${result.fileType}`)
    console.log(`  Folder: ${result.folderPath || 'root'}`)
    console.log(`  Tags: ${result.tags?.join(', ') || 'none'}`)
    console.log('\n🌐 URLs:')
    console.log(`  Original: ${result.url}`)
    if (result.thumbnailUrl) {
      console.log(`  Thumbnail: ${result.thumbnailUrl}`)
    }

    // Generate transformed URLs using the file path/name
    try {
      const thumbnailUrl = imagekit.url({
        src: result.name,
        transformation: [
          {
            width: '200',
            height: '200',
            quality: '80',
            crop: 'maintain_ratio',
          },
        ],
      })
      console.log(`  Thumbnail (200x200): ${thumbnailUrl}`)

      const mediumUrl = imagekit.url({
        src: result.name,
        transformation: [
          {
            width: '800',
            height: '600',
            quality: '85',
            crop: 'maintain_ratio',
          },
        ],
      })
      console.log(`  Medium (800x600): ${mediumUrl}`)
    } catch (urlError: any) {
      console.log(`  ⚠️  URL transformation test skipped: ${urlError.message}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ ImageKit upload test completed successfully!')
    console.log('✅ You can now use ImageKit in your application!\n')

    return result
  } catch (error: any) {
    console.error('\n❌ Upload failed!')
    console.error(`Error: ${error.message}`)
    if (error.response) {
      console.error(`Response: ${JSON.stringify(error.response, null, 2)}`)
    }
    process.exit(1)
  }
}

// Run the upload
uploadTestImage().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
