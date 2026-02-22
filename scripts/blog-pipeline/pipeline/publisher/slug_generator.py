"""Slug generation with uniqueness checking against Supabase."""

import re
from supabase import Client


def generate_slug(title: str) -> str:
    """Generate a URL-friendly slug from a title. Mirrors generateSlug() in blog.ts."""
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = slug.strip("-")
    return slug


def ensure_unique_slug(slug: str, supabase: Client) -> str:
    """Check Supabase for slug collisions and append -2, -3, etc. if needed."""
    candidate = slug
    suffix = 1

    while True:
        result = (
            supabase.table("blog_posts")
            .select("id")
            .eq("slug", candidate)
            .execute()
        )
        if not result.data:
            return candidate

        suffix += 1
        candidate = f"{slug}-{suffix}"
