import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/products/inventory - Get inventory (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const lowStock = searchParams.get('low_stock') === 'true'

    let query = supabaseAdmin
      .from('inventory')
      .select(
        `
        *,
        products (
          id,
          name,
          sku
        )
      `
      )
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: inventory, error } = await query

    // Filter for low stock in memory (Supabase doesn't support comparing two columns directly)
    let filteredInventory = inventory || []
    if (lowStock && inventory) {
      filteredInventory = inventory.filter(
        (inv: any) => inv.available_quantity <= inv.low_stock_threshold
      )
    }

    if (error) {
      console.error('Error fetching inventory:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      )
    }

    return NextResponse.json({ inventory: filteredInventory })
  } catch (error) {
    console.error('Error in GET /api/products/inventory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products/inventory - Add/restock inventory (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      product_id,
      quantity,
      location,
      batch_number,
      expiry_date,
      cost_per_unit,
      supplier,
      supplier_sku,
      notes,
    } = body

    if (!product_id || quantity === undefined) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    // Check if inventory record exists
    const { data: existing } = await supabaseAdmin
      .from('inventory')
      .select('id, quantity')
      .eq('product_id', product_id)
      .eq('location', location || 'main')
      .eq('batch_number', batch_number || null)
      .single()

    let inventory
    if (existing) {
      // Update existing inventory
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({
          quantity: (existing.quantity || 0) + quantity,
          last_restocked_at: new Date().toISOString(),
          last_restocked_by: session.user.id,
          cost_per_unit,
          supplier,
          supplier_sku,
          notes,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }
      inventory = updated
    } else {
      // Create new inventory record
      const { data: created, error: createError } = await supabaseAdmin
        .from('inventory')
        .insert({
          product_id,
          quantity,
          location: location || 'main',
          batch_number,
          expiry_date,
          cost_per_unit,
          supplier,
          supplier_sku,
          notes,
          last_restocked_at: new Date().toISOString(),
          last_restocked_by: session.user.id,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }
      inventory = created
    }

    // Create inventory history record
    await supabaseAdmin.from('inventory_history').insert({
      inventory_id: inventory.id,
      product_id,
      change_type: 'restock',
      quantity_change: quantity,
      quantity_before: existing?.quantity || 0,
      quantity_after: inventory.quantity,
      notes: notes || 'Restock',
      created_by: session.user.id,
    })

    return NextResponse.json({ inventory }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Error in POST /api/products/inventory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
