"""Simple URL-based article fetcher using httpx + BeautifulSoup.

Use this when Scrapy can't extract content from JS-rendered sites.
Provide a list of article URLs directly and this fetcher will extract content.
"""
from __future__ import annotations

import json
import hashlib
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

from pipeline.scraper.items import RawArticleItem
from pipeline.scraper.pipelines import SaveRawArticlePipeline
from pipeline.storage.dedup_store import is_seen, mark_seen
from pipeline.settings import RAW_DIR, ensure_dirs


# Common content selectors to try, in order of specificity
CONTENT_SELECTORS = [
    "article .entry-content",
    "article .post-content",
    "article .article-body",
    "article .article__body",
    ".post-body",
    "article .content",
    ".entry-content",
    "article",
    "main",
]

TITLE_SELECTORS = ["h1.entry-title", "h1.post-title", "article h1", "h1"]


def fetch_article(url: str, category_hint: str = "", rate_limit: float = 2.0) -> RawArticleItem | None:
    """Fetch and parse a single article URL.

    Uses httpx with a browser-like user agent and BeautifulSoup for parsing.
    Tries multiple common content selectors.
    """
    if is_seen(url):
        return None

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        response = httpx.get(url, headers=headers, follow_redirects=True, timeout=30.0)
        response.raise_for_status()
    except Exception as e:
        print(f"  Failed to fetch {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noise elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe"]):
        tag.decompose()

    # Extract title
    title = ""
    for sel in TITLE_SELECTORS:
        el = soup.select_one(sel)
        if el:
            title = el.get_text(strip=True)
            break
    if not title:
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else ""

    if not title:
        print(f"  No title found for {url}")
        return None

    # Extract content
    content_html = ""
    content_text = ""
    for sel in CONTENT_SELECTORS:
        el = soup.select_one(sel)
        if el:
            content_html = str(el)
            content_text = el.get_text(separator="\n", strip=True)
            if len(content_text) >= 100:
                break

    if len(content_text) < 100:
        print(f"  Content too short for {url} ({len(content_text)} chars)")
        return None

    # Extract tags
    tags = []
    for tag_sel in [".tags a", ".post-tags a", ".article-tags a", 'a[rel="tag"]']:
        tag_elements = soup.select(tag_sel)
        if tag_elements:
            tags = [t.get_text(strip=True) for t in tag_elements]
            break

    # Extract featured image
    featured_image = ""
    for img_sel in [".featured-image img", "article img", ".hero-image img", "img"]:
        img = soup.select_one(img_sel)
        if img and img.get("src"):
            featured_image = img["src"]
            if not featured_image.startswith("http"):
                from urllib.parse import urljoin
                featured_image = urljoin(url, featured_image)
            break

    # Extract author
    author = ""
    for author_sel in [".author-name", ".byline", ".author", '[rel="author"]']:
        el = soup.select_one(author_sel)
        if el:
            author = el.get_text(strip=True)
            break

    # Extract date
    published_date = ""
    time_el = soup.find("time")
    if time_el:
        published_date = time_el.get("datetime", time_el.get_text(strip=True))

    item = RawArticleItem(
        source_url=url,
        source_name="direct-url",
        raw_title=title,
        raw_content_html=content_html,
        raw_content_text=content_text,
        raw_tags=tags,
        raw_author=author,
        raw_published_date=published_date,
        raw_featured_image=featured_image,
        category_hint=category_hint,
    )

    time.sleep(rate_limit)
    return item


def fetch_urls(urls: list[str], category_hint: str = "", rate_limit: float = 2.0) -> int:
    """Fetch multiple article URLs and save to data/raw/.

    Returns count of newly saved articles.
    """
    ensure_dirs()
    count = 0

    for url in urls:
        url = url.strip()
        if not url or is_seen(url):
            continue

        print(f"  Fetching: {url}")
        item = fetch_article(url, category_hint=category_hint, rate_limit=rate_limit)
        if item:
            # Save to file
            data = item.to_dict()
            url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
            title_slug = item.raw_title.lower().replace(" ", "-")[:50]
            title_slug = "".join(c if c.isalnum() or c == "-" else "" for c in title_slug)
            filename = f"{title_slug}-{url_hash}.json"

            out_path = RAW_DIR / filename
            out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
            mark_seen(url, "direct-url")
            print(f"    -> Saved: {filename}")
            count += 1

    return count
