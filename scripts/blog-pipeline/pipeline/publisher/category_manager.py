"""Category and tag resolution against Supabase."""
from __future__ import annotations

from pathlib import Path
import yaml
from supabase import Client

from pipeline.settings import CONFIG_DIR
from pipeline.publisher.slug_generator import generate_slug


def load_category_mapping() -> dict:
    """Load category mapping from categories.yaml."""
    path = CONFIG_DIR / "categories.yaml"
    if not path.exists():
        return {}
    with open(path) as f:
        config = yaml.safe_load(f) or {}
    return config.get("mappings", {})


def resolve_category(category_hint: str, supabase: Client) -> str | None:
    """Resolve a category hint to a category UUID.

    Looks up the category mapping, then finds or creates the category in Supabase.
    Returns the category UUID or None.
    """
    if not category_hint:
        return None

    mappings = load_category_mapping()
    category_name = mappings.get(category_hint, category_hint.replace("-", " ").title())
    slug = generate_slug(category_name)

    # Try to find existing category
    result = supabase.table("blog_categories").select("id").eq("slug", slug).execute()
    if result.data:
        return result.data[0]["id"]

    # Create new category
    result = (
        supabase.table("blog_categories")
        .insert({"name": category_name, "slug": slug})
        .execute()
    )
    if result.data:
        return result.data[0]["id"]

    return None


def resolve_tags(tag_names: list[str], supabase: Client) -> list[str]:
    """Resolve tag names to tag UUIDs. Creates tags if they don't exist.

    Returns list of tag UUIDs.
    """
    tag_ids = []
    for name in tag_names:
        name = name.strip()
        if not name:
            continue

        slug = generate_slug(name)

        # Try to find existing tag
        result = supabase.table("blog_tags").select("id").eq("slug", slug).execute()
        if result.data:
            tag_ids.append(result.data[0]["id"])
            continue

        # Create new tag
        result = (
            supabase.table("blog_tags")
            .insert({"name": name, "slug": slug})
            .execute()
        )
        if result.data:
            tag_ids.append(result.data[0]["id"])

    return tag_ids
