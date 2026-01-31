# Excel and PDF Export Functionality Guide

This guide explains how to implement Excel and PDF export functionality in a Next.js application with proper date/time synchronization using dayjs.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Date/Time Setup with dayjs](#datetime-setup-with-dayjs)
4. [Excel Export Implementation](#excel-export-implementation)
5. [PDF Export Implementation](#pdf-export-implementation)
6. [API Routes Setup](#api-routes-setup)
7. [Frontend Integration](#frontend-integration)
8. [Complete Examples](#complete-examples)
9. [Best Practices](#best-practices)

---

## Overview

This implementation provides:

- **Excel Export**: Export data to `.xlsx` files with proper formatting
- **PDF Export**: Generate professional invoices/bills as PDF files
- **Date/Time Sync**: Consistent date handling using dayjs with UTC and timezone support
- **Filtering**: Export filtered data based on user selections
- **Server-side Generation**: Secure export generation on the server

---

## Installation

### Required Packages

```bash
npm install xlsx jspdf jspdf-autotable dayjs
```

### Package Descriptions

- **xlsx**: Library for reading and writing Excel files
- **jspdf**: PDF generation library
- **jspdf-autotable**: Plugin for creating tables in PDFs
- **dayjs**: Lightweight date library with UTC and timezone support

---

## Date/Time Setup with dayjs

### Step 1: Create Date Utility File

Create `lib/utils/date.ts`:

```typescript
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

// Set default timezone (change to your preferred timezone)
const DEFAULT_TIMEZONE = 'Asia/Kolkata' // or "America/New_York", "Europe/London", etc.

/**
 * Format date in UTC
 */
export function formatUTC(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD'
): string {
  return dayjs.utc(date).format(format)
}

/**
 * Format date in local timezone
 */
export function formatLocal(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return dayjs.utc(date).tz(timezone).format(format)
}

/**
 * Get start of day in UTC
 */
export function startOfDayUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.startOf('day')
}

/**
 * Get end of day in UTC
 */
export function endOfDayUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.endOf('day')
}

/**
 * Get start of month in UTC
 */
export function startOfMonthUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.startOf('month')
}

/**
 * Get end of month in UTC
 */
export function endOfMonthUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.endOf('month')
}

/**
 * Format date for display (localized)
 */
export function formatDateDisplay(
  date: string | number | Date,
  format: string = 'DD/MM/YYYY',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatLocal(date, format, timezone)
}

/**
 * Format date and time for display (localized)
 */
export function formatDateTimeDisplay(
  date: string | number | Date,
  format: string = 'DD/MM/YYYY HH:mm:ss',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatLocal(date, format, timezone)
}

/**
 * Get current date formatted for filename
 */
export function getCurrentDateForFilename(): string {
  return dayjs.utc().format('YYYY-MM-DD')
}

export default dayjs
```

### Why Use dayjs with UTC?

1. **Consistency**: All dates stored in UTC in the database
2. **Timezone Support**: Convert to any timezone for display
3. **No Timezone Issues**: Avoids daylight saving time problems
4. **Lightweight**: Much smaller than moment.js
5. **Immutable**: Prevents accidental date mutations

---

## Excel Export Implementation

### Step 1: Create Excel Export Utility

Create `lib/utils/excel-export.ts`:

```typescript
import * as XLSX from 'xlsx'
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  getCurrentDateForFilename,
} from './date'

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
}

/**
 * Generic function to export data to Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExcelExportOptions = {}
): void {
  const { filename = 'export', sheetName = 'Sheet1' } = options

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generate Excel file and download
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export products to Excel
 */
export function exportProducts(products: any[]) {
  const exportData = products.map((product) => ({
    'Product Name': product.name,
    SKU: product.sku || '',
    Price: product.price,
    Category: product.product_categories?.name || 'Uncategorized',
    Status: product.is_active ? 'Active' : 'Inactive',
    Featured: product.is_featured ? 'Yes' : 'No',
    'Created At': formatDateDisplay(product.created_at),
  }))

  exportToExcel(exportData, {
    filename: `products_export_${getCurrentDateForFilename()}`,
    sheetName: 'Products',
  })
}

/**
 * Export orders to Excel
 */
export function exportOrders(orders: any[]) {
  const exportData = orders.map((order) => ({
    'Order Number': order.order_number,
    'Customer Name': order.shipping_address?.name || 'N/A',
    'Customer Email': order.shipping_address?.email || 'N/A',
    'Customer Phone': order.shipping_address?.phone || 'N/A',
    'Total Amount': order.total_amount,
    Status: order.status,
    'Payment Status': order.payment_status,
    'Payment Method': order.payment_method,
    'Items Count': order.order_items?.length || 0,
    'Order Date': formatDateDisplay(order.created_at),
    'Order Time': formatDateTimeDisplay(order.created_at, 'HH:mm:ss'),
    Address: order.shipping_address
      ? `${order.shipping_address.address_line1 || ''} ${order.shipping_address.city || ''} ${order.shipping_address.state || ''} ${order.shipping_address.pincode || ''}`.trim()
      : 'N/A',
  }))

  exportToExcel(exportData, {
    filename: `orders_export_${getCurrentDateForFilename()}`,
    sheetName: 'Orders',
  })
}
```

### Step 2: Create API Route for Excel Export

Create `app/api/admin/export/products/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server' // or your database client
import * as XLSX from 'xlsx'
import { formatDateDisplay, getCurrentDateForFilename } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const active = searchParams.get('active')

    // Build your query with filters
    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        product_categories (
          id,
          name,
          slug
        )
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (active === 'false') {
      query = query.eq('is_active', false)
    } else if (active !== 'all') {
      query = query.eq('is_active', true)
    }

    if (category) {
      // Add category filter logic
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Prepare Excel data
    const exportData = (products || []).map((product) => ({
      'Product Name': product.name,
      SKU: product.sku || '',
      Price: product.price,
      Category: product.product_categories?.name || 'Uncategorized',
      'Stock Quantity': product.stock || 0,
      Status: product.is_active ? 'Active' : 'Inactive',
      Featured: product.is_featured ? 'Yes' : 'No',
      'Created At': formatDateDisplay(product.created_at),
    }))

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

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
        'Content-Disposition': `attachment; filename="products_export_${getCurrentDateForFilename()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/export/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 3: Frontend Integration for Excel Export

In your React component:

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getCurrentDateForFilename } from "@/lib/utils/date"

export function ProductsClient() {
  const handleExport = async () => {
    try {
      // Build query params if you have filters
      const params = new URLSearchParams()
      // params.append("category", selectedCategory)
      // params.append("status", selectedStatus)

      const queryString = params.toString()
      const url = `/api/admin/export/products${queryString ? `?${queryString}` : ""}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to export products")

      // Create blob and download
      const blob = await response.blob()
      const url_blob = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url_blob
      a.download = `products_export_${getCurrentDateForFilename()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url_blob)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting products:", error)
      alert("Failed to export products")
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
    </div>
  )
}
```

---

## PDF Export Implementation

### Step 1: Create PDF Utility

Create `lib/utils/pdf-bill.ts`:

```typescript
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
    }, // Orange theme
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
```

### Step 2: Create API Route for PDF Export

Create `app/api/admin/export/orders/[id]/bill/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server' // or your database client
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateDisplay, getCurrentDateForFilename } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
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

    // Company Info
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Your Company Name', margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Your Company Address', margin, yPos)
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
```

### Step 3: Frontend Integration for PDF Export

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { getCurrentDateForFilename } from "@/lib/utils/date"

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const handleGenerateBill = async () => {
    try {
      const response = await fetch(`/api/admin/export/orders/${orderId}/bill`)
      if (!response.ok) throw new Error("Failed to generate bill")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice_${orderNumber}_${getCurrentDateForFilename()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error generating bill:", error)
      alert("Failed to generate bill")
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={handleGenerateBill}>
        <FileText className="h-4 w-4 mr-2" />
        Generate Bill (PDF)
      </Button>
    </div>
  )
}
```

---

## Advanced Filtering with Date Ranges

### Example: Orders Export with Date Filters

Create `app/api/admin/export/orders/route.ts`:

```typescript
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
    const productId = searchParams.get('product_id')
    const month = searchParams.get('month') // Format: YYYY-MM
    const day = searchParams.get('day') // Format: YYYY-MM-DD

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
      'Customer Name': order.shipping_address?.name || 'N/A',
      'Customer Email': order.shipping_address?.email || 'N/A',
      'Customer Phone': order.shipping_address?.phone || 'N/A',
      'Total Amount': order.total_amount,
      Status: order.status,
      'Payment Status': order.payment_status,
      'Payment Method': order.payment_method,
      'Items Count': order.order_items?.length || 0,
      'Order Date': formatDateDisplay(order.created_at),
      'Order Time': formatDateTimeDisplay(order.created_at, 'HH:mm:ss'),
      Address: order.shipping_address
        ? `${order.shipping_address.address_line1 || ''} ${order.shipping_address.city || ''} ${order.shipping_address.state || ''} ${order.shipping_address.pincode || ''}`.trim()
        : 'N/A',
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
```

### Frontend with Filters

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download } from "lucide-react"
import { getCurrentDateForFilename } from "@/lib/utils/date"

export function OrdersClient() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [productFilter, setProductFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("")
  const [dayFilter, setDayFilter] = useState<string>("")

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams()

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (productFilter !== "all") {
        params.append("product_id", productFilter)
      }
      if (monthFilter) {
        params.append("month", monthFilter)
      }
      if (dayFilter) {
        params.append("day", dayFilter)
      }

      const queryString = params.toString()
      const url = `/api/admin/export/orders${queryString ? `?${queryString}` : ""}`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to export orders")

      const blob = await response.blob()
      const url_blob = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url_blob
      a.download = `orders_export_${getCurrentDateForFilename()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url_blob)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting orders:", error)
      alert("Failed to export orders")
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="month">Month (YYYY-MM)</Label>
          <Input
            id="month"
            type="month"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value)
              setDayFilter("") // Clear day filter when month is set
            }}
          />
        </div>

        <div>
          <Label htmlFor="day">Day (YYYY-MM-DD)</Label>
          <Input
            id="day"
            type="date"
            value={dayFilter}
            onChange={(e) => {
              setDayFilter(e.target.value)
              setMonthFilter("") // Clear month filter when day is set
            }}
          />
        </div>
      </div>

      <Button variant="outline" onClick={handleExportExcel}>
        <Download className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
    </div>
  )
}
```

---

## Best Practices

### 1. Always Use UTC for Database Storage

```typescript
// ✅ Good: Store in UTC
const createdAt = dayjs.utc().toISOString()

// ❌ Bad: Store in local time
const createdAt = new Date().toISOString() // May have timezone issues
```

### 2. Format Dates for Display Only

```typescript
// ✅ Good: Format for display
const displayDate = formatDateDisplay(order.created_at, 'DD/MM/YYYY')

// ❌ Bad: Store formatted dates
const storedDate = '25/12/2023' // Loses timezone info
```

### 3. Use Consistent Date Formats

```typescript
// ✅ Good: Use utility functions
formatDateDisplay(date) // DD/MM/YYYY
formatDateTimeDisplay(date) // DD/MM/YYYY HH:mm:ss
getCurrentDateForFilename() // YYYY-MM-DD

// ❌ Bad: Inconsistent formatting
new Date().toLocaleDateString() // Different formats in different browsers
```

### 4. Handle Large Datasets

```typescript
// For large exports, consider pagination or streaming
export async function GET(request: NextRequest) {
  // Limit export size
  const limit = 10000
  const query = supabaseAdmin.from('orders').select('*').limit(limit)

  // Or implement pagination
  // Or use streaming for very large files
}
```

### 5. Error Handling

```typescript
// Always handle errors gracefully
try {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  // ... handle success
} catch (error) {
  console.error('Export failed:', error)
  // Show user-friendly error message
  toast.error('Failed to export. Please try again.')
}
```

### 6. Security

```typescript
// Always check authentication and authorization
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... proceed with export
}
```

### 7. File Naming

```typescript
// Use consistent, descriptive filenames
const filename = `orders_export_${getCurrentDateForFilename()}.xlsx`
// Result: orders_export_2024-01-15.xlsx

// Include relevant identifiers
const filename = `invoice_${order.order_number}_${getCurrentDateForFilename()}.pdf`
// Result: invoice_ORD-12345_2024-01-15.pdf
```

---

## Common Issues and Solutions

### Issue 1: Timezone Mismatches

**Problem**: Dates showing incorrect times in exports

**Solution**: Always use UTC for storage and convert to local timezone for display

```typescript
// Store in UTC
const createdAt = dayjs.utc().toISOString()

// Display in local timezone
const displayDate = formatDateDisplay(
  createdAt,
  'DD/MM/YYYY HH:mm',
  'Asia/Kolkata'
)
```

### Issue 2: Large File Downloads

**Problem**: Browser timeout for large exports

**Solution**: Implement pagination or streaming

```typescript
// Option 1: Limit export size
const MAX_EXPORT_SIZE = 10000

// Option 2: Use streaming (for very large files)
// Consider using server-sent events or WebSockets
```

### Issue 3: Memory Issues

**Problem**: Running out of memory with large datasets

**Solution**: Process data in chunks

```typescript
// Process in batches
const BATCH_SIZE = 1000
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  const batch = data.slice(i, i + BATCH_SIZE)
  // Process batch
}
```

### Issue 4: PDF Layout Issues

**Problem**: Content overflowing pages

**Solution**: Check page height and add new pages

```typescript
// Check if content fits on page
if (yPos > doc.internal.pageSize.getHeight() - 50) {
  doc.addPage()
  yPos = margin
}
```

---

## Testing

### Test Excel Export

```typescript
// Test export functionality
test('exports products to Excel', async () => {
  const response = await fetch('/api/admin/export/products')
  expect(response.ok).toBe(true)
  expect(response.headers.get('content-type')).toBe(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
})
```

### Test PDF Export

```typescript
// Test PDF generation
test('generates PDF bill', async () => {
  const response = await fetch('/api/admin/export/orders/123/bill')
  expect(response.ok).toBe(true)
  expect(response.headers.get('content-type')).toBe('application/pdf')
})
```

---

## Summary

This guide provides a complete implementation of Excel and PDF export functionality in Next.js with:

1. ✅ Proper date/time handling with dayjs and UTC
2. ✅ Server-side export generation for security
3. ✅ Filtering capabilities
4. ✅ Professional PDF invoice generation
5. ✅ Excel export with proper formatting
6. ✅ Error handling and security checks

Follow this guide to implement export functionality in any Next.js application!

