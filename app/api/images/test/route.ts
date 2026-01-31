import { NextRequest, NextResponse } from 'next/server'
import { ImageKitService } from '@/lib/imagekit-service'

/**
 * Test ImageKit connection and configuration
 * GET /api/images/test
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

    const envCheck = {
      IMAGEKIT_PUBLIC_KEY: publicKey ? '✅ Set' : '❌ Missing',
      IMAGEKIT_PRIVATE_KEY: privateKey ? '✅ Set' : '❌ Missing',
      IMAGEKIT_URL_ENDPOINT: urlEndpoint ? '✅ Set' : '❌ Missing',
    }

    // If any are missing, return early
    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing environment variables',
          envCheck,
          error: 'Please set all ImageKit environment variables',
        },
        { status: 400 }
      )
    }

    // Test ImageKit initialization
    let initSuccess = false
    let initError = null
    try {
      const imagekit = ImageKitService.initialize()
      initSuccess = true
    } catch (error: any) {
      initError = error.message
    }

    // Test authentication parameters generation
    let authTest = null
    let authError = null
    try {
      const imagekit = ImageKitService.initialize()
      // Get authentication parameters (this tests the connection)
      const authParams = imagekit.getAuthenticationParameters()
      authTest = {
        token: authParams.token ? '✅ Generated' : '❌ Failed',
        signature: authParams.signature ? '✅ Generated' : '❌ Failed',
        expire: authParams.expire ? '✅ Generated' : '❌ Failed',
      }
    } catch (error: any) {
      authError = error.message
    }

    // Test URL generation
    let urlTest = null
    let urlError = null
    try {
      // Test generating a URL (doesn't require actual file)
      const testUrl = ImageKitService.getImageUrl('test-image.jpg', {
        width: 200,
        height: 200,
      })
      urlTest = {
        success: testUrl.includes(urlEndpoint || ''),
        url: testUrl,
      }
    } catch (error: any) {
      urlError = error.message
    }

    // Overall status
    const allTestsPassed =
      initSuccess && authTest && urlTest?.success && !authError && !urlError

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed
        ? '✅ ImageKit is properly configured and working!'
        : '⚠️ Some tests failed. Check details below.',
      tests: {
        environmentVariables: envCheck,
        initialization: initSuccess ? '✅ Success' : `❌ Failed: ${initError}`,
        authentication: authTest
          ? { status: '✅ Success', details: authTest }
          : `❌ Failed: ${authError}`,
        urlGeneration: urlTest
          ? {
              status: urlTest.success ? '✅ Success' : '❌ Failed',
              generatedUrl: urlTest.url,
            }
          : `❌ Failed: ${urlError}`,
      },
      configuration: {
        urlEndpoint: urlEndpoint,
        publicKey: publicKey ? `${publicKey.substring(0, 8)}...` : 'Not set',
        privateKey: privateKey ? '✅ Set (hidden)' : '❌ Not set',
      },
    })
  } catch (error: any) {
    console.error('ImageKit test error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Test failed with error',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}









