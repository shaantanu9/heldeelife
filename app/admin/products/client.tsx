'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Download,
  X,
  Link2,
  Upload,
  FileSpreadsheet,
  CheckSquare,
  Square,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ImageUpload } from '@/components/ui/image-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  sku: string
  is_active: boolean
  is_featured: boolean
  product_categories?: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface BlogPost {
  id: string
  title: string
  slug: string
}

interface BlogLink {
  type: 'internal' | 'external'
  url: string
  title?: string
}

interface FAQ {
  question: string
  answer: string
}

export function AdminProductsClient() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState('essential')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  )
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkOperating, setBulkOperating] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [bulkCategoryDialog, setBulkCategoryDialog] = useState(false)
  const [bulkPriceDialog, setBulkPriceDialog] = useState(false)
  const [bulkInventoryDialog, setBulkInventoryDialog] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkQuantity, setBulkQuantity] = useState('')
  const [importResults, setImportResults] = useState<any>(null)
  const [showImportResults, setShowImportResults] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    sku: '',
    description: '',
    short_description: '',
    category_id: '',
    image: '',
    images: [] as string[],
    benefits: [] as string[],
    newBenefit: '',
    newImageUrl: '',
    ingredients: '',
    usage_instructions: '',
    storage_instructions: '',
    expiry_info: '',
    manufacturer: '',
    initial_quantity: '0',
    is_active: true,
    is_featured: false,
    // SEO fields
    meta_title: '',
    meta_description: '',
    meta_keywords: [] as string[],
    newKeyword: '',
    // Blog links
    blog_links: [] as BlogLink[],
    newBlogLink: {
      type: 'internal' as 'internal' | 'external',
      url: '',
      title: '',
    },
    // FAQ
    faq: [] as FAQ[],
    newFAQ: { question: '', answer: '' },
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBlogPosts()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories?active=false')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts?status=published&limit=100')
      const data = await response.json()
      setBlogPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)

      // Validate required fields
      if (!formData.name || !formData.price) {
        toast.error('Name and price are required')
        return
      }

      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const productPayload = {
        name: formData.name,
        slug:
          formData.slug ||
          formData.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
        price: parseFloat(formData.price),
        sku: formData.sku || undefined,
        description: formData.description || undefined,
        short_description: formData.short_description || undefined,
        category_id: formData.category_id || undefined,
        image: formData.image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        benefits: formData.benefits.length > 0 ? formData.benefits : undefined,
        ingredients: formData.ingredients || undefined,
        usage_instructions: formData.usage_instructions || undefined,
        storage_instructions: formData.storage_instructions || undefined,
        expiry_info: formData.expiry_info || undefined,
        manufacturer: formData.manufacturer || undefined,
        // SEO fields
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        meta_keywords:
          formData.meta_keywords.length > 0
            ? formData.meta_keywords
            : undefined,
        // Blog links
        blog_links:
          formData.blog_links.length > 0 ? formData.blog_links : undefined,
        // FAQ
        faq: formData.faq.length > 0 ? formData.faq : undefined,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to save product' }))
        throw new Error(errorData.error || 'Failed to save product')
      }

      const data = await response.json()
      const productId = data.product?.id

      // If creating new product and initial quantity is provided, create inventory entry
      if (
        !editingProduct &&
        productId &&
        formData.initial_quantity &&
        parseInt(formData.initial_quantity) > 0
      ) {
        try {
          await fetch('/api/products/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              quantity: parseInt(formData.initial_quantity),
              location: 'main',
            }),
          })
        } catch (inventoryError) {
          console.error('Error creating inventory:', inventoryError)
          // Don't fail the whole operation if inventory creation fails
          toast.warning('Product created but failed to set initial inventory')
        }
      }

      toast.success(
        editingProduct
          ? 'Product updated successfully'
          : 'Product created successfully'
      )
      setIsDialogOpen(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      price: '',
      sku: '',
      description: '',
      short_description: '',
      category_id: '',
      image: '',
      images: [],
      benefits: [],
      newBenefit: '',
      newImageUrl: '',
      ingredients: '',
      usage_instructions: '',
      storage_instructions: '',
      expiry_info: '',
      manufacturer: '',
      initial_quantity: '0',
      is_active: true,
      is_featured: false,
      meta_title: '',
      meta_description: '',
      meta_keywords: [],
      newKeyword: '',
      blog_links: [],
      newBlogLink: { type: 'internal', url: '', title: '' },
      faq: [],
      newFAQ: { question: '', answer: '' },
    })
    setActiveTab('essential')
  }

  const addBenefit = () => {
    if (formData.newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, formData.newBenefit.trim()],
        newBenefit: '',
      })
    }
  }

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    })
  }

  const addImageUrl = (url: string) => {
    if (url && !formData.images.includes(url)) {
      setFormData({
        ...formData,
        images: [...formData.images, url],
      })
    }
  }

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    })
  }

  const addKeyword = () => {
    if (formData.newKeyword.trim()) {
      setFormData({
        ...formData,
        meta_keywords: [...formData.meta_keywords, formData.newKeyword.trim()],
        newKeyword: '',
      })
    }
  }

  const removeKeyword = (index: number) => {
    setFormData({
      ...formData,
      meta_keywords: formData.meta_keywords.filter((_, i) => i !== index),
    })
  }

  const addBlogLink = () => {
    if (formData.newBlogLink.url.trim()) {
      const link: BlogLink = {
        type: formData.newBlogLink.type,
        url: formData.newBlogLink.url.trim(),
        title: formData.newBlogLink.title.trim() || undefined,
      }
      setFormData({
        ...formData,
        blog_links: [...formData.blog_links, link],
        newBlogLink: { type: 'internal', url: '', title: '' },
      })
    }
  }

  const removeBlogLink = (index: number) => {
    setFormData({
      ...formData,
      blog_links: formData.blog_links.filter((_, i) => i !== index),
    })
  }

  const addFAQ = () => {
    if (formData.newFAQ.question.trim() && formData.newFAQ.answer.trim()) {
      setFormData({
        ...formData,
        faq: [...formData.faq, { ...formData.newFAQ }],
        newFAQ: { question: '', answer: '' },
      })
    }
  }

  const removeFAQ = (index: number) => {
    setFormData({
      ...formData,
      faq: formData.faq.filter((_, i) => i !== index),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    if (deleting === id) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete product')

      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = async () => {
    if (exporting) return

    try {
      setExporting(true)
      const response = await fetch('/api/admin/export/products')
      if (!response.ok) throw new Error('Failed to export products')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `products_export_${
        new Date().toISOString().split('T')[0]
      }.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Products exported successfully')
    } catch (error) {
      console.error('Error exporting products:', error)
      toast.error('Failed to export products')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/products/template')
      if (!response.ok) throw new Error('Failed to download template')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Template downloaded successfully')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  const handleBulkImport = async () => {
    if (!importFile || bulkImporting) return

    try {
      setBulkImporting(true)
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/admin/products/bulk-import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import products')
      }

      const result = await response.json()

      // Store results for detailed view
      setImportResults(result.results)

      if (result.results.errors.length > 0) {
        toast.warning(
          `Import completed with ${result.results.errors.length} error(s). Click to view details.`,
          {
            action: {
              label: 'View Details',
              onClick: () => setShowImportResults(true),
            },
          }
        )
      } else {
        toast.success(
          `Successfully imported ${result.results.success.length} product(s)`
        )
      }

      setIsBulkImportOpen(false)
      setImportFile(null)

      // Show results dialog if there are errors
      if (result.results.errors.length > 0) {
        setShowImportResults(true)
      } else {
        // Only refresh if no errors to show
        fetchProducts()
      }
    } catch (error: any) {
      console.error('Error importing products:', error)
      toast.error(error.message || 'Failed to import products')
    } finally {
      setBulkImporting(false)
    }
  }

  const handleBulkOperation = async (operation: string, data?: any) => {
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product')
      return
    }

    if (bulkOperating) return

    // Confirm destructive operations
    if (operation === 'delete') {
      if (
        !confirm(
          `Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`
        )
      ) {
        return
      }
    }

    try {
      setBulkOperating(true)
      const response = await fetch('/api/admin/products/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
          operation,
          data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Operation failed')
      }

      const result = await response.json()
      toast.success(result.message || 'Operation completed successfully')
      setSelectedProducts(new Set())
      // Small delay to show the success message before refreshing
      setTimeout(() => {
        fetchProducts()
      }, 500)
    } catch (error: any) {
      console.error('Error performing bulk operation:', error)
      toast.error(error.message || 'Operation failed')
    } finally {
      setBulkOperating(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)))
    }
  }

  const handleEdit = async (product: Product) => {
    setEditingProduct(product)

    // Fetch full product details
    try {
      const response = await fetch(`/api/products/${product.id}`)
      const data = await response.json()
      const fullProduct = data.product

      setFormData({
        name: fullProduct.name || product.name,
        slug: fullProduct.slug || product.slug,
        price: fullProduct.price?.toString() || product.price.toString(),
        sku: fullProduct.sku || '',
        description: fullProduct.description || '',
        short_description: fullProduct.short_description || '',
        category_id: fullProduct.category_id || '',
        image: fullProduct.image || '',
        images: fullProduct.images || [],
        benefits: fullProduct.benefits || [],
        newBenefit: '',
        newImageUrl: '',
        ingredients: fullProduct.ingredients || '',
        usage_instructions: fullProduct.usage_instructions || '',
        storage_instructions: fullProduct.storage_instructions || '',
        expiry_info: fullProduct.expiry_info || '',
        manufacturer: fullProduct.manufacturer || '',
        initial_quantity: '0',
        is_active: fullProduct.is_active ?? product.is_active,
        is_featured: fullProduct.is_featured ?? product.is_featured,
        meta_title: fullProduct.meta_title || '',
        meta_description: fullProduct.meta_description || '',
        meta_keywords: fullProduct.meta_keywords || [],
        newKeyword: '',
        blog_links: fullProduct.blog_links || [],
        newBlogLink: { type: 'internal', url: '', title: '' },
        faq: fullProduct.faq || [],
        newFAQ: { question: '', answer: '' },
      })
    } catch (error) {
      console.error('Error fetching product details:', error)
      // Fallback to basic product data
      setFormData({
        name: product.name,
        slug: product.slug,
        price: product.price.toString(),
        sku: product.sku || '',
        description: '',
        short_description: '',
        category_id: '',
        image: '',
        images: [],
        benefits: [],
        newBenefit: '',
        newImageUrl: '',
        ingredients: '',
        usage_instructions: '',
        storage_instructions: '',
        expiry_info: '',
        manufacturer: '',
        initial_quantity: '0',
        is_active: product.is_active,
        is_featured: product.is_featured,
        meta_title: '',
        meta_description: '',
        meta_keywords: [],
        newKeyword: '',
        blog_links: [],
        newBlogLink: { type: 'internal', url: '', title: '' },
        faq: [],
        newFAQ: { question: '', answer: '' },
      })
    }

    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Product <span className="text-orange-600">Management</span>
        </h1>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProducts(new Set())}
              className="text-gray-600"
            >
              Clear Selection ({selectedProducts.size})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={selectedProducts.size === 0 || bulkOperating}
              >
                {bulkOperating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Bulk Actions ({selectedProducts.size})
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkOperation('activate')}>
                Activate Selected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkOperation('deactivate')}
              >
                Deactivate Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkOperation('feature')}>
                Mark as Featured
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkOperation('unfeature')}
              >
                Remove Featured
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBulkCategoryDialog(true)}>
                Update Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkPriceDialog(true)}>
                Update Price
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkInventoryDialog(true)}>
                Update Inventory
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBulkOperation('delete')}
                className="text-red-600"
              >
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </>
            )}
          </Button>
          <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setIsBulkImportOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Products</DialogTitle>
                <DialogDescription>
                  Upload an Excel file to import multiple products at once.
                  Download the template first to see the required format.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file">
                    Select Excel File (.xlsx, .xls)
                  </Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Validate file type
                        const validTypes = [
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'application/vnd.ms-excel',
                        ]
                        const validExtensions = ['.xlsx', '.xls']
                        const fileExtension = file.name
                          .substring(file.name.lastIndexOf('.'))
                          .toLowerCase()

                        if (
                          !validTypes.includes(file.type) &&
                          !validExtensions.includes(fileExtension)
                        ) {
                          toast.error(
                            'Invalid file type. Please upload an Excel file (.xlsx or .xls)'
                          )
                          e.target.value = ''
                          return
                        }

                        // Validate file size (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error(
                            'File size too large. Maximum size is 10MB'
                          )
                          e.target.value = ''
                          return
                        }

                        setImportFile(file)
                        toast.info(`File selected: ${file.name}`)
                      }
                    }}
                  />
                  {importFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {importFile.name} (
                      {(importFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    onClick={handleBulkImport}
                    disabled={!importFile || bulkImporting}
                    className="flex-1"
                  >
                    {bulkImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Products
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Category Update Dialog */}
          <Dialog
            open={bulkCategoryDialog}
            onOpenChange={setBulkCategoryDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Category for Selected Products</DialogTitle>
                <DialogDescription>
                  Select a category to assign to {selectedProducts.size}{' '}
                  selected product(s)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-category">Category</Label>
                  <Select
                    value={bulkCategoryId}
                    onValueChange={setBulkCategoryId}
                  >
                    <SelectTrigger id="bulk-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Remove Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkCategoryDialog(false)
                      setBulkCategoryId('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleBulkOperation('update_category', {
                        category_id:
                          bulkCategoryId === 'none' ? null : bulkCategoryId,
                      })
                      setBulkCategoryDialog(false)
                      setBulkCategoryId('')
                    }}
                    disabled={!bulkCategoryId}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Price Update Dialog */}
          <Dialog open={bulkPriceDialog} onOpenChange={setBulkPriceDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Price for Selected Products</DialogTitle>
                <DialogDescription>
                  Set a new price for {selectedProducts.size} selected
                  product(s)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-price">New Price (Rs.)</Label>
                  <Input
                    id="bulk-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Enter new price"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkPriceDialog(false)
                      setBulkPrice('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (bulkPrice) {
                        handleBulkOperation('update_price', {
                          price: bulkPrice,
                        })
                        setBulkPriceDialog(false)
                        setBulkPrice('')
                      }
                    }}
                    disabled={!bulkPrice || parseFloat(bulkPrice) < 0}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Inventory Update Dialog */}
          <Dialog
            open={bulkInventoryDialog}
            onOpenChange={setBulkInventoryDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Update Inventory for Selected Products
                </DialogTitle>
                <DialogDescription>
                  Set inventory quantity for {selectedProducts.size} selected
                  product(s)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-quantity">Quantity</Label>
                  <Input
                    id="bulk-quantity"
                    type="number"
                    min="0"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkInventoryDialog(false)
                      setBulkQuantity('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (bulkQuantity) {
                        handleBulkOperation('update_inventory', {
                          quantity: bulkQuantity,
                        })
                        setBulkInventoryDialog(false)
                        setBulkQuantity('')
                      }
                    }}
                    disabled={!bulkQuantity || parseInt(bulkQuantity) < 0}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Results Dialog */}
          <Dialog open={showImportResults} onOpenChange={setShowImportResults}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Results</DialogTitle>
                <DialogDescription>
                  {importResults && (
                    <>
                      Total: {importResults.total} | Successful:{' '}
                      <span className="text-green-600">
                        {importResults.success.length}
                      </span>{' '}
                      | Errors:{' '}
                      <span className="text-red-600">
                        {importResults.errors.length}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {importResults && (
                <div className="space-y-4">
                  {/* Success Summary */}
                  {importResults.success.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-600 mb-2">
                        Successful Imports ({importResults.success.length})
                      </h3>
                      <div className="max-h-40 overflow-y-auto border rounded p-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Product Name</TableHead>
                              <TableHead>ID</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.success.map(
                              (item: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.row}</TableCell>
                                  <TableCell>{item.product.name}</TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {item.product.id.substring(0, 8)}...
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Error Summary */}
                  {importResults.errors.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-600 mb-2">
                        Errors ({importResults.errors.length})
                      </h3>
                      <div className="max-h-60 overflow-y-auto border rounded p-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Error</TableHead>
                              <TableHead>Product Name</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.errors.map(
                              (item: any, idx: number) => (
                                <TableRow key={idx} className="text-red-600">
                                  <TableCell className="font-semibold">
                                    {item.row}
                                  </TableCell>
                                  <TableCell>{item.error}</TableCell>
                                  <TableCell>
                                    {item.data?.name || 'N/A'}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowImportResults(false)
                        setImportResults(null)
                        fetchProducts() // Refresh products list
                      }}
                    >
                      Close & Refresh
                    </Button>
                    {importResults.errors.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Create error report
                          const errorReport = importResults.errors
                            .map(
                              (e: any) =>
                                `Row ${e.row}: ${e.error}\nProduct: ${e.data?.name || 'N/A'}\nData: ${JSON.stringify(e.data, null, 2)}`
                            )
                            .join('\n\n')

                          const blob = new Blob([errorReport], {
                            type: 'text/plain',
                          })
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `import_errors_${new Date().toISOString().split('T')[0]}.txt`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Error Report
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduct(null)
                  resetForm()
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct
                    ? 'Update product information'
                    : 'Create a new product for your store'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="essential">
                      Essential Fields
                    </TabsTrigger>
                    <TabsTrigger value="advanced">Advanced & SEO</TabsTrigger>
                  </TabsList>

                  <TabsContent value="essential" className="space-y-6 mt-6">
                    {/* Basic Information - Essential Only */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Basic Information
                      </h3>
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              name: e.target.value,
                              slug: !editingProduct
                                ? e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, '')
                                : formData.slug,
                            })
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Price (Rs.) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                price: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sku">SKU</Label>
                          <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) =>
                              setFormData({ ...formData, sku: e.target.value })
                            }
                            placeholder="Product SKU"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category_id">Category</Label>
                        <Select
                          value={formData.category_id || undefined}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              category_id: value === 'none' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Category</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!editingProduct && (
                        <div>
                          <Label htmlFor="initial_quantity">
                            Initial Stock Quantity
                          </Label>
                          <Input
                            id="initial_quantity"
                            type="number"
                            min="0"
                            value={formData.initial_quantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                initial_quantity: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Set the initial inventory quantity for this product
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Main Image - Essential */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Product Image</h3>
                      <div>
                        <Label>Main Image *</Label>
                        <ImageUpload
                          value={formData.image}
                          onChange={(url) =>
                            setFormData({ ...formData, image: url })
                          }
                          label=""
                          folder="heldeelife/products"
                          tags={['product', 'main']}
                          required
                        />
                      </div>
                    </div>

                    {/* Status - Essential */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Status</h3>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                is_active: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span>Active</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                is_featured: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span>Featured</span>
                        </label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-6 mt-6">
                    {/* Additional Images */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Additional Images
                      </h3>
                      <div>
                        <Label>Additional Images</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter image URL"
                              value={formData.newImageUrl}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  newImageUrl: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addImageUrl(formData.newImageUrl)
                                  setFormData({ ...formData, newImageUrl: '' })
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                addImageUrl(formData.newImageUrl)
                                setFormData({ ...formData, newImageUrl: '' })
                              }}
                            >
                              Add URL
                            </Button>
                          </div>
                          {formData.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {formData.images.map((img, index) => (
                                <div
                                  key={index}
                                  className="relative group w-full h-24 rounded border overflow-hidden"
                                >
                                  <Image
                                    src={img}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 z-10"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Descriptions</h3>
                      <div>
                        <Label htmlFor="short_description">
                          Short Description
                        </Label>
                        <Textarea
                          id="short_description"
                          value={formData.short_description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              short_description: e.target.value,
                            })
                          }
                          rows={2}
                          placeholder="Brief description (shown in product listings)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Full Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          rows={6}
                          placeholder="Detailed product description"
                        />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Product Details</h3>
                      <div>
                        <Label htmlFor="benefits">Benefits</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="benefits"
                              placeholder="Add a benefit"
                              value={formData.newBenefit}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  newBenefit: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addBenefit()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addBenefit}
                            >
                              Add
                            </Button>
                          </div>
                          {formData.benefits.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.benefits.map((benefit, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                                >
                                  <span>{benefit}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeBenefit(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ingredients">Ingredients</Label>
                        <Textarea
                          id="ingredients"
                          value={formData.ingredients}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ingredients: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="List of ingredients"
                        />
                      </div>
                      <div>
                        <Label htmlFor="usage_instructions">
                          Usage Instructions
                        </Label>
                        <Textarea
                          id="usage_instructions"
                          value={formData.usage_instructions}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              usage_instructions: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="How to use this product"
                        />
                      </div>
                      <div>
                        <Label htmlFor="storage_instructions">
                          Storage Instructions
                        </Label>
                        <Textarea
                          id="storage_instructions"
                          value={formData.storage_instructions}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              storage_instructions: e.target.value,
                            })
                          }
                          rows={2}
                          placeholder="Storage requirements"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry_info">
                            Expiry Information
                          </Label>
                          <Input
                            id="expiry_info"
                            value={formData.expiry_info}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiry_info: e.target.value,
                              })
                            }
                            placeholder="e.g., 24 months from manufacture"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manufacturer">Manufacturer</Label>
                          <Input
                            id="manufacturer"
                            value={formData.manufacturer}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                manufacturer: e.target.value,
                              })
                            }
                            placeholder="Manufacturer name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEO Fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        SEO Optimization
                      </h3>
                      <div>
                        <Label htmlFor="meta_title">Meta Title</Label>
                        <Input
                          id="meta_title"
                          value={formData.meta_title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              meta_title: e.target.value,
                            })
                          }
                          placeholder="SEO title (defaults to product name)"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.meta_title.length}/60 characters
                          (recommended: 50-60)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="meta_description">
                          Meta Description
                        </Label>
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              meta_description: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="SEO description (120-160 characters recommended)"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.meta_description.length}/160 characters
                          (recommended: 120-160)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="meta_keywords">Meta Keywords</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="meta_keywords"
                              placeholder="Add a keyword"
                              value={formData.newKeyword}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  newKeyword: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addKeyword()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addKeyword}
                            >
                              Add
                            </Button>
                          </div>
                          {formData.meta_keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.meta_keywords.map((keyword, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                                >
                                  <span>{keyword}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeKeyword(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Blog Links */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Blog Links (Internal & External)
                      </h3>
                      <p className="text-sm text-gray-600">
                        Link this product to relevant blog posts for better SEO
                        and discoverability
                      </p>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={formData.newBlogLink.type}
                            onValueChange={(value: 'internal' | 'external') =>
                              setFormData({
                                ...formData,
                                newBlogLink: {
                                  ...formData.newBlogLink,
                                  type: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="internal">Internal</SelectItem>
                              <SelectItem value="external">External</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.newBlogLink.type === 'internal' ? (
                            <Select
                              value={formData.newBlogLink.url}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  newBlogLink: {
                                    ...formData.newBlogLink,
                                    url: value,
                                    title:
                                      blogPosts.find((p) => p.id === value)
                                        ?.title || '',
                                  },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select blog post" />
                              </SelectTrigger>
                              <SelectContent>
                                {blogPosts.map((post) => (
                                  <SelectItem
                                    key={post.id}
                                    value={`/blog/${post.slug}`}
                                  >
                                    {post.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="External URL"
                              value={formData.newBlogLink.url}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  newBlogLink: {
                                    ...formData.newBlogLink,
                                    url: e.target.value,
                                  },
                                })
                              }
                            />
                          )}
                          <Input
                            placeholder="Link title (optional)"
                            value={formData.newBlogLink.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newBlogLink: {
                                  ...formData.newBlogLink,
                                  title: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addBlogLink}
                          disabled={!formData.newBlogLink.url.trim()}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Add Blog Link
                        </Button>
                        {formData.blog_links.length > 0 && (
                          <div className="space-y-2">
                            {formData.blog_links.map((link, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                    {link.type}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {link.title || link.url}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {link.url}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBlogLink(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">FAQ Section</h3>
                      <p className="text-sm text-gray-600">
                        Add frequently asked questions to improve SEO and help
                        customers
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Input
                            placeholder="Question"
                            value={formData.newFAQ.question}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newFAQ: {
                                  ...formData.newFAQ,
                                  question: e.target.value,
                                },
                              })
                            }
                          />
                          <Textarea
                            placeholder="Answer"
                            value={formData.newFAQ.answer}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newFAQ: {
                                  ...formData.newFAQ,
                                  answer: e.target.value,
                                },
                              })
                            }
                            rows={3}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addFAQ}
                            disabled={
                              !formData.newFAQ.question.trim() ||
                              !formData.newFAQ.answer.trim()
                            }
                          >
                            Add FAQ
                          </Button>
                        </div>
                        {formData.faq.length > 0 && (
                          <div className="space-y-2">
                            {formData.faq.map((faq, index) => (
                              <div
                                key={index}
                                className="p-4 border rounded bg-gray-50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-sm">
                                    {faq.question}
                                  </h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFAQ(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {faq.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingProduct ? (
                      'Update Product'
                    ) : (
                      'Create Product'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedProducts.size > 0 && (
        <Card className="mb-4 border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-gray-900">
                  {selectedProducts.size} product
                  {selectedProducts.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProducts(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Products</CardTitle>
            <span className="text-sm text-gray-500">
              Total: {products.length} product{products.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button
                    onClick={toggleAllSelection}
                    className="flex items-center justify-center hover:opacity-70 transition-opacity"
                    title={
                      selectedProducts.size === products.length
                        ? 'Deselect all'
                        : 'Select all'
                    }
                  >
                    {selectedProducts.size === products.length &&
                    products.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <button
                      onClick={() => toggleProductSelection(product.id)}
                      className="flex items-center justify-center hover:opacity-70 transition-opacity"
                      title={
                        selectedProducts.has(product.id)
                          ? 'Deselect product'
                          : 'Select product'
                      }
                    >
                      {selectedProducts.has(product.id) ? (
                        <CheckSquare className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || '-'}</TableCell>
                  <TableCell>Rs. {product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.product_categories?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                      >
                        {deleting === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
