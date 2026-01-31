import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateDisplay, getCurrentDateForFilename } from './date'

export interface BillData {
  order: {
    id: string
    order_number: string
    created_at: string
    total_amount: number
    status: string
    payment_status: string
    payment_method: string
    shipping_address: {
      name: string
      email?: string
      phone?: string
      address_line1?: string
      address_line2?: string
      city?: string
      state?: string
      pincode?: string
    }
  }
  order_items: Array<{
    product_name: string
    product_sku?: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  companyInfo?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    gstin?: string
  }
}

/**
 * Generate PDF bill/invoice for an order
 */
export function generatePDFBill(data: BillData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Company Info (if provided)
  if (data.companyInfo) {
    if (data.companyInfo.name) {
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(data.companyInfo.name, margin, yPos)
      yPos += 10
    }

    if (data.companyInfo.address) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const addressLines = doc.splitTextToSize(
        data.companyInfo.address,
        pageWidth - 2 * margin
      )
      doc.text(addressLines, margin, yPos)
      yPos += addressLines.length * 5 + 5
    }

    if (data.companyInfo.phone || data.companyInfo.email) {
      const contactInfo = [
        data.companyInfo.phone && `Phone: ${data.companyInfo.phone}`,
        data.companyInfo.email && `Email: ${data.companyInfo.email}`,
      ]
        .filter(Boolean)
        .join(' | ')
      doc.text(contactInfo, margin, yPos)
      yPos += 10
    }

    if (data.companyInfo.gstin) {
      doc.text(`GSTIN: ${data.companyInfo.gstin}`, margin, yPos)
      yPos += 10
    }

    yPos += 5
  }

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' })
  yPos += 10

  // Order Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Order Number: ${data.order.order_number}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  )
  yPos += 5
  doc.text(
    `Date: ${formatDateDisplay(data.order.created_at)}`,
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
  doc.text(data.order.shipping_address.name || 'N/A', margin, yPos)
  yPos += 5

  if (data.order.shipping_address.email) {
    doc.text(`Email: ${data.order.shipping_address.email}`, margin, yPos)
    yPos += 5
  }

  if (data.order.shipping_address.phone) {
    doc.text(`Phone: ${data.order.shipping_address.phone}`, margin, yPos)
    yPos += 5
  }

  const addressParts = [
    data.order.shipping_address.address_line1,
    data.order.shipping_address.address_line2,
    data.order.shipping_address.city,
    data.order.shipping_address.state,
    data.order.shipping_address.pincode,
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
  const tableData = data.order_items.map((item) => [
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
    `Total Amount: Rs. ${data.order.total_amount.toFixed(2)}`,
    pageWidth - margin,
    finalY + 10,
    { align: 'right' }
  )

  // Payment Status
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Payment Status: ${data.order.payment_status.toUpperCase()}`,
    pageWidth - margin,
    finalY + 20,
    { align: 'right' }
  )
  doc.text(
    `Payment Method: ${data.order.payment_method.toUpperCase()}`,
    pageWidth - margin,
    finalY + 25,
    { align: 'right' }
  )
  doc.text(
    `Order Status: ${data.order.status.toUpperCase()}`,
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

  // Save PDF
  doc.save(
    `invoice_${data.order.order_number}_${getCurrentDateForFilename()}.pdf`
  )
}
