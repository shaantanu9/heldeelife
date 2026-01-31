'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { hasAdminRole } from '@/lib/utils/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, Calendar, BarChart3 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface BlogPost {
  id: string
  title: string
  slug: string
  status: string
  published_at?: string
  created_at: string
  views_count: number
  seo_score: number
}

export default function AdminBlogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

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
      // Only fetch posts if we're authenticated and admin
      fetchPosts()
    }
  }, [status, router, session])

  async function fetchPosts() {
    try {
      const response = await fetch('/api/blog/posts?status=all&limit=100')
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      toast.success('Post deleted successfully')
      fetchPosts()
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Management</h1>
          <p className="text-muted-foreground">
            Create and manage your blog posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/blog/analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No blog posts yet.</p>
            <Link href="/admin/blog/new">
              <Button>Create Your First Post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span>Slug: {post.slug}</span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      )}
                      <span>Views: {post.views_count}</span>
                      <span>SEO Score: {post.seo_score}/100</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        post.status === 'published' ? 'default' : 'secondary'
                      }
                    >
                      {post.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {post.status === 'published' && (
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  )}
                  <Link href={`/admin/blog/${post.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setPostToDelete(post.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDelete(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
