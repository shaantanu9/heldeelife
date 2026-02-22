"""Supabase client for publishing articles directly."""
from __future__ import annotations

from datetime import datetime, timezone
from supabase import create_client, Client

from pipeline.settings import Settings
from pipeline.publisher.seo import calculate_seo_score, calculate_reading_time
from pipeline.publisher.slug_generator import generate_slug, ensure_unique_slug
from pipeline.publisher.category_manager import resolve_category, resolve_tags


def _get_client(settings: Settings) -> Client:
    """Create a Supabase client with service role key (bypasses RLS)."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def publish_article(
    article: dict,
    author_id: str,
    status: str = "draft",
    settings: Settings | None = None,
) -> str:
    """Insert a rewritten article into Supabase blog_posts.

    Returns the slug of the published post.
    """
    if settings is None:
        from pipeline.settings import get_settings
        settings = get_settings()

    supabase = _get_client(settings)

    # Generate unique slug
    slug = article.get("slug") or generate_slug(article["title"])
    slug = ensure_unique_slug(slug, supabase)

    # Resolve category
    category_id = resolve_category(article.get("category_hint", ""), supabase)

    # Calculate SEO metrics
    content = article.get("content_html", "")
    reading_time = calculate_reading_time(content)
    seo_score = calculate_seo_score(
        title=article.get("title", ""),
        meta_description=article.get("meta_description", ""),
        content=content,
        featured_image=article.get("featured_image", ""),
        meta_keywords=article.get("meta_keywords", []),
        excerpt=article.get("excerpt", ""),
    )

    # Build post record
    post_data = {
        "title": article["title"],
        "slug": slug,
        "content": content,
        "excerpt": article.get("excerpt", ""),
        "featured_image": article.get("featured_image") or None,
        "author_id": author_id,
        "category_id": category_id,
        "status": status,
        "meta_title": article.get("meta_title", ""),
        "meta_description": article.get("meta_description", ""),
        "meta_keywords": article.get("meta_keywords", []),
        "reading_time": reading_time,
        "seo_score": seo_score,
    }

    # Set published_at if publishing immediately
    if status == "published":
        post_data["published_at"] = datetime.now(timezone.utc).isoformat()

    # Insert post
    result = supabase.table("blog_posts").insert(post_data).execute()
    if not result.data:
        raise RuntimeError(f"Failed to insert blog post: {slug}")

    post_id = result.data[0]["id"]

    # Associate tags
    tag_names = article.get("tags", [])
    if tag_names:
        tag_ids = resolve_tags(tag_names, supabase)
        if tag_ids:
            tag_rows = [{"post_id": post_id, "tag_id": tid} for tid in tag_ids]
            supabase.table("blog_post_tags").insert(tag_rows).execute()

    return slug
