"""ISR revalidation trigger via secret-based auth."""

import httpx

from pipeline.settings import Settings


def trigger_revalidation(slug: str, settings: Settings) -> bool:
    """POST to /api/blog/revalidate with x-revalidation-secret header.

    Returns True on success, raises on failure.
    """
    if not settings.revalidation_secret:
        raise ValueError("REVALIDATION_SECRET is required for revalidation")

    url = f"{settings.site_url.rstrip('/')}/api/blog/revalidate"

    response = httpx.post(
        url,
        json={"slug": slug},
        headers={"x-revalidation-secret": settings.revalidation_secret},
        timeout=30.0,
    )
    response.raise_for_status()
    data = response.json()
    return data.get("revalidated", False)


def trigger_full_revalidation(settings: Settings) -> bool:
    """Revalidate all blog pages (no specific slug)."""
    if not settings.revalidation_secret:
        raise ValueError("REVALIDATION_SECRET is required for revalidation")

    url = f"{settings.site_url.rstrip('/')}/api/blog/revalidate"

    response = httpx.post(
        url,
        json={},
        headers={"x-revalidation-secret": settings.revalidation_secret},
        timeout=30.0,
    )
    response.raise_for_status()
    data = response.json()
    return data.get("revalidated", False)
