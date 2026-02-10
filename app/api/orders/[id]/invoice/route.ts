import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET /api/orders/[id]/invoice - Generate and download invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orderId = id

    // Fetch order with items
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
          product_image,
          quantity,
          unit_price,
          total_price,
          discount_amount
        )
      `
      )
      .eq('id', orderId)

    // Users can only see their own orders
    if (session.user.role !== 'admin') {
      query = query.eq('user_id', session.user.id)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHTML(order)

    // Return HTML invoice (can be converted to PDF on client side or server side)
    // For now, return HTML that can be printed
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.order_number || orderId}.html"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/orders/[id]/invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(order: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: order.currency || 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const shippingAddress = order.shipping_address || {}
  const orderDate = formatDate(order.created_at)
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .company-info h1 {
      color: #ea580c;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      color: #333;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .invoice-info p {
      color: #666;
      font-size: 14px;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .detail-section h3 {
      color: #333;
      font-size: 16px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-section p {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #f9fafb;
    }
    th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #666;
    }
    tbody tr:hover {
      background: #f9fafb;
    }
    .text-right {
      text-align: right;
    }
    .summary {
      margin-top: 20px;
      margin-left: auto;
      width: 300px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #666;
    }
    .summary-row.total {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      border-top: 2px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 8px;
    }
    .summary-row.discount {
      color: #10b981;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-processing { background: #e9d5ff; color: #6b21a8; }
    .status-shipped { background: #e0e7ff; color: #3730a3; }
    .status-delivered { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>HeldeeLife</h1>
        <p>Your Health & Wellness Partner</p>
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${orderNumber}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
      </div>
    </div>

    <div class="details">
      <div class="detail-section">
        <h3>Bill To</h3>
        <p><strong>${shippingAddress.name || 'Customer'}</strong></p>
        <p>${shippingAddress.address || ''}</p>
        ${shippingAddress.addressLine2 ? `<p>${shippingAddress.addressLine2}</p>` : ''}
        <p>${[shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', ')}</p>
        ${shippingAddress.phone ? `<p>Phone: ${shippingAddress.phone}</p>` : ''}
      </div>
      <div class="detail-section">
        <h3>Shipping Address</h3>
        <p><strong>${shippingAddress.name || 'Customer'}</strong></p>
        <p>${shippingAddress.address || ''}</p>
        ${shippingAddress.addressLine2 ? `<p>${shippingAddress.addressLine2}</p>` : ''}
        <p>${[shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', ')}</p>
        ${shippingAddress.phone ? `<p>Phone: ${shippingAddress.phone}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${
          order.order_items
            ?.map(
              (item: any) => `
          <tr>
            <td><strong>${item.product_name}</strong></td>
            <td>${item.product_sku || 'N/A'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unit_price)}</td>
            <td class="text-right"><strong>${formatCurrency(item.total_price)}</strong></td>
          </tr>
        `
            )
            .join('') || ''
        }
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
      ${
        order.discount_amount > 0
          ? `
      <div class="summary-row discount">
        <span>Discount:</span>
        <span>-${formatCurrency(order.discount_amount)}</span>
      </div>
      `
          : ''
      }
      <div class="summary-row">
        <span>Tax:</span>
        <span>${formatCurrency(order.tax_amount)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>${order.shipping_amount > 0 ? formatCurrency(order.shipping_amount) : 'Free'}</span>
      </div>
      <div class="summary-row total">
        <span>Total:</span>
        <span>${formatCurrency(order.total_amount)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Payment Method: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
      ${order.tracking_number ? `<p>Tracking Number: ${order.tracking_number}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `
}









