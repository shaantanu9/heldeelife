import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create template data with example row
    const templateData = [
      {
        name: 'Example Product',
        slug: 'example-product',
        price: '999.99',
        sku: 'SKU-001',
        category: 'Category Name',
        description: 'Full product description',
        short_description: 'Short description',
        image: 'https://example.com/image.jpg',
        images: 'https://example.com/img1.jpg,https://example.com/img2.jpg',
        is_active: 'true',
        is_featured: 'false',
        initial_quantity: '100',
        compare_at_price: '1299.99',
        cost_price: '500.00',
        manufacturer: 'Manufacturer Name',
        ingredients: 'Ingredient 1, Ingredient 2',
        usage_instructions: 'How to use this product',
        storage_instructions: 'Storage requirements',
        expiry_info: '24 months from manufacture',
        meta_title: 'SEO Title',
        meta_description: 'SEO Description',
      },
    ]

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    // Add instructions sheet
    const instructions = [
      {
        Field: 'name',
        Required: 'Yes',
        Description: 'Product name (required)',
        Example: 'Example Product',
      },
      {
        Field: 'slug',
        Required: 'No',
        Description: 'URL-friendly identifier (auto-generated if empty)',
        Example: 'example-product',
      },
      {
        Field: 'price',
        Required: 'Yes',
        Description: 'Product price in decimal format',
        Example: '999.99',
      },
      {
        Field: 'sku',
        Required: 'No',
        Description: 'Stock Keeping Unit',
        Example: 'SKU-001',
      },
      {
        Field: 'category',
        Required: 'No',
        Description: 'Category name (must match existing category)',
        Example: 'Category Name',
      },
      {
        Field: 'description',
        Required: 'No',
        Description: 'Full product description',
        Example: 'Full product description',
      },
      {
        Field: 'short_description',
        Required: 'No',
        Description: 'Brief description for listings',
        Example: 'Short description',
      },
      {
        Field: 'image',
        Required: 'No',
        Description: 'Main product image URL',
        Example: 'https://example.com/image.jpg',
      },
      {
        Field: 'images',
        Required: 'No',
        Description: 'Additional images (comma-separated URLs)',
        Example: 'https://example.com/img1.jpg,https://example.com/img2.jpg',
      },
      {
        Field: 'is_active',
        Required: 'No',
        Description: 'Product active status (true/false, default: true)',
        Example: 'true',
      },
      {
        Field: 'is_featured',
        Required: 'No',
        Description: 'Featured product (true/false, default: false)',
        Example: 'false',
      },
      {
        Field: 'initial_quantity',
        Required: 'No',
        Description: 'Initial stock quantity',
        Example: '100',
      },
      {
        Field: 'compare_at_price',
        Required: 'No',
        Description: 'Original/compare price',
        Example: '1299.99',
      },
      {
        Field: 'cost_price',
        Required: 'No',
        Description: 'Cost price for profit calculation',
        Example: '500.00',
      },
      {
        Field: 'manufacturer',
        Required: 'No',
        Description: 'Manufacturer name',
        Example: 'Manufacturer Name',
      },
      {
        Field: 'ingredients',
        Required: 'No',
        Description: 'Product ingredients',
        Example: 'Ingredient 1, Ingredient 2',
      },
      {
        Field: 'usage_instructions',
        Required: 'No',
        Description: 'How to use the product',
        Example: 'How to use this product',
      },
      {
        Field: 'storage_instructions',
        Required: 'No',
        Description: 'Storage requirements',
        Example: 'Storage requirements',
      },
      {
        Field: 'expiry_info',
        Required: 'No',
        Description: 'Expiry information',
        Example: '24 months from manufacture',
      },
      {
        Field: 'meta_title',
        Required: 'No',
        Description: 'SEO meta title',
        Example: 'SEO Title',
      },
      {
        Field: 'meta_description',
        Required: 'No',
        Description: 'SEO meta description',
        Example: 'SEO Description',
      },
    ]

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

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
        'Content-Disposition':
          'attachment; filename="product_import_template.xlsx"',
      },
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: 500 }
    )
  }
}









