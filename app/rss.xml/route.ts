import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'

  // Get latest published blog posts
  const { data: posts } = await supabaseAdmin
    .from('blog_posts')
    .select(
      `
      *,
      category:blog_categories(*),
      author:users(id, email, full_name)
    `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  // Helper function to escape XML content
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // Helper function to strip HTML tags for description
  const stripHtml = (html: string) => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>heldeelife Blog</title>
    <description>Expert insights on health, wellness, Ayurveda, and modern medicine</description>
    <link>${baseUrl}/blog</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <webMaster>${baseUrl}</webMaster>
    <managingEditor>${baseUrl}</managingEditor>
    ${(posts || [])
      .map((post: any) => {
        const cleanContent = stripHtml(post.content || '')
        const excerpt = post.excerpt || cleanContent.substring(0, 200) + '...'

        return `    <item>
      <title><![CDATA[${escapeXml(post.title)}]]></title>
      <description><![CDATA[${escapeXml(excerpt)}]]></description>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.published_at || post.created_at).toUTCString()}</pubDate>
      ${post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : ''}
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ''}
      ${post.featured_image ? `<enclosure url="${post.featured_image}" type="image/jpeg"/>` : ''}
      <content:encoded><![CDATA[${post.content || ''}]]></content:encoded>
      ${post.meta_keywords && post.meta_keywords.length > 0 ? `<category>${post.meta_keywords.map((k: string) => escapeXml(k)).join(', ')}</category>` : ''}
    </item>`
      })
      .join('\n')}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
