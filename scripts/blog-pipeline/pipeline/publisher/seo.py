"""SEO score calculation — mirrors lib/utils/blog.ts exactly."""
from __future__ import annotations

import math
import re


def calculate_reading_time(content: str) -> int:
    """Calculate reading time in minutes. Mirrors calculateReadingTime() in blog.ts."""
    words_per_minute = 200
    words = len(content.split())
    return math.ceil(words / words_per_minute)


def calculate_seo_score(
    title: str,
    meta_description: str,
    content: str,
    featured_image: str,
    meta_keywords: list[str],
    excerpt: str,
) -> int:
    """Calculate SEO score (0-100). Mirrors calculateSEOScore() in blog.ts.

    Scoring breakdown:
    - Title: 0-25 pts (25 if 30-60 chars, 15 if exists)
    - Meta description: 0-25 pts (25 if 120-160 chars, 15 if exists)
    - Content length: 0-20 pts (20 if >=1000 chars, 10 if >=500)
    - Featured image: 0-10 pts (10 if present)
    - Keywords: 0-10 pts (10 if >=3, 5 if 1-2)
    - Excerpt: 0-10 pts (10 if >=100 chars, 5 if exists)
    """
    score = 0

    # Title (0-25 points)
    if title and 30 <= len(title) <= 60:
        score += 25
    elif title and len(title) > 0:
        score += 15

    # Meta description (0-25 points)
    if meta_description and 120 <= len(meta_description) <= 160:
        score += 25
    elif meta_description and len(meta_description) > 0:
        score += 15

    # Content length (0-20 points)
    if content and len(content) >= 1000:
        score += 20
    elif content and len(content) >= 500:
        score += 10

    # Featured image (0-10 points)
    if featured_image:
        score += 10

    # Keywords (0-10 points)
    if meta_keywords and len(meta_keywords) >= 3:
        score += 10
    elif meta_keywords and len(meta_keywords) > 0:
        score += 5

    # Excerpt (0-10 points)
    if excerpt and len(excerpt) >= 100:
        score += 10
    elif excerpt and len(excerpt) > 0:
        score += 5

    return min(score, 100)
