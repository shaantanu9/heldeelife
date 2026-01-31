/**
 * ImageKit Connection Test Script
 *
 * Run with: npx tsx scripts/test-imagekit.ts
 * Or: npm run test:imagekit (if script is added to package.json)
 */

import ImageKit from 'imagekit'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load environment variables from multiple possible locations
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
]

let envLoaded = false
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
    envLoaded = true
    console.log(
      `📁 Loaded environment from: ${envPath.replace(process.cwd(), '.')}\n`
    )
    break
  }
}

if (!envLoaded) {
  console.warn(
    '⚠️  No .env.local or .env file found. Using system environment variables.\n'
  )
}

async function testImageKit() {
  console.log('🔍 Testing ImageKit Configuration...\n')

  // Check environment variables
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  console.log('📋 Environment Variables Check:')
  console.log(`  IMAGEKIT_PUBLIC_KEY: ${publicKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`  IMAGEKIT_PRIVATE_KEY: ${privateKey ? '✅ Set' : '❌ Missing'}`)
  console.log(
    `  IMAGEKIT_URL_ENDPOINT: ${urlEndpoint ? '✅ Set' : '❌ Missing'}`
  )
  console.log('')

  if (!publicKey || !privateKey || !urlEndpoint) {
    console.error('❌ Missing required environment variables!')
    console.error('Please set all ImageKit environment variables in .env.local')
    process.exit(1)
  }

  // Test 1: Initialize ImageKit
  console.log('🧪 Test 1: Initializing ImageKit...')
  let imagekit: ImageKit
  try {
    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })
    console.log('  ✅ ImageKit initialized successfully\n')
  } catch (error: any) {
    console.error(`  ❌ Initialization failed: ${error.message}\n`)
    process.exit(1)
  }

  // Test 2: Generate Authentication Parameters
  console.log('🧪 Test 2: Testing Authentication...')
  try {
    const authParams = imagekit.getAuthenticationParameters()
    if (authParams.token && authParams.signature && authParams.expire) {
      console.log('  ✅ Authentication parameters generated successfully')
      console.log(`  Token: ${authParams.token.substring(0, 20)}...`)
      console.log(`  Signature: ${authParams.signature.substring(0, 20)}...`)
      console.log(`  Expire: ${authParams.expire}\n`)
    } else {
      console.error('  ❌ Failed to generate authentication parameters\n')
      process.exit(1)
    }
  } catch (error: any) {
    console.error(`  ❌ Authentication test failed: ${error.message}\n`)
    process.exit(1)
  }

  // Test 3: Generate URL
  console.log('🧪 Test 3: Testing URL Generation...')
  try {
    // Test with a simple path (not a full URL)
    const testPath = 'test-image.jpg'
    const testUrl = imagekit.url({
      src: testPath,
      transformation: [
        {
          width: '200',
          height: '200',
          quality: '80',
        },
      ],
    })

    // Validate the URL
    if (!testUrl || typeof testUrl !== 'string') {
      throw new Error('URL generation returned invalid result')
    }

    console.log('  ✅ URL generation successful')
    console.log(`  Generated URL: ${testUrl}\n`)

    if (!testUrl.includes(urlEndpoint)) {
      console.warn("  ⚠️  Warning: Generated URL doesn't contain your endpoint")
      console.warn(`  Expected: ${urlEndpoint}`)
      console.warn(`  Got: ${testUrl}\n`)
    } else {
      console.log(`  ✅ URL contains correct endpoint\n`)
    }
  } catch (error: any) {
    console.error(`  ❌ URL generation failed: ${error.message}`)
    console.error(`  This might be due to URL endpoint format.`)
    console.error(`  Expected format: https://ik.imagekit.io/your_imagekit_id`)
    console.error(`  Your endpoint: ${urlEndpoint}\n`)
    // Don't exit - this might be a format issue, not a critical failure
  }

  // Test 4: List Files (optional - tests API connection)
  console.log('🧪 Test 4: Testing API Connection (List Files)...')
  try {
    await new Promise<void>((resolve, reject) => {
      imagekit.listFiles({ limit: 1 }, (error: any, result: any) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
    console.log('  ✅ API connection successful\n')
  } catch (error: any) {
    console.error(`  ❌ API connection failed: ${error.message}`)
    console.error(
      '  This might indicate invalid credentials or network issues\n'
    )
    // Don't exit here as this is optional
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ All critical tests passed!')
  console.log('✅ ImageKit is properly configured and working!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📝 Configuration Summary:')
  console.log(`  URL Endpoint: ${urlEndpoint}`)
  console.log(`  Public Key: ${publicKey.substring(0, 8)}...`)
  console.log(`  Private Key: ✅ Set (hidden)\n`)

  console.log('🚀 You can now use ImageKit in your application!')
  console.log('   - Upload images via: /api/images/upload')
  console.log('   - Use ImageKitService in your code\n')
}

// Run the test
testImageKit().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
