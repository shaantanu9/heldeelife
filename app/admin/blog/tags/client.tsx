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
import { Plus, Loader2, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'
import { generateSlug } from '@/lib/utils/blog'

interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export function AdminBlogTagsClient() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [formData, setFormData] = useState({
    name: '',
  })
  const toast = useToast()

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blog/tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      const url = editingTag
        ? `/api/blog/tags/${editingTag.id}`
        : '/api/blog/tags'
      const method = editingTag ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save tag')
      }

      toast.success(
        editingTag ? 'Tag updated successfully' : 'Tag created successfully'
      )
      setIsDialogOpen(false)
      setEditingTag(null)
      setFormData({ name: '' })
      fetchTags()
    } catch (error: any) {
      console.error('Error saving tag:', error)
      toast.error(error.message || 'Failed to save tag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (tag: BlogTag) => {
    setEditingTag(tag)
    setFormData({ name: tag.name })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return
    if (deleting === id) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/blog/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete tag')

      toast.success('Tag deleted successfully')
      fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    } finally {
      setDeleting(null)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingTag(null)
    setFormData({ name: '' })
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
            Blog <span className="text-orange-600">Tags</span>
          </h1>
          <p className="text-gray-600 mt-2">Manage blog post tags</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTag(null)
                setFormData({ name: '' })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </DialogTitle>
              <DialogDescription>
                {editingTag
                  ? 'Update the tag name below'
                  : 'Add a new tag for blog posts'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tag Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  placeholder="e.g., Ayurveda"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Slug will be auto-generated:{' '}
                  {generateSlug(formData.name || 'tag-name')}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>
            {tags.length} {tags.length === 1 ? 'tag' : 'tags'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No tags found. Create your first tag!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {tag.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(tag.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag.id)}
                          disabled={deleting === tag.id}
                        >
                          {deleting === tag.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
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
