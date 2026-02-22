"""Pydantic models for rewritten articles."""
from __future__ import annotations

from pydantic import BaseModel, Field


class RewrittenArticle(BaseModel):
    """Article after LLM rewriting with SEO metadata."""

    # Content
    title: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    content_html: str = Field(..., min_length=100)
    excerpt: str = ""

    # SEO metadata
    meta_title: str = ""
    meta_description: str = ""
    meta_keywords: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)

    # Source tracking
    source_url: str = ""
    source_name: str = ""
    category_hint: str = ""
    featured_image: str = ""

    def to_dict(self) -> dict:
        return self.model_dump()
