import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productIds, operation, data } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      )
    }

    let result

    switch (operation) {
      case 'activate':
        result = await supabaseAdmin
          .from('products')
          .update({ is_active: true, updated_by: session.user.id })
          .in('id', productIds)
        break

      case 'deactivate':
        result = await supabaseAdmin
          .from('products')
          .update({ is_active: false, updated_by: session.user.id })
          .in('id', productIds)
        break

      case 'feature':
        result = await supabaseAdmin
          .from('products')
          .update({ is_featured: true, updated_by: session.user.id })
          .in('id', productIds)
        break

      case 'unfeature':
        result = await supabaseAdmin
          .from('products')
          .update({ is_featured: false, updated_by: session.user.id })
          .in('id', productIds)
        break

      case 'delete':
        // Delete inventory first
        const { data: inventory } = await supabaseAdmin
          .from('inventory')
          .select('id')
          .in('product_id', productIds)

        if (inventory && inventory.length > 0) {
          const inventoryIds = inventory.map((inv) => inv.id)
          await supabaseAdmin.from('inventory').delete().in('id', inventoryIds)
        }

        result = await supabaseAdmin
          .from('products')
          .delete()
          .in('id', productIds)
        break

      case 'update_category':
        // Allow null to remove category
        result = await supabaseAdmin
          .from('products')
          .update({
            category_id: data?.category_id || null,
            updated_by: session.user.id,
          })
          .in('id', productIds)
        break

      case 'update_price':
        if (data?.price === undefined) {
          return NextResponse.json(
            { error: 'Price is required' },
            { status: 400 }
          )
        }
        result = await supabaseAdmin
          .from('products')
          .update({
            price: parseFloat(data.price),
            updated_by: session.user.id,
          })
          .in('id', productIds)
        break

      case 'update_inventory':
        if (data?.quantity === undefined) {
          return NextResponse.json(
            { error: 'Quantity is required' },
            { status: 400 }
          )
        }
        // Update or create inventory for each product
        const quantity = parseInt(data.quantity.toString())
        const location = data.location || 'main'

        for (const productId of productIds) {
          // Check if inventory exists
          const { data: existingInventory } = await supabaseAdmin
            .from('inventory')
            .select('id, quantity, reserved_quantity')
            .eq('product_id', productId)
            .eq('location', location)
            .maybeSingle()

          const reservedQty = existingInventory?.reserved_quantity || 0
          const availableQty = Math.max(0, quantity - reservedQty)

          if (existingInventory) {
            // Update existing inventory
            await supabaseAdmin
              .from('inventory')
              .update({
                quantity: quantity,
                available_quantity: availableQty,
              })
              .eq('id', existingInventory.id)
          } else {
            // Create new inventory
            await supabaseAdmin.from('inventory').insert({
              product_id: productId,
              quantity: quantity,
              available_quantity: availableQty,
              reserved_quantity: 0,
              location: location,
            })
          }
        }

        return NextResponse.json({
          message: `Inventory updated for ${productIds.length} products`,
          count: productIds.length,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    if (result.error) {
      console.error('Bulk operation error:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Operation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Operation '${operation}' completed successfully`,
      count: productIds.length,
    })
  } catch (error: any) {
    console.error('Error in bulk operations:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
