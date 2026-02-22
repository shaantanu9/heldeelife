"""Click CLI for the blog content pipeline."""
from __future__ import annotations

import json
import glob as globmod
from pathlib import Path

import click

from pipeline.settings import get_settings, ensure_dirs, RAW_DIR, REWRITTEN_DIR


@click.group()
def cli():
    """HeldeeLife blog content pipeline."""
    ensure_dirs()


@cli.command()
@click.option("--source", default=None, help="Source name from sources.yaml (or all)")
@click.option("-n", "--limit", default=10, help="Max articles to scrape")
def scrape(source: str | None, limit: int):
    """Scrape articles from configured sources."""
    from pipeline.scraper.spiders.base_spider import run_spider

    click.echo(f"Scraping up to {limit} articles...")
    count = run_spider(source_name=source, limit=limit)
    click.echo(f"Scraped {count} new articles to {RAW_DIR}")


@cli.command()
@click.argument("urls", nargs=-1)
@click.option("--file", "url_file", default=None, help="File with one URL per line")
@click.option("--category", default="", help="Category hint for all URLs")
def fetch(urls: tuple, url_file: str | None, category: str):
    """Fetch articles from specific URLs (bypasses Scrapy, works with JS sites)."""
    from pipeline.scraper.fetch_urls import fetch_urls

    url_list = list(urls)
    if url_file:
        with open(url_file) as f:
            url_list.extend(line.strip() for line in f if line.strip() and not line.startswith("#"))

    if not url_list:
        click.echo("No URLs provided. Pass URLs as arguments or use --file.")
        return

    click.echo(f"Fetching {len(url_list)} URLs...")
    count = fetch_urls(url_list, category_hint=category)
    click.echo(f"Fetched {count} new articles to {RAW_DIR}")


@cli.command()
@click.option("--provider", type=click.Choice(["ollama", "claude", "cli-agent"]), default="cli-agent")
@click.option("--model", default=None, help="Model name or CLI command (e.g. llama3, claude, agent)")
@click.option("-n", "--limit", default=0, help="Max articles to rewrite (0 = all pending)")
def rewrite(provider: str, model: str | None, limit: int):
    """Rewrite raw articles with LLM."""
    from pipeline.rewriter.base import get_rewriter

    settings = get_settings()
    rewriter = get_rewriter(provider, model, settings)

    raw_files = sorted(Path(RAW_DIR).glob("*.json"))
    rewritten_stems = {f.stem for f in Path(REWRITTEN_DIR).glob("*.json")}
    pending = [f for f in raw_files if f.stem not in rewritten_stems]

    if limit > 0:
        pending = pending[:limit]

    if not pending:
        click.echo("No pending articles to rewrite.")
        return

    click.echo(f"Rewriting {len(pending)} articles with {provider}...")
    for raw_file in pending:
        raw = json.loads(raw_file.read_text())
        click.echo(f"  Rewriting: {raw.get('raw_title', raw_file.stem)}")
        try:
            result = rewriter.rewrite(raw)
            out_path = REWRITTEN_DIR / raw_file.name
            out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
            click.echo(f"    -> {out_path.name}")
        except Exception as e:
            click.echo(f"    ERROR: {e}", err=True)

    click.echo("Rewrite complete.")


@cli.command()
@click.option("--status", type=click.Choice(["draft", "published"]), default="draft")
@click.option("--author-id", default=None, help="Author UUID")
@click.option("-n", "--limit", default=0, help="Max articles to publish (0 = all pending)")
def publish(status: str, author_id: str | None, limit: int):
    """Publish rewritten articles to Supabase."""
    from pipeline.publisher.supabase_client import publish_article
    from pipeline.publisher.revalidator import trigger_revalidation
    from pipeline.storage.dedup_store import mark_published

    settings = get_settings()
    author = author_id or settings.pipeline_default_author_id
    if not author:
        click.echo("ERROR: --author-id required or set PIPELINE_DEFAULT_AUTHOR_ID", err=True)
        return

    rewritten_files = sorted(Path(REWRITTEN_DIR).glob("*.json"))
    if limit > 0:
        rewritten_files = rewritten_files[:limit]

    if not rewritten_files:
        click.echo("No rewritten articles to publish.")
        return

    click.echo(f"Publishing {len(rewritten_files)} articles as '{status}'...")
    published_slugs = []
    for f in rewritten_files:
        article = json.loads(f.read_text())
        click.echo(f"  Publishing: {article.get('title', f.stem)}")
        try:
            slug = publish_article(article, author_id=author, status=status, settings=settings)
            published_slugs.append(slug)
            source_url = article.get("source_url", "")
            if source_url:
                mark_published(source_url)
            # Move processed file
            done_dir = REWRITTEN_DIR / "done"
            done_dir.mkdir(exist_ok=True)
            f.rename(done_dir / f.name)
            click.echo(f"    -> Published as /{slug}")
        except Exception as e:
            click.echo(f"    ERROR: {e}", err=True)

    if published_slugs and status == "published":
        click.echo("Triggering ISR revalidation...")
        for slug in published_slugs:
            try:
                trigger_revalidation(slug, settings)
            except Exception as e:
                click.echo(f"  Revalidation error for {slug}: {e}", err=True)

    click.echo(f"Published {len(published_slugs)} articles.")


@cli.command()
@click.option("--provider", type=click.Choice(["ollama", "claude", "cli-agent"]), default="cli-agent")
@click.option("--model", default=None, help="Model name or CLI command")
@click.option("--author-id", default=None, help="Author UUID")
@click.option("--status", type=click.Choice(["draft", "published"]), default="draft")
@click.option("--source", default=None, help="Source name from sources.yaml")
@click.option("-n", "--limit", default=5, help="Max articles per step")
def run(provider: str, model: str | None, author_id: str | None, status: str, source: str | None, limit: int):
    """Run the full pipeline: scrape -> rewrite -> publish."""
    ctx = click.get_current_context()

    click.echo("=== SCRAPE ===")
    ctx.invoke(scrape, source=source, limit=limit)

    click.echo("\n=== REWRITE ===")
    ctx.invoke(rewrite, provider=provider, model=model, limit=limit)

    click.echo("\n=== PUBLISH ===")
    ctx.invoke(publish, status=status, author_id=author_id, limit=limit)

    click.echo("\nPipeline complete.")


@cli.command()
def status():
    """Show pipeline status and stats."""
    from pipeline.storage.dedup_store import get_stats

    raw_count = len(list(Path(RAW_DIR).glob("*.json")))
    rewritten_count = len(list(Path(REWRITTEN_DIR).glob("*.json")))
    dedup = get_stats()

    click.echo("Pipeline Status:")
    click.echo(f"  Raw articles:       {raw_count}")
    click.echo(f"  Rewritten articles: {rewritten_count}")
    click.echo(f"  Total scraped:      {dedup['total_scraped']}")
    click.echo(f"  Published:          {dedup['published']}")
    click.echo(f"  Pending publish:    {dedup['pending']}")
