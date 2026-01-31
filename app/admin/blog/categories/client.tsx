'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'
import { generateSlug } from '@/lib/utils/blog'

interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export function AdminBlogCategoriesClient() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(
    null
  )
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const toast = useToast()

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blog/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCategory
        ? `/api/blog/categories/${editingCategory.id}`
        : '/api/blog/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      toast.success(
        editingCategory
          ? 'Category updated successfully'
          : 'Category created successfully'
      )
      setIsDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '' })
      fetchCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error.message || 'Failed to save category')
    }
  }

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/blog/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete category')

      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '' })
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Blog <span className="text-orange-600">Categories</span>
          </h1>
          <p className="text-gray-600 mt-2">Manage blog post categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', slug: '', description: '' })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update the category details below'
                  : 'Add a new category for blog posts'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value),
                    })
                  }}
                  required
                  placeholder="e.g., Health & Wellness"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  required
                  placeholder="health-wellness"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Category description (optional)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {categories.length}{' '}
            {categories.length === 1 ? 'category' : 'categories'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No categories found. Create your first category!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {category.description || '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
