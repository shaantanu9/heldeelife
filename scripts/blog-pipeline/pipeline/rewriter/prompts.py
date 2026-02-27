"""Prompt construction from YAML templates and products config."""
from __future__ import annotations

import json
from pathlib import Path
import yaml

from pipeline.settings import CONFIG_DIR

_prompts_cache: dict | None = None
_products_cache: dict | None = None


def _load_prompts() -> dict:
    global _prompts_cache
    if _prompts_cache is None:
        prompts_path = CONFIG_DIR / "prompts.yaml"
        with open(prompts_path) as f:
            _prompts_cache = yaml.safe_load(f)
    return _prompts_cache


def _load_products_config() -> dict:
    """Load editable products list (name, link) for natural product linking."""
    global _products_cache
    if _products_cache is None:
        products_path = CONFIG_DIR / "products.json"
        if not products_path.exists():
            _products_cache = {"brand_name": "HeldeeLife", "brand_url": "https://www.heldeelife.com", "products": []}
            return _products_cache
        with open(products_path) as f:
            _products_cache = json.load(f)
    return _products_cache


def get_products_for_prompt() -> str:
    """Format products from products.json for the rewrite prompt (name, URL, category for topic matching)."""
    cfg = _load_products_config()
    brand = cfg.get("brand_name", "HeldeeLife")
    brand_url = cfg.get("brand_url", "https://www.heldeelife.com")
    products = cfg.get("products", [])
    lines = [
        f"Brand: {brand} — {brand_url}",
        "",
        "Choose 1–3 products that match the article topic (use category to match):",
        "",
    ]
    for p in products:
        name = p.get("name", p.get("short_name", ""))
        url = p.get("url", brand_url)
        short = p.get("short_name", name)
        category = p.get("category", "")
        cat_hint = f" [topic: {category}]" if category else ""
        lines.append(f"  - {name} (in text use '{short}') — {url}{cat_hint}")
    return "\n".join(lines) if lines else f"Brand: {brand} — {brand_url}"


def get_system_prompt() -> str:
    return _load_prompts()["system_prompt"].strip()


def get_rewrite_prompt(title: str, content: str) -> str:
    template = _load_prompts()["rewrite_prompt"]
    products_for_prompt = get_products_for_prompt()
    return template.format(
        title=title,
        content=content,
        products_for_prompt=products_for_prompt,
    ).strip()


def get_topic_rewrite_prompt(topic: str) -> str:
    """Prompt for writing a new blog post from a topic only (no source article).
    Products from products.json are injected so they feel like part of the blog."""
    template = _load_prompts().get("topic_rewrite_prompt")
    if not template:
        # Fallback: use rewrite prompt with topic as minimal "content"
        return get_rewrite_prompt(
            title=topic,
            content=f"Write a comprehensive, original blog post about: {topic}",
        )
    products_for_prompt = get_products_for_prompt()
    return template.format(
        topic=topic.strip(),
        products_for_prompt=products_for_prompt,
    ).strip()


def get_metadata_prompt(content: str) -> str:
    template = _load_prompts()["metadata_prompt"]
    return template.format(content=content[:3000]).strip()
