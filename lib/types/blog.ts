export type BlogStatus = 'draft' | 'published' | 'archived'

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  author_id: string
  category_id?: string
  status: BlogStatus
  published_at?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  reading_time?: number
  views_count: number
  seo_score: number
  created_at: string
  updated_at: string
  // Relations
  category?: BlogCategory
  tags?: BlogTag[]
  author?: {
    id: string
    email?: string
    name?: string
  }
}

export interface BlogPostWithRelations extends BlogPost {
  category?: BlogCategory
  tags?: BlogTag[]
  author?: {
    id: string
    email?: string
    name?: string
  }
}

export interface CreateBlogPostInput {
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  category_id?: string
  status: BlogStatus
  published_at?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  tag_ids?: string[]
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  id: string
}









