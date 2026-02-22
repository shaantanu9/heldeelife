"""Abstract rewriter interface and factory."""
from __future__ import annotations

from abc import ABC, abstractmethod

from pipeline.settings import Settings


class BaseRewriter(ABC):
    """Abstract base class for LLM rewriters."""

    @abstractmethod
    def rewrite(self, raw_article: dict) -> dict:
        """Rewrite a raw article and return a dict matching RewrittenArticle schema.

        Two-step process:
        1. Rewrite content body
        2. Generate SEO metadata as JSON
        """
        ...


def get_rewriter(provider: str, model: str | None, settings: Settings) -> BaseRewriter:
    """Factory function to create the appropriate rewriter."""
    if provider == "ollama":
        from pipeline.rewriter.ollama_rewriter import OllamaRewriter
        return OllamaRewriter(
            base_url=settings.ollama_base_url,
            model=model or "llama3",
        )
    elif provider == "claude":
        from pipeline.rewriter.claude_rewriter import ClaudeRewriter
        return ClaudeRewriter(
            api_key=settings.anthropic_api_key,
            model=model or "claude-sonnet-4-20250514",
        )
    elif provider == "cli-agent":
        from pipeline.rewriter.cli_agent_rewriter import CliAgentRewriter
        return CliAgentRewriter(
            command=model or "claude",  # model param doubles as CLI command
            timeout=600,
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")
