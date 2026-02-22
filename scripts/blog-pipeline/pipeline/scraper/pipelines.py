"""Scrapy item pipeline — saves raw articles to JSON files."""

import json
import hashlib
from pathlib import Path

from pipeline.settings import RAW_DIR, ensure_dirs
from pipeline.storage.dedup_store import mark_seen


class SaveRawArticlePipeline:
    """Save each scraped article as a JSON file in data/raw/."""

    def open_spider(self, spider):
        ensure_dirs()

    def process_item(self, item, spider):
        data = item if isinstance(item, dict) else item.to_dict()
        url = data.get("source_url", "")

        # Generate a filename from the URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        title_slug = (
            data.get("raw_title", "untitled")
            .lower()
            .replace(" ", "-")[:50]
        )
        # Clean non-alphanumeric characters from slug
        title_slug = "".join(c if c.isalnum() or c == "-" else "" for c in title_slug)
        filename = f"{title_slug}-{url_hash}.json"

        out_path = RAW_DIR / filename
        out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

        mark_seen(url, data.get("source_name", "unknown"))
        spider.logger.info(f"Saved raw article: {filename}")

        return item
