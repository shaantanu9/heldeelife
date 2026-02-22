"""CLI Agent rewriter — spawns claude/agent CLI as subprocess for LLM rewriting.

Uses the pattern from docs/agent-cli/AGENT_DRIVER_INTEGRATION_GUIDE.md:
- Spawn CLI with -p (print mode) + --output-format json
- Close stdin immediately (non-interactive)
- Collect stdout JSON, parse result
- No API keys needed — CLI handles its own auth
"""
from __future__ import annotations

import json
import os
import subprocess
import re

from pipeline.rewriter.base import BaseRewriter
from pipeline.rewriter.prompts import get_system_prompt, get_rewrite_prompt, get_metadata_prompt
from pipeline.rewriter.schemas import RewrittenArticle

# Instruction prepended to all prompts to prevent tool use
_TEXT_ONLY_INSTRUCTION = (
    "IMPORTANT: You are being used as a text generation engine. "
    "Do NOT use any tools (no file reads, writes, bash, web search, etc). "
    "Do NOT create files. Just output the requested text directly in your response.\n\n"
)


class CliAgentRewriter(BaseRewriter):
    """Rewriter that spawns claude/agent CLI as a subprocess."""

    def __init__(self, command: str = "claude", timeout: int = 600):
        self.command = command
        self.timeout = timeout
        self.cli_type = self._detect_cli(command)

    def _detect_cli(self, command: str) -> str:
        basename = os.path.basename(command).lower()
        if basename in ("claude", "claude-code"):
            return "claude"
        return "agent"

    def _build_args(self, prompt: str, system_context: str | None = None) -> list:
        # Prepend text-only instruction
        prompt = _TEXT_ONLY_INSTRUCTION + prompt

        args = []
        if self.cli_type == "claude":
            args.extend(["-p", prompt])
            args.extend(["--output-format", "json"])
            # Prevent tool use — text generation only
            args.extend(["--allowedTools", ""])
            if system_context:
                args.extend(["--append-system-prompt", system_context])
        else:
            # Agent/Cursor — prepend context into prompt
            if system_context:
                full_prompt = f"<context>\n{system_context}\n</context>\n\n{prompt}"
            else:
                full_prompt = prompt
            args.extend(["-p", full_prompt])
            args.extend(["--output-format", "json"])
            args.extend(["--trust", "--force"])
        return args

    def _run_cli(self, prompt: str, system_context: str | None = None) -> str:
        """Spawn the CLI agent and return the result text."""
        args = self._build_args(prompt, system_context)

        # Build clean env — unset CLAUDECODE to allow nested CLI spawning
        env = os.environ.copy()
        env.pop("CLAUDECODE", None)
        env.pop("CLAUDE_CODE", None)

        proc = subprocess.run(
            [self.command] + args,
            capture_output=True,
            text=True,
            timeout=self.timeout,
            stdin=subprocess.DEVNULL,
            env=env,
        )

        stdout = proc.stdout.strip()

        # Parse JSON output
        try:
            parsed = json.loads(stdout)
        except json.JSONDecodeError:
            # Not JSON — return raw stdout
            if proc.returncode != 0:
                raise RuntimeError(
                    f"CLI agent exited with code {proc.returncode}: {proc.stderr[:500]}"
                )
            return stdout

        # Claude Code format: {"result": "...", "session_id": "..."}
        if "result" in parsed:
            return parsed["result"]

        # Claude Code format: {"content": [{"type": "text", "text": "..."}]}
        if "content" in parsed and isinstance(parsed["content"], list):
            texts = [
                block["text"]
                for block in parsed["content"]
                if block.get("type") == "text"
            ]
            return "\n".join(texts)

        # Fallback
        return stdout

    def rewrite(self, raw_article: dict) -> dict:
        """Two-step rewrite using CLI agent: content then metadata."""
        title = raw_article.get("raw_title", "")
        content = raw_article.get("raw_content_text", "")

        system = get_system_prompt()

        # Step 1: Rewrite content
        rewrite_prompt = get_rewrite_prompt(title, content[:5000])
        rewritten_html = self._run_cli(rewrite_prompt, system_context=system)

        # Clean HTML: strip code blocks and preamble/postamble text
        rewritten_html = self._clean_html(rewritten_html)

        # Step 2: Generate metadata as JSON
        meta_prompt = get_metadata_prompt(rewritten_html)
        meta_response = self._run_cli(meta_prompt, system_context=system)
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

    def _clean_html(self, text: str) -> str:
        """Strip markdown code blocks and preamble/postamble from HTML content."""
        text = text.strip()

        # Extract from ```html ... ``` blocks
        if "```html" in text:
            text = text.split("```html", 1)[1]
            if "```" in text:
                text = text.split("```")[0]
        elif "```" in text and "<" in text:
            # Generic code block containing HTML
            parts = text.split("```")
            for part in parts:
                if "<p>" in part or "<h2>" in part:
                    text = part
                    break

        text = text.strip()

        # If there's preamble text before first HTML tag, remove it
        first_tag = re.search(r"<(p|h[1-6]|div|article|ul|ol)\b", text)
        if first_tag and first_tag.start() > 0:
            text = text[first_tag.start():]

        # Trim postamble after last closing HTML tag
        matches = list(re.finditer(r"</(p|h[1-6]|div|article|ul|ol)>", text))
        if matches:
            last_close = matches[-1].end()
            if last_close < len(text):
                remaining = text[last_close:].strip()
                # Only trim if remaining text doesn't contain more HTML
                if "<" not in remaining:
                    text = text[:last_close]

        return text.strip()

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
                try:
                    return json.loads(text[start : end + 1])
                except json.JSONDecodeError:
                    return {}
            return {}
