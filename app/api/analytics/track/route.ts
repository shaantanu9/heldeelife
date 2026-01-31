import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      event_type,
      data,
      session_id,
      user_id,
      timestamp,
    } = body

    // Track different event types
    switch (event_type) {
      case 'product_view':
        // Track product view
        if (data.product_id) {
          await supabaseAdmin.from('product_views').insert({
            product_id: data.product_id,
            user_id: user_id || null,
            session_id: session_id || null,
            viewed_at: timestamp || new Date().toISOString(),
          })

          // Update product views count
          await supabaseAdmin.rpc('increment_product_views', {
            product_id_param: data.product_id,
          })
        }
        break

      case 'cart_add':
        // Track cart addition
        if (data.product_id) {
          await supabaseAdmin.from('cart_analytics').insert({
            product_id: data.product_id,
            user_id: user_id || null,
            session_id: session_id || null,
            added_at: timestamp || new Date().toISOString(),
          })
        }
        break

      case 'cart_remove':
        // Track cart removal
        if (data.product_id) {
          await supabaseAdmin
            .from('cart_analytics')
            .update({
              removed_at: timestamp || new Date().toISOString(),
            })
            .eq('product_id', data.product_id)
            .eq('session_id', session_id)
            .is('removed_at', null)
        }
        break

      case 'cart_abandoned':
        // Track cart abandonment
        // This is handled by the abandoned cart context
        break

      case 'purchase':
        // Track purchase - mark cart items as purchased
        if (data.order_id && data.items) {
          for (const item of data.items) {
            await supabaseAdmin
              .from('cart_analytics')
              .update({
                purchased_at: timestamp || new Date().toISOString(),
                order_id: data.order_id,
              })
              .eq('product_id', item.productId)
              .eq('session_id', session_id)
              .is('purchased_at', null)
          }
        }
        break

      case 'product_search':
        // Track search
        await supabaseAdmin.from('product_searches').insert({
          search_query: data.search_query,
          user_id: user_id || null,
          session_id: session_id || null,
          results_count: data.results_count || 0,
          searched_at: timestamp || new Date().toISOString(),
        })
        break

      default:
        // Unknown event type - just log it
        console.log('Unknown analytics event type:', event_type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking analytics event:', error)
    // Don't fail the request - analytics should be non-blocking
    return NextResponse.json({ success: false }, { status: 500 })
  }
}









