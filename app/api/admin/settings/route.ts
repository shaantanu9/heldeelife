import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/admin/settings - Get platform settings (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For now, return default settings
    // In future, you can create a settings table
    const defaultSettings = {
      site_name: 'HeldeeLife',
      site_description: 'Ayurveda and Modern Medicine E-commerce Platform',
      currency: 'INR',
      tax_rate: 18, // GST in India
      shipping_enabled: true,
      free_shipping_threshold: 500,
      default_shipping_cost: 50,
      low_stock_threshold: 10,
      order_auto_confirm: false,
      email_notifications: true,
      maintenance_mode: false,
    }

    return NextResponse.json({ settings: defaultSettings })
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update platform settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // For now, just return success
    // In future, save to settings table
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: body,
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









