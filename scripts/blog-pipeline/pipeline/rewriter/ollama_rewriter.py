"""Ollama-based LLM rewriter using local models."""

import json
import httpx

from pipeline.rewriter.base import BaseRewriter
from pipeline.rewriter.prompts import get_system_prompt, get_rewrite_prompt, get_metadata_prompt
from pipeline.rewriter.schemas import RewrittenArticle


class OllamaRewriter(BaseRewriter):
    """Rewriter using local Ollama API."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3"):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_url = f"{self.base_url}/api/chat"

    def _chat(self, system: str, user: str) -> str:
        """Send a chat completion request to Ollama."""
        response = httpx.post(
            self.api_url,
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "stream": False,
            },
            timeout=300.0,
        )
        response.raise_for_status()
        return response.json()["message"]["content"]

    def rewrite(self, raw_article: dict) -> dict:
        """Two-step rewrite: content then metadata."""
        title = raw_article.get("raw_title", "")
        content = raw_article.get("raw_content_text", "")

        # Step 1: Rewrite content
        system = get_system_prompt()
        rewrite_prompt = get_rewrite_prompt(title, content[:5000])
        rewritten_html = self._chat(system, rewrite_prompt)

        # Step 2: Generate metadata
        meta_prompt = get_metadata_prompt(rewritten_html)
        meta_response = self._chat(system, meta_prompt)

        # Parse metadata JSON
        metadata = self._parse_json(meta_response)

        article = RewrittenArticle(
            title=metadata.get("title", title),
            slug=metadata.get("slug", ""),
            content_html=rewritten_html,
            excerpt=metadata.get("excerpt", ""),
            meta_title=metadata.get("meta_title", ""),
            meta_description=metadata.get("meta_description", ""),
            meta_keywords=metadata.get("meta_keywords", []),
            tags=metadata.get("tags", []),
            source_url=raw_article.get("source_url", ""),
            source_name=raw_article.get("source_name", ""),
            category_hint=raw_article.get("category_hint", ""),
            featured_image=raw_article.get("raw_featured_image", ""),
        )

        return article.to_dict()

    def _parse_json(self, text: str) -> dict:
        """Extract JSON from LLM response, handling markdown code blocks."""
        text = text.strip()
        # Try to find JSON in code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            # Try to find the first { ... } block
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(text[start : end + 1])
            return {}
