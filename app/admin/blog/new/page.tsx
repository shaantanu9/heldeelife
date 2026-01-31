'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import { ContentTemplates } from '@/components/blog/content-templates'
import { BlogPreview } from '@/components/blog/blog-preview'

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  featured_image: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      { message: 'Must be a valid URL' }
    ),
  category_id: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
})

type BlogPostForm = z.infer<typeof blogPostSchema>

export default function NewBlogPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [loading, setLoading] = useState(false)
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
    defaultValues: {
      status: 'draft',
    },
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
      fetchCategories()
      fetchTags()
    }
  }, [status, router, session])

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
    // Calculate SEO score
    const score = calculateSEOScore()
    setSeoScore(score)
  }, [calculateSEOScore])

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
    setLoading(true)

    try {
      // Auto-generate keywords if not provided
      let keywords: string[] = []
      if (data.meta_keywords) {
        keywords = data.meta_keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      } else {
        keywords = generateKeywords(data.title, data.content)
      }

      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          meta_keywords: keywords.join(', '), // Convert array to string for API
          tag_ids: selectedTags,
        }),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to create post' }))
        throw new Error(errorData.error || 'Failed to create post')
      }

      const result = await response.json()
      toast.success('Blog post created successfully!')
      router.push(`/admin/blog/${result.post.id}`)
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast.error(error.message || 'Failed to create blog post')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (status === 'authenticated' && session && !hasAdminRole(session.user)) {
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
                <CardDescription>Write your blog post content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter post title"
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
                    placeholder="post-url-slug"
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
                  <Textarea
                    id="excerpt"
                    {...register('excerpt')}
                    placeholder="Brief description of the post"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Content *</Label>
                    <ContentTemplates
                      onSelect={(templateContent) => {
                        setValue('content', templateContent)
                      }}
                    />
                  </div>
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
                    defaultValue="draft"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label>SEO Score</Label>
                    <Badge
                      variant={
                        seoScore >= 70
                          ? 'default'
                          : seoScore >= 50
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {seoScore}/100
                    </Badge>
                  </div>
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
                  <Input
                    id="meta_title"
                    {...register('meta_title')}
                    placeholder="SEO title (defaults to post title)"
                  />
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    {...register('meta_description')}
                    placeholder="SEO description (120-160 characters recommended)"
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
                  <Input
                    id="meta_keywords"
                    {...register('meta_keywords')}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to auto-generate from content
                  </p>
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
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
