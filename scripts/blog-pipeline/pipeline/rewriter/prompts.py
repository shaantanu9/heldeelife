"""Prompt construction from YAML templates."""
from __future__ import annotations

from pathlib import Path
import yaml

from pipeline.settings import CONFIG_DIR


_prompts_cache: dict | None = None


def _load_prompts() -> dict:
    global _prompts_cache
    if _prompts_cache is None:
        prompts_path = CONFIG_DIR / "prompts.yaml"
        with open(prompts_path) as f:
            _prompts_cache = yaml.safe_load(f)
    return _prompts_cache


def get_system_prompt() -> str:
    return _load_prompts()["system_prompt"].strip()


def get_rewrite_prompt(title: str, content: str) -> str:
    template = _load_prompts()["rewrite_prompt"]
    return template.format(title=title, content=content).strip()


def get_metadata_prompt(content: str) -> str:
    template = _load_prompts()["metadata_prompt"]
    return template.format(content=content[:3000]).strip()
