"""Sitemap-based spider for discovering articles."""

from urllib.parse import urljoin

import scrapy
from scrapy.spiders import SitemapSpider as ScrapySitemapSpider
from bs4 import BeautifulSoup

from pipeline.scraper.items import RawArticleItem
from pipeline.storage.dedup_store import is_seen


class SitemapArticleSpider(ScrapySitemapSpider):
    """Discovers articles via sitemap.xml and extracts content."""

    name = "sitemap_article"

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
        self.source_config = source_config
        self.limit = limit
        self.scraped_count = 0
        self.selectors = source_config.get("selectors", {})

        # Set sitemap URLs
        self.sitemap_urls = source_config.get(
            "sitemap_urls",
            [f"{source_config['base_url'].rstrip('/')}/sitemap.xml"],
        )
        self.sitemap_rules = [("", "parse_article")]
        self.allowed_domains = source_config.get("allowed_domains", [])

        # Rate limiting
        self.custom_settings["DOWNLOAD_DELAY"] = source_config.get("rate_limit", 2.0)

        super().__init__(*args, **kwargs)

    def parse_article(self, response):
        """Parse an article page found via sitemap."""
        if self.scraped_count >= self.limit:
            return

        if is_seen(response.url):
            return

        sel = self.selectors
        title = self._extract_text(response, sel.get("title", "h1"))
        if not title:
            return

        content_html = ""
        content_text = ""
        content_selector = sel.get("content", "article")
        content_elements = response.css(content_selector).getall()
        if content_elements:
            content_html = "\n".join(content_elements)
            soup = BeautifulSoup(content_html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            content_text = soup.get_text(separator="\n", strip=True)

        if not content_text or len(content_text) < 100:
            return

        tags = []
        tag_selector = sel.get("tags")
        if tag_selector:
            tags = response.css(f"{tag_selector}::text").getall()
            tags = [t.strip() for t in tags if t.strip()]

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
            raw_author=self._extract_text(response, sel.get("author", ".author")),
            raw_published_date=(
                response.css(f"{sel.get('published_date', 'time')}::attr(datetime)").get() or ""
            ),
            raw_featured_image=featured_image,
            category_hint=self.source_config.get("category_hint", ""),
        )

        self.scraped_count += 1
        yield item.to_dict()

    def _extract_text(self, response, selector: str) -> str:
        text = response.css(f"{selector}::text").get()
        return text.strip() if text else ""
