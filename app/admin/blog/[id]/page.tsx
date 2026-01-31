'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { hasAdminRole } from '@/lib/utils/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { generateSlug, generateKeywords } from '@/lib/utils/blog'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { ImageUpload } from '@/components/blog/image-upload'
import { SEOAnalyzer } from '@/components/blog/seo-analyzer'
import { BlogPreview } from '@/components/blog/blog-preview'

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  featured_image: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  category_id: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
})

type BlogPostForm = z.infer<typeof blogPostSchema>

export default function EditBlogPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [creatingTag, setCreatingTag] = useState(false)
  const [seoScore, setSeoScore] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogPostForm>({
    resolver: zodResolver(blogPostSchema),
  })

  const title = watch('title')
  const content = watch('content')
  const metaDescription = watch('meta_description')
  const featuredImage = watch('featured_image')

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session) {
      // Check if user is admin
      if (!hasAdminRole(session.user)) {
        router.push('/')
        return
      }
      fetchPost()
      fetchCategories()
      fetchTags()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, postId, session])

  useEffect(() => {
    if (title) {
      const slug = generateSlug(title)
      setValue('slug', slug)
    }
  }, [title, setValue])

  const calculateSEOScore = useCallback((): number => {
    let score = 0

    if (title && title.length >= 30 && title.length <= 60) score += 25
    else if (title) score += 15

    if (
      metaDescription &&
      metaDescription.length >= 120 &&
      metaDescription.length <= 160
    )
      score += 25
    else if (metaDescription) score += 15

    if (content && content.length >= 1000) score += 20
    else if (content && content.length >= 500) score += 10

    if (featuredImage) score += 10

    if (selectedTags.length >= 3) score += 10
    else if (selectedTags.length > 0) score += 5

    return Math.min(score, 100)
  }, [title, metaDescription, content, featuredImage, selectedTags])

  useEffect(() => {
    const score = calculateSEOScore()
    setSeoScore(score)
  }, [calculateSEOScore])

  // Auto-save functionality
  const slug = watch('slug')
  const excerpt = watch('excerpt')
  const categoryId = watch('category_id')
  const status = watch('status')
  const metaTitle = watch('meta_title')
  const metaKeywords = watch('meta_keywords')

  useEffect(() => {
    if (!post || !title || !content || saving || autoSaving) return

    const autoSaveInterval = setInterval(async () => {
      if (saving || autoSaving) return

      try {
        setAutoSaving(true)
        const keywords = metaKeywords
          ? metaKeywords.split(',').map((k: string) => k.trim())
          : generateKeywords(title, content)

        await fetch(`/api/blog/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug: slug || generateSlug(title),
            excerpt: excerpt || '',
            content,
            featured_image: featuredImage || '',
            category_id: categoryId || null,
            status: status || 'draft',
            meta_title: metaTitle || '',
            meta_description: metaDescription || '',
            meta_keywords: keywords,
            tag_ids: selectedTags,
          }),
        })

        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save error:', error)
        // Silent fail for auto-save
      } finally {
        setAutoSaving(false)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [post, postId, title, slug, excerpt, content, featuredImage, categoryId, status, metaTitle, metaDescription, metaKeywords, selectedTags, saving, autoSaving])

  async function fetchPost() {
    try {
      const response = await fetch(`/api/blog/posts/${postId}`)
      if (!response.ok) {
        throw new Error('Post not found')
      }
      const data = await response.json()
      setPost(data.post)

      // Set form values - ensure content is properly set
      setValue('title', data.post.title || '')
      setValue('slug', data.post.slug || '')
      setValue('excerpt', data.post.excerpt || '')
      // Ensure content is set properly - handle null/undefined
      const postContent = data.post.content || ''
      setValue('content', postContent)
      setValue('featured_image', data.post.featured_image || '')
      setValue('category_id', data.post.category_id || '')
      setValue('status', data.post.status || 'draft')
      setValue('meta_title', data.post.meta_title || '')
      setValue('meta_description', data.post.meta_description || '')
      setValue(
        'meta_keywords',
        Array.isArray(data.post.meta_keywords)
          ? data.post.meta_keywords.join(', ')
          : data.post.meta_keywords || ''
      )
      setSelectedTags(data.post.tags?.map((t: any) => t.id) || [])
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Failed to load post')
      router.push('/admin/blog')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch('/api/blog/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function fetchTags() {
    try {
      const response = await fetch('/api/blog/tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim() || creatingTag) return

    try {
      setCreatingTag(true)
      const response = await fetch('/api/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      })

      const data = await response.json()
      if (data.tag) {
        setTags([...tags, data.tag])
        setSelectedTags([...selectedTags, data.tag.id])
        setNewTagName('')
        toast.success('Tag created')
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error('Failed to create tag')
    } finally {
      setCreatingTag(false)
    }
  }

  async function onSubmit(data: BlogPostForm) {
    setSaving(true)

    try {
      let keywords = data.meta_keywords
        ? data.meta_keywords.split(',').map((k) => k.trim())
        : generateKeywords(data.title, data.content)

      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          meta_keywords: keywords,
          tag_ids: selectedTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update post')
      }

      toast.success('Blog post updated successfully!')
      fetchPost()
    } catch (error: any) {
      console.error('Error updating post:', error)
      toast.error(error.message || 'Failed to update blog post')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>
  }

  if (status === 'unauthenticated' || !post) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog Management
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Edit your blog post content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    className={errors.slug ? 'border-destructive' : ''}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea id="excerpt" {...register('excerpt')} rows={3} />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <RichTextEditor
                    content={content || ''}
                    onChange={(html) => setValue('content', html)}
                    placeholder="Write your blog post content here..."
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.content.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {content?.replace(/<[^>]*>/g, '').length || 0} characters
                  </p>
                </div>

                <div>
                  <ImageUpload
                    value={featuredImage || ''}
                    onChange={(url) => setValue('featured_image', url)}
                    label="Featured Image"
                    folder="heldeelife"
                    tags={['blog', 'featured']}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value) => setValue('status', value as any)}
                    defaultValue={post.status}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    onValueChange={(value) => setValue('category_id', value)}
                    defaultValue={post.category_id || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="New tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateTag()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateTag}
                        size="sm"
                        disabled={creatingTag}
                      >
                        {creatingTag ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={
                            selectedTags.includes(tag.id)
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedTags.includes(tag.id)) {
                              setSelectedTags(
                                selectedTags.filter((id) => id !== tag.id)
                              )
                            } else {
                              setSelectedTags([...selectedTags, tag.id])
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  {autoSaving && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Auto-saving...
                    </div>
                  )}
                  {lastSaved && !autoSaving && (
                    <div className="text-xs text-muted-foreground">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                  {post.status === 'published' && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Post
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            <SEOAnalyzer
              title={title || ''}
              metaDescription={metaDescription || ''}
              content={content || ''}
              featuredImage={featuredImage || ''}
              tags={tags.filter((t) => selectedTags.includes(t.id)).map((t) => t.name)}
              category={categories.find((c) => c.id === watch('category_id'))?.name}
              slug={watch('slug') || ''}
            />

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input id="meta_title" {...register('meta_title')} />
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    {...register('meta_description')}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {metaDescription?.length || 0}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_keywords">
                    Meta Keywords (comma-separated)
                  </Label>
                  <Input id="meta_keywords" {...register('meta_keywords')} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BlogPreview
            title={title || ''}
            content={content || ''}
            excerpt={watch('excerpt') || ''}
            featuredImage={featuredImage || ''}
            metaDescription={metaDescription || ''}
          />
          <div className="flex items-center gap-4">
            <Link href="/admin/blog">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
