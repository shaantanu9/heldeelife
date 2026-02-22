"""Claude API-based LLM rewriter."""

import json
import anthropic

from pipeline.rewriter.base import BaseRewriter
from pipeline.rewriter.prompts import get_system_prompt, get_rewrite_prompt, get_metadata_prompt
from pipeline.rewriter.schemas import RewrittenArticle


class ClaudeRewriter(BaseRewriter):
    """Rewriter using Anthropic Claude API."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is required for Claude rewriter")
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def _chat(self, system: str, user: str) -> str:
        """Send a message to Claude API."""
        message = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return message.content[0].text

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
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(text[start : end + 1])
            return {}
