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
 * Export data to Excel file
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

/**
 * Export order items to Excel (detailed view)
 */
export function exportOrderItems(orders: any[]) {
  const exportData: any[] = []

  orders.forEach((order) => {
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item: any) => {
        exportData.push({
          'Order Number': order.order_number,
          'Product Name': item.product_name,
          SKU: item.product_sku || '',
          Quantity: item.quantity,
          'Unit Price': item.unit_price,
          'Total Price': item.total_price,
          'Order Date': formatDateDisplay(order.created_at),
          Status: order.status,
        })
      })
    } else {
      exportData.push({
        'Order Number': order.order_number,
        'Product Name': 'N/A',
        SKU: '',
        Quantity: 0,
        'Unit Price': 0,
        'Total Price': 0,
        'Order Date': formatDateDisplay(order.created_at),
        Status: order.status,
      })
    }
  })

  exportToExcel(exportData, {
    filename: `order_items_export_${getCurrentDateForFilename()}`,
    sheetName: 'Order Items',
  })
}
