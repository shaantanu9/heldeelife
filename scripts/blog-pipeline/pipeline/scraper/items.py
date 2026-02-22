"""Scrapy item definitions for raw articles."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawArticleItem:
    """Raw article as scraped from a source."""

    source_url: str = ""
    source_name: str = ""
    raw_title: str = ""
    raw_content_html: str = ""
    raw_content_text: str = ""
    raw_tags: list[str] = field(default_factory=list)
    raw_author: str = ""
    raw_published_date: str = ""
    raw_featured_image: str = ""
    category_hint: str = ""
    scraped_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "source_url": self.source_url,
            "source_name": self.source_name,
            "raw_title": self.raw_title,
            "raw_content_html": self.raw_content_html,
            "raw_content_text": self.raw_content_text,
            "raw_tags": self.raw_tags,
            "raw_author": self.raw_author,
            "raw_published_date": self.raw_published_date,
            "raw_featured_image": self.raw_featured_image,
            "category_hint": self.category_hint,
            "scraped_at": self.scraped_at,
        }
