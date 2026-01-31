# Insights Page Setup Guide

## Overview

The Insights page (`/insights`) is now connected to real backend data from your blog system. It automatically displays blog posts that are categorized as "Insights" or "Learning" for better SEO and content organization.

## How It Works

### Category-Based Filtering

The Insights page automatically filters blog posts by category:
1. **First Priority**: Posts with category slug `"insights"`
2. **Fallback**: Posts with category slug `"learning"`

This allows you to:
- Create educational, informative content
- Organize content by purpose (blog vs. insights)
- Improve SEO with category-specific pages
- Show relevant content on the homepage

## Setup Instructions

### Step 1: Create the "Insights" Category

1. Go to **Admin Dashboard** → **Blog** → **Categories**
2. Click **"Add New Category"**
3. Create a category with:
   - **Name**: `Insights` (or `Learning`)
   - **Slug**: `insights` (or `learning`) - **This is important!**
   - **Description**: `Educational health insights and wellness tips`

### Step 2: Create Blog Posts with Insights Category

1. Go to **Admin Dashboard** → **Blog** → **New Post**
2. Fill in your blog post details:
   - Title, content, featured image, etc.
3. **Important**: In the **"Category"** dropdown, select **"Insights"** (or "Learning")
4. Add relevant tags for better organization
5. Set status to **"Published"**
6. Save the post

### Step 3: Verify Insights Appear

1. Visit `/insights` - You should see your posts
2. Visit `/insights/[slug]` - Individual insight pages
3. Check homepage - Insights section shows latest posts

## SEO Benefits

### Category-Based SEO

- **Dedicated URL Structure**: `/insights` for educational content
- **Structured Data**: JSON-LD schema for better search understanding
- **Category Pages**: Better organization for search engines
- **Internal Linking**: Related posts based on category and tags

### Metadata

Each insight post includes:
- **Meta Title**: Auto-generated or custom
- **Meta Description**: From excerpt or auto-generated
- **Keywords**: From tags and category
- **Open Graph**: For social sharing
- **Twitter Cards**: Enhanced Twitter sharing
- **Structured Data**: Article schema for search engines

## Content Strategy

### What to Post as "Insights"

Use the Insights category for:
- ✅ Educational health articles
- ✅ Wellness tips and guides
- ✅ Ayurvedic learning content
- ✅ Product usage guides
- ✅ Health research summaries
- ✅ How-to articles
- ✅ Informative content

### What to Post as Regular Blog

Use regular blog categories for:
- Company news
- Product announcements
- General health topics
- News and updates

## Technical Details

### File Structure

```
app/insights/
├── page.tsx              # Main insights listing (server component)
├── insights-client.tsx   # Client component for listing
├── [id]/
│   ├── page.tsx         # Individual insight page (server component)
│   ├── insight-client.tsx # Client component for detail view
│   └── not-found.tsx    # 404 page
```

### API Endpoints

- `GET /api/insights?limit=12` - Fetch insights posts
- Uses `getInsightsPosts()` from `lib/utils/insights-query.ts`

### Database Queries

- Filters `blog_posts` by category slug
- Only shows `status = 'published'` posts
- Orders by `published_at` (newest first)
- Includes category, tags, and metadata

## Features

### Homepage Integration

The Insights section on the homepage (`components/sections/insights.tsx`):
- Automatically fetches latest 6 insights
- Shows in carousel format
- Links to full insights page
- Responsive design

### Individual Insight Pages

Each insight post includes:
- Full article content (HTML from rich text editor)
- Featured image
- Category badge
- Reading time
- View count
- Tags
- Share button
- Related posts
- SEO metadata

### SEO Optimization

- **Structured Data**: Article schema
- **Canonical URLs**: Prevents duplicate content
- **Meta Tags**: Complete Open Graph and Twitter Cards
- **Category Organization**: Better content hierarchy
- **Internal Linking**: Related posts for better crawlability

## Best Practices

### 1. Category Naming

- Use consistent category names: "Insights" or "Learning"
- Slug must match: `insights` or `learning` (lowercase)
- Create category before creating posts

### 2. Content Quality

- Write informative, educational content
- Use proper headings (H1, H2, H3)
- Include images for better engagement
- Add relevant tags
- Write good excerpts for previews

### 3. SEO Optimization

- Use descriptive titles
- Write compelling meta descriptions
- Add relevant keywords
- Use proper heading structure
- Include internal links

### 4. Images

- Use featured images for better visual appeal
- Optimize images before uploading
- Use descriptive alt text
- Consider image dimensions (1200x630 for OG)

## Troubleshooting

### Insights Not Showing

1. **Check Category**: Ensure category slug is `insights` or `learning`
2. **Check Status**: Posts must be `published`
3. **Check Category Assignment**: Post must have category selected
4. **Clear Cache**: Revalidate the page (ISR every 60 seconds)

### 404 Errors

- Ensure post slug is correct
- Check if post is published
- Verify category is correct
- Check database connection

### Performance

- Posts are cached for 60 seconds (ISR)
- Images are optimized with Next.js Image
- Lazy loading for below-the-fold content
- Server-side rendering for SEO

## Example Workflow

1. **Create Category**:
   - Admin → Blog → Categories → Add "Insights" (slug: `insights`)

2. **Create Post**:
   - Admin → Blog → New Post
   - Title: "Understanding Ayurvedic Doshas"
   - Category: Select "Insights"
   - Content: Write your article
   - Tags: Add relevant tags (e.g., "ayurveda", "wellness")
   - Status: Publish
   - Save

3. **Verify**:
   - Visit `/insights` - Post appears
   - Visit `/insights/understanding-ayurvedic-doshas` - Full article
   - Check homepage - Appears in Insights section

## Next Steps

1. Create the "Insights" category in admin
2. Create your first insight post
3. Verify it appears on `/insights`
4. Check SEO metadata
5. Share and promote!

---

**Last Updated**: 2025-01-27  
**Status**: ✅ Complete Implementation

