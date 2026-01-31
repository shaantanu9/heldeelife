-- Blog System Database Schema
-- This migration creates all tables needed for the blog system

-- Blog Categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog Tags
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  reading_time INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog Post Tags (Junction Table)
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
-- Public can read published posts
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can read their own posts
CREATE POLICY "Users can read their own posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = author_id);

-- Admins can read all posts
CREATE POLICY "Admins can read all posts"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can create their own posts
CREATE POLICY "Users can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for blog_categories
-- Public can read categories
CREATE POLICY "Public can read categories"
  ON blog_categories FOR SELECT
  USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON blog_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for blog_tags
-- Public can read tags
CREATE POLICY "Public can read tags"
  ON blog_tags FOR SELECT
  USING (true);

-- Admins can manage tags
CREATE POLICY "Admins can manage tags"
  ON blog_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for blog_post_tags
-- Public can read post tags
CREATE POLICY "Public can read post tags"
  ON blog_post_tags FOR SELECT
  USING (true);

-- Users can manage tags for their own posts
CREATE POLICY "Users can manage tags for their own posts"
  ON blog_post_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
      AND blog_posts.author_id = auth.uid()
    )
  );










