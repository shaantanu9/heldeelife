import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateDisplay, getCurrentDateForFilename } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Fetch order with items
    const { data: order, error } = await supabaseAdmin
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
      .eq('id', id)
      .single()

    if (error || !order) {
      console.error('Error fetching order:', error)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = margin

    // Company Info (you can customize this)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('HeldeeLife', margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('E-commerce Platform', margin, yPos)
    yPos += 10

    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' })
    yPos += 10

    // Order Details
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Order Number: ${order.order_number}`, pageWidth - margin, yPos, {
      align: 'right',
    })
    yPos += 5
    doc.text(
      `Date: ${formatDateDisplay(order.created_at)}`,
      pageWidth - margin,
      yPos,
      { align: 'right' }
    )
    yPos += 10

    // Billing Address
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(order.shipping_address?.name || 'N/A', margin, yPos)
    yPos += 5

    if (order.shipping_address?.email) {
      doc.text(`Email: ${order.shipping_address.email}`, margin, yPos)
      yPos += 5
    }

    if (order.shipping_address?.phone) {
      doc.text(`Phone: ${order.shipping_address.phone}`, margin, yPos)
      yPos += 5
    }

    const addressParts = [
      order.shipping_address?.address_line1,
      order.shipping_address?.address_line2,
      order.shipping_address?.city,
      order.shipping_address?.state,
      order.shipping_address?.pincode,
    ].filter(Boolean)

    if (addressParts.length > 0) {
      const addressText = addressParts.join(', ')
      const addressLines = doc.splitTextToSize(
        addressText,
        pageWidth - 2 * margin
      )
      doc.text(addressLines, margin, yPos)
      yPos += addressLines.length * 5 + 10
    } else {
      yPos += 5
    }

    // Order Items Table
    const tableData = (order.order_items || []).map((item: any) => [
      item.product_name,
      item.product_sku || 'N/A',
      item.quantity.toString(),
      `Rs. ${item.unit_price.toFixed(2)}`,
      `Rs. ${item.total_price.toFixed(2)}`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Product Name', 'SKU', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    })

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50

    // Total Amount
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `Total Amount: Rs. ${order.total_amount.toFixed(2)}`,
      pageWidth - margin,
      finalY + 10,
      { align: 'right' }
    )

    // Payment Status
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Payment Status: ${order.payment_status.toUpperCase()}`,
      pageWidth - margin,
      finalY + 20,
      { align: 'right' }
    )
    doc.text(
      `Payment Method: ${order.payment_method.toUpperCase()}`,
      pageWidth - margin,
      finalY + 25,
      { align: 'right' }
    )
    doc.text(
      `Order Status: ${order.status.toUpperCase()}`,
      pageWidth - margin,
      finalY + 30,
      {
        align: 'right',
      }
    )

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      'Thank you for your business!',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${order.order_number}_${getCurrentDateForFilename()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/export/orders/[id]/bill:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
