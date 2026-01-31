import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  isSupabaseConnectionError,
  analyzeSupabaseError,
} from '@/lib/utils/supabase-error-handler'

/**
 * Health Check Endpoint
 * Used by monitoring systems and load balancers to verify application health
 * GET /api/health
 */
export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection with error handling
    let dbError: any = null
    let connectionError = false

    try {
      const { error } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1)

      dbError = error

      // Check if it's a connection error
      if (error && isSupabaseConnectionError(error)) {
        connectionError = true
        const errorInfo = analyzeSupabaseError(error)
        dbError = {
          ...error,
          userMessage: errorInfo.userMessage,
          suggestion: errorInfo.suggestion,
          connectionError: true,
          paused: errorInfo.isPaused,
        }
      }
    } catch (error) {
      if (isSupabaseConnectionError(error)) {
        connectionError = true
        const errorInfo = analyzeSupabaseError(error)
        dbError = {
          message: errorInfo.userMessage,
          suggestion: errorInfo.suggestion,
          connectionError: true,
          paused: errorInfo.isPaused,
        }
      } else {
        dbError = error instanceof Error ? error : new Error(String(error))
      }
    }

    const dbResponseTime = Date.now() - startTime

    if (dbError) {
      return NextResponse.json(
        {
          status: connectionError ? 'degraded' : 'unhealthy',
          database: {
            connected: false,
            error: dbError.userMessage || dbError.message,
            suggestion: dbError.suggestion,
            connectionError: connectionError || dbError.connectionError,
            paused: dbError.paused,
            responseTime: dbResponseTime,
          },
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
        { status: connectionError ? 503 : 503 }
      )
    }

    // Check environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
    ]

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: {
            connected: true,
            responseTime: dbResponseTime,
          },
          environment: {
            missing: missingEnvVars,
          },
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        status: 'healthy',
        database: {
          connected: true,
          responseTime: dbResponseTime,
        },
        environment: {
          configured: true,
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 503 }
    )
  }
}
