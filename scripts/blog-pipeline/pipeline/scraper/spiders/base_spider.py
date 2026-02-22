"""Config-driven generic spider that reads selectors from sources.yaml."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urljoin

import scrapy
from scrapy.crawler import CrawlerProcess
from bs4 import BeautifulSoup
import yaml

from pipeline.scraper.items import RawArticleItem
from pipeline.storage.dedup_store import is_seen
from pipeline.settings import CONFIG_DIR, RAW_DIR, ensure_dirs


class BaseArticleSpider(scrapy.Spider):
    """Generic spider driven by source config from sources.yaml."""

    name = "base_article"

    custom_settings = {
        "ITEM_PIPELINES": {
            "pipeline.scraper.pipelines.SaveRawArticlePipeline": 300,
        },
        "ROBOTSTXT_OBEY": True,
        "LOG_LEVEL": "INFO",
        "CONCURRENT_REQUESTS": 1,
        "USER_AGENT": "HeldeeLifeBot/1.0 (+https://heldeelife.com)",
    }

    def __init__(self, source_config: dict, limit: int = 10, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.source_config = source_config
        self.limit = limit
        self.scraped_count = 0
        self.start_urls = source_config.get("start_urls", [])
        self.allowed_domains = source_config.get("allowed_domains", [])
        self.selectors = source_config.get("selectors", {})
        self.pagination_selector = source_config.get("pagination")
        self.max_pages = source_config.get("max_pages", 5)
        self.current_page = 0
        self.rate_limit = source_config.get("rate_limit", 2.0)
        self.custom_settings["DOWNLOAD_DELAY"] = self.rate_limit

    def parse(self, response):
        """Parse listing page — extract article links and follow pagination."""
        link_selector = self.selectors.get("article_links", "article a[href]")
        links = response.css(link_selector).getall()

        # Extract hrefs from the matched elements
        seen_urls = set()
        for link_html in links:
            soup = BeautifulSoup(link_html, "html.parser")
            a_tag = soup.find("a")
            if a_tag and a_tag.get("href"):
                url = urljoin(response.url, a_tag["href"])
                if url not in seen_urls and not is_seen(url):
                    seen_urls.add(url)
                    if self.scraped_count < self.limit:
                        yield scrapy.Request(url, callback=self.parse_article)

        # Also try extracting href attributes directly
        for href in response.css(f"{link_selector}::attr(href)").getall():
            url = urljoin(response.url, href)
            if url not in seen_urls and not is_seen(url):
                seen_urls.add(url)
                if self.scraped_count < self.limit:
                    yield scrapy.Request(url, callback=self.parse_article)

        # Follow pagination
        self.current_page += 1
        if self.pagination_selector and self.current_page < self.max_pages:
            next_page = response.css(f"{self.pagination_selector}::attr(href)").get()
            if next_page:
                yield response.follow(next_page, callback=self.parse)

    def parse_article(self, response):
        """Parse individual article page."""
        if self.scraped_count >= self.limit:
            return

        sel = self.selectors
        title = self._extract_text(response, sel.get("title", "h1"))
        if not title:
            self.logger.warning(f"No title found for {response.url}, skipping")
            return

        # Extract content HTML and text
        content_html = ""
        content_text = ""
        content_selector = sel.get("content", "article")
        content_elements = response.css(content_selector).getall()
        if content_elements:
            content_html = "\n".join(content_elements)
            soup = BeautifulSoup(content_html, "html.parser")
            # Remove script and style tags
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            content_text = soup.get_text(separator="\n", strip=True)

        if not content_text or len(content_text) < 100:
            self.logger.warning(f"Content too short for {response.url}, skipping")
            return

        # Extract tags
        tags = []
        tag_selector = sel.get("tags")
        if tag_selector:
            tags = response.css(f"{tag_selector}::text").getall()
            tags = [t.strip() for t in tags if t.strip()]

        # Extract other fields
        author = self._extract_text(response, sel.get("author", ".author"))
        published_date = (
            response.css(f"{sel.get('published_date', 'time')}::attr(datetime)").get()
            or self._extract_text(response, sel.get("published_date", "time"))
        )
        featured_image = response.css(
            f"{sel.get('featured_image', 'img')}::attr(src)"
        ).get() or ""
        if featured_image:
            featured_image = urljoin(response.url, featured_image)

        item = RawArticleItem(
            source_url=response.url,
            source_name=self.source_config.get("name", "unknown"),
            raw_title=title,
            raw_content_html=content_html,
            raw_content_text=content_text,
            raw_tags=tags,
            raw_author=author,
            raw_published_date=published_date or "",
            raw_featured_image=featured_image,
            category_hint=self.source_config.get("category_hint", ""),
        )

        self.scraped_count += 1
        yield item.to_dict()

    def _extract_text(self, response, selector: str) -> str:
        """Extract text content using a CSS selector."""
        text = response.css(f"{selector}::text").get()
        return text.strip() if text else ""


def load_sources(source_name: str | None = None) -> list[dict]:
    """Load source configs from sources.yaml."""
    sources_path = CONFIG_DIR / "sources.yaml"
    if not sources_path.exists():
        raise FileNotFoundError(f"Sources config not found: {sources_path}")

    with open(sources_path) as f:
        config = yaml.safe_load(f)

    sources = config.get("sources", [])
    if source_name:
        sources = [s for s in sources if s.get("name") == source_name]
        if not sources:
            raise ValueError(f"Source '{source_name}' not found in sources.yaml")

    return sources


def run_spider(source_name: str | None = None, limit: int = 10) -> int:
    """Run the spider for configured sources. Returns count of scraped articles."""
    ensure_dirs()
    sources = load_sources(source_name)

    # Count existing raw files before
    before = len(list(RAW_DIR.glob("*.json")))

    process = CrawlerProcess(settings={
        "LOG_LEVEL": "INFO",
        "REQUEST_FINGERPRINTER_IMPLEMENTATION": "2.7",
    })

    for source in sources:
        process.crawl(BaseArticleSpider, source_config=source, limit=limit)

    process.start()

    after = len(list(RAW_DIR.glob("*.json")))
    return after - before
