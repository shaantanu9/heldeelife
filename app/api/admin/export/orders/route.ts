import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import {
  startOfDayUTC,
  endOfDayUTC,
  startOfMonthUTC,
  endOfMonthUTC,
  parseToUTC,
  formatDateDisplay,
  formatDateTimeDisplay,
  getCurrentDateForFilename,
} from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const productId = searchParams.get('product_id')
    const month = searchParams.get('month') // Format: YYYY-MM
    const day = searchParams.get('day') // Format: YYYY-MM-DD
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const search = searchParams.get('search') // Search by order number, customer name, email

    let query = supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
      )
    }

    // Apply date filters
    if (day) {
      const dayStart = startOfDayUTC(day)
      const dayEnd = endOfDayUTC(day)
      query = query
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
    } else if (month) {
      const monthStart = startOfMonthUTC(`${month}-01`)
      const monthEnd = endOfMonthUTC(`${month}-01`)
      query = query
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
    } else if (startDate && endDate) {
      query = query
        .gte('created_at', new Date(startDate).toISOString())
        .lte('created_at', new Date(endDate).toISOString())
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    let filteredOrders = orders || []

    // Apply product filter (filter by product_id in order_items)
    if (productId) {
      filteredOrders = filteredOrders.filter((order) =>
        order.order_items?.some((item: any) => item.product_id === productId)
      )
    }

    // Prepare Excel data
    const exportData = filteredOrders.map((order) => ({
      'Order Number': order.order_number,
      'Customer Name': order.customer_name || order.shipping_address?.name || 'N/A',
      'Customer Email': order.customer_email || order.shipping_address?.email || 'N/A',
      'Customer Phone': order.customer_phone || order.shipping_address?.phone || 'N/A',
      'Total Amount': order.total_amount,
      Status: order.status,
      'Payment Status': order.payment_status,
      'Payment Method': order.payment_method,
      'Items Count': order.order_items?.length || 0,
      'Order Date': formatDateDisplay(order.created_at),
      'Order Time': formatDateTimeDisplay(order.created_at, 'HH:mm:ss'),
      'Tracking Number': order.tracking_number || 'N/A',
      'Carrier': order.carrier || 'N/A',
      'Estimated Delivery': order.estimated_delivery
        ? formatDateDisplay(order.estimated_delivery)
        : 'N/A',
      Address: order.shipping_address
        ? `${order.shipping_address.address_line1 || ''} ${order.shipping_address.city || ''} ${order.shipping_address.state || ''} ${order.shipping_address.pincode || ''}`.trim()
        : 'N/A',
      'Subtotal': order.subtotal || 0,
      'Tax': order.tax_amount || 0,
      'Shipping': order.shipping_amount || 0,
      'Discount': order.discount_amount || 0,
      'Notes': order.notes || '',
    }))

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="orders_export_${getCurrentDateForFilename()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/export/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
