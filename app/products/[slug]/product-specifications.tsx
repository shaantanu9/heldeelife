'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

interface ProductSpecificationsProps {
  product: {
    sku?: string | null
    manufacturer?: string | null
    expiry_info?: string | null
    weight?: number | null
    dimensions?: any
    ingredients?: string | null
    usage_instructions?: string | null
    storage_instructions?: string | null
    benefits?: string[] | null
    tags?: string[] | null
  }
}

export function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const specifications: Array<{
    label: string
    value: string | number | null | undefined
  }> = []

  // Add specifications if they exist
  if (product.sku) {
    specifications.push({ label: 'SKU', value: product.sku })
  }

  if (product.manufacturer) {
    specifications.push({ label: 'Manufacturer', value: product.manufacturer })
  }

  if (product.expiry_info) {
    specifications.push({
      label: 'Expiry Information',
      value: product.expiry_info,
    })
  }

  if (product.weight) {
    specifications.push({ label: 'Weight', value: `${product.weight} g` })
  }

  if (product.dimensions) {
    const dims =
      typeof product.dimensions === 'string'
        ? product.dimensions
        : product.dimensions?.length
          ? `${product.dimensions.length} × ${product.dimensions.width || 'N/A'} × ${product.dimensions.height || 'N/A'} cm`
          : null
    if (dims) {
      specifications.push({ label: 'Dimensions', value: dims })
    }
  }

  if (product.ingredients) {
    specifications.push({ label: 'Ingredients', value: product.ingredients })
  }

  if (product.usage_instructions) {
    specifications.push({
      label: 'Usage Instructions',
      value: product.usage_instructions,
    })
  }

  if (product.storage_instructions) {
    specifications.push({
      label: 'Storage Instructions',
      value: product.storage_instructions,
    })
  }

  if (product.tags && product.tags.length > 0) {
    specifications.push({
      label: 'Tags',
      value: product.tags.join(', '),
    })
  }

  // Don't render if no specifications
  if (specifications.length === 0) {
    return null
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Product Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {specifications.map((spec, index) => (
              <TableRow key={index} className="border-gray-200">
                <TableCell className="font-semibold text-gray-900 w-1/3">
                  {spec.label}
                </TableCell>
                <TableCell className="text-gray-600">
                  {spec.value || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}









