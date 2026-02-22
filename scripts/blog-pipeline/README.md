# HeldeeLife Blog Content Pipeline

Automated blog content generation pipeline for HeldeeLife. Fetches health/wellness articles from the web, rewrites them into original content using a local LLM (Claude CLI / Cursor Agent CLI / Ollama), stores them to Supabase, and triggers Next.js ISR revalidation so they appear as static blog pages.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Setup (Step by Step)](#setup-step-by-step)
- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [CLI Commands Reference](#cli-commands-reference)
- [LLM Providers](#llm-providers)
- [Adding Scraping Sources](#adding-scraping-sources)
- [Scheduling with Cron](#scheduling-with-cron)
- [File Structure](#file-structure)
- [How Each Step Works](#how-each-step-works)
- [Troubleshooting](#troubleshooting)

---

## How It Works

```
                        STEP 1                    STEP 2                      STEP 3
                     +-----------+          +----------------+         +----------------+
  Article URLs  ---> |  FETCH /  |  Raw     |   LLM REWRITE  | Rewrite |   PUBLISH TO   |
  or sources.yaml -> |  SCRAPE   | -------> |  (Claude CLI)  | ------> |   SUPABASE     |
                     +-----------+  JSON    +----------------+  JSON   +-------+--------+
                                                                               |
                                                                       +-------v--------+
                                                                       | ISR REVALIDATE |
                                                                       |  (Next.js)     |
                                                                       +----------------+
                                                                               |
                                                                       +-------v--------+
                                                                       |  STATIC BLOG   |
                                                                       |   PAGES LIVE   |
                                                                       +----------------+
```

**Three independent steps, each produces JSON files:**

| Step | Input | Output | Can Run Alone? |
|------|-------|--------|----------------|
| **Fetch/Scrape** | URLs or source config | `data/raw/*.json` | Yes |
| **Rewrite** | `data/raw/*.json` | `data/rewritten/*.json` | Yes |
| **Publish** | `data/rewritten/*.json` | Supabase blog_posts row | Yes |

You can run the full pipeline in one command, or run each step individually. JSON files between steps allow manual review before publishing.

---

## Prerequisites

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Python | 3.9+ | `python3 --version` | [python.org](https://www.python.org/downloads/) |
| Claude CLI | Any | `claude --version` | `npm i -g @anthropic-ai/claude-code` |
| Supabase project | - | Check dashboard | [supabase.com](https://supabase.com) |

**Optional (alternative LLM providers):**

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Cursor Agent CLI | Any | `agent --version` | Install Cursor IDE |
| Ollama | Any | `ollama --version` | [ollama.com](https://ollama.com) |

---

## Setup (Step by Step)

### 1. Navigate to the pipeline directory

```bash
cd scripts/blog-pipeline
```

### 2. Create a Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the `.env` file

```bash
cp .env.example .env
```

Now edit `.env` with your real values:

```env
# REQUIRED - Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key

# REQUIRED - Must match REVALIDATION_SECRET in the main project .env
REVALIDATION_SECRET=your_shared_secret_here

# REQUIRED - Your production site URL
SITE_URL=https://heldeelife.com

# REQUIRED - UUID of the author for published posts
# Find this in Supabase Dashboard > Authentication > Users
PIPELINE_DEFAULT_AUTHOR_ID=85a615f4-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# OPTIONAL - Only needed if using Ollama provider
OLLAMA_BASE_URL=http://localhost:11434

# OPTIONAL - Only needed if using Claude API provider (not cli-agent)
ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Add REVALIDATION_SECRET to the main project .env

Open the main project `.env` file (at the repo root) and add:

```env
REVALIDATION_SECRET=your_shared_secret_here
```

This must match the value in `scripts/blog-pipeline/.env`. The Next.js revalidation API route uses this to authenticate pipeline requests.

### 6. Find your Author ID

Go to Supabase Dashboard > Authentication > Users, and copy the UUID of the user who should be the author of pipeline-generated posts.

Or run:

```bash
source venv/bin/activate
python3 -c "
from supabase import create_client
from pipeline.settings import get_settings
s = get_settings()
client = create_client(s.supabase_url, s.supabase_service_role_key)
result = client.auth.admin.list_users()
for u in result:
    print(f'{u.id}  {u.email}')
"
```

### 7. Verify setup

```bash
source venv/bin/activate
python -m pipeline.cli status
```

Expected output:

```
Pipeline Status:
  Raw articles:       0
  Rewritten articles: 0
  Total scraped:      0
  Published:          0
  Pending publish:    0
```

---

## Quick Start (5 Minutes)

After completing setup, here is the fastest way to add a blog post:

```bash
cd scripts/blog-pipeline
source venv/bin/activate

# 1. Fetch an article
python -m pipeline.cli fetch "https://www.healthline.com/nutrition/ayurvedic-diet" --category nutrition

# 2. Rewrite it with Claude CLI (runs locally, uses your Claude account)
python -m pipeline.cli rewrite --provider cli-agent

# 3. Publish as draft to Supabase
python -m pipeline.cli publish --status draft

# 4. Check status
python -m pipeline.cli status
```

The draft post now appears in your admin panel at `/admin/blog`. Review it and change status to "published" when ready.

**Or run everything in one command:**

```bash
python -m pipeline.cli fetch "https://www.healthline.com/health/yoga-for-weight-loss" --category yoga
python -m pipeline.cli rewrite --provider cli-agent
python -m pipeline.cli publish --status draft
```

---

## CLI Commands Reference

All commands are run from `scripts/blog-pipeline/` with the venv activated:

```bash
cd scripts/blog-pipeline
source venv/bin/activate
python -m pipeline.cli <command> [options]
```

### `fetch` - Fetch articles from URLs

The simplest way to add articles. Works with any website (including JS-rendered sites).

```bash
# Fetch a single URL
python -m pipeline.cli fetch "https://example.com/article-1"

# Fetch multiple URLs
python -m pipeline.cli fetch \
  "https://example.com/article-1" \
  "https://example.com/article-2" \
  "https://example.com/article-3"

# Fetch from a file (one URL per line)
python -m pipeline.cli fetch --file urls.txt

# Set category for all fetched articles
python -m pipeline.cli fetch "https://example.com/yoga-article" --category yoga
```

| Option | Default | Description |
|--------|---------|-------------|
| `URLS` | - | One or more URLs as arguments |
| `--file` | - | Path to a text file with one URL per line |
| `--category` | `""` | Category hint (maps to `config/categories.yaml`) |

**Output:** Saves raw article JSON files to `data/raw/`

### `scrape` - Scrape from configured sources

Uses Scrapy to crawl websites defined in `config/sources.yaml`. Best for server-rendered blogs. For JS-heavy sites, use `fetch` instead.

```bash
# Scrape all configured sources
python -m pipeline.cli scrape

# Scrape a specific source
python -m pipeline.cli scrape --source healthline-nutrition

# Limit number of articles
python -m pipeline.cli scrape --source healthline-nutrition -n 5
```

| Option | Default | Description |
|--------|---------|-------------|
| `--source` | All | Source name from `config/sources.yaml` |
| `-n, --limit` | `10` | Max articles to scrape |

**Output:** Saves raw article JSON files to `data/raw/`

### `rewrite` - Rewrite articles with LLM

Takes raw articles from `data/raw/`, rewrites them into original content, generates SEO metadata, and saves to `data/rewritten/`.

```bash
# Rewrite with Claude CLI (default, recommended)
python -m pipeline.cli rewrite

# Rewrite with Cursor Agent CLI
python -m pipeline.cli rewrite --provider cli-agent --model agent

# Rewrite with Ollama (local model)
python -m pipeline.cli rewrite --provider ollama --model llama3

# Rewrite with Claude API (needs ANTHROPIC_API_KEY)
python -m pipeline.cli rewrite --provider claude

# Limit number of articles
python -m pipeline.cli rewrite -n 3
```

| Option | Default | Description |
|--------|---------|-------------|
| `--provider` | `cli-agent` | LLM provider (see [LLM Providers](#llm-providers)) |
| `--model` | varies | Model name or CLI command |
| `-n, --limit` | `0` (all) | Max articles to rewrite |

**Two-step LLM process for each article:**
1. **Content rewrite** - Generates 800-1500 words of original HTML content
2. **Metadata generation** - Generates title, slug, excerpt, meta description, keywords, tags as JSON

**Output:** Saves rewritten article JSON files to `data/rewritten/`

### `publish` - Publish to Supabase

Takes rewritten articles from `data/rewritten/` and inserts them into the Supabase `blog_posts` table.

```bash
# Publish all as drafts (recommended - review first)
python -m pipeline.cli publish --status draft

# Publish and go live immediately (triggers ISR revalidation)
python -m pipeline.cli publish --status published

# Override author
python -m pipeline.cli publish --author-id "uuid-here"

# Limit number
python -m pipeline.cli publish -n 2
```

| Option | Default | Description |
|--------|---------|-------------|
| `--status` | `draft` | Post status: `draft` or `published` |
| `--author-id` | From `.env` | Supabase user UUID for the post author |
| `-n, --limit` | `0` (all) | Max articles to publish |

**What happens during publish:**
1. Generates a unique slug (checks for collisions in Supabase)
2. Resolves category from `config/categories.yaml` (creates if not exists)
3. Resolves tags (creates if not exists)
4. Calculates SEO score (mirrors `lib/utils/blog.ts` exactly)
5. Calculates reading time (words / 200 WPM)
6. Inserts into `blog_posts` table
7. Creates `blog_post_tags` associations
8. If status is `published`, triggers ISR revalidation
9. Moves processed file to `data/rewritten/done/`

**Output:** Posts appear in Supabase and your admin panel

### `run` - Full pipeline

Runs all three steps in sequence: scrape -> rewrite -> publish.

```bash
# Full pipeline with defaults
python -m pipeline.cli run

# Full pipeline with all options
python -m pipeline.cli run \
  --provider cli-agent \
  --source healthline-nutrition \
  --status draft \
  -n 5
```

| Option | Default | Description |
|--------|---------|-------------|
| `--provider` | `cli-agent` | LLM provider |
| `--model` | varies | Model name |
| `--source` | All | Scraping source |
| `--author-id` | From `.env` | Author UUID |
| `--status` | `draft` | Post status |
| `-n, --limit` | `5` | Max articles per step |

### `status` - Pipeline status

```bash
python -m pipeline.cli status
```

Example output:

```
Pipeline Status:
  Raw articles:       4
  Rewritten articles: 2
  Total scraped:      6
  Published:          4
  Pending publish:    2
```

---

## LLM Providers

Three providers are available for rewriting articles:

### `cli-agent` (Default, Recommended)

Spawns `claude` or `agent` as a local subprocess. No API key needed - uses your existing CLI authentication.

```bash
# Uses Claude CLI (default)
python -m pipeline.cli rewrite --provider cli-agent

# Uses Cursor Agent CLI
python -m pipeline.cli rewrite --provider cli-agent --model agent
```

**Pros:** Free (uses your Claude/Cursor account), high quality, no API key management
**Cons:** Slower (~30-60s per article), requires CLI to be installed and authenticated
**Required:** `claude --version` or `agent --version` must work in your terminal

### `ollama`

Uses a locally running Ollama instance.

```bash
# Start Ollama and pull a model first
ollama pull llama3

# Then rewrite
python -m pipeline.cli rewrite --provider ollama --model llama3
```

**Pros:** Completely local and free, fast, private
**Cons:** Requires GPU for good speed, quality depends on model size
**Required:** `OLLAMA_BASE_URL` in `.env` (defaults to `http://localhost:11434`)

### `claude`

Uses the Anthropic Claude API directly via SDK.

```bash
python -m pipeline.cli rewrite --provider claude --model claude-sonnet-4-20250514
```

**Pros:** Highest quality, fastest
**Cons:** Costs money per article, requires API key
**Required:** `ANTHROPIC_API_KEY` in `.env`

---

## Adding Scraping Sources

### Option 1: Direct URLs (Simplest)

No configuration needed. Just pass URLs:

```bash
python -m pipeline.cli fetch "https://example-blog.com/article-1" --category wellness
```

Or create a file `urls.txt`:

```
# Health articles to process
https://www.healthline.com/nutrition/ayurvedic-diet
https://www.healthline.com/health/yoga-for-weight-loss
https://www.healthline.com/nutrition/turmeric-and-black-pepper
```

```bash
python -m pipeline.cli fetch --file urls.txt --category nutrition
```

### Option 2: Scrapy Sources (For server-rendered blogs)

Edit `config/sources.yaml`:

```yaml
sources:
  - name: my-health-blog           # Unique name (used in --source flag)
    base_url: https://example.com
    start_urls:                      # Pages to start crawling from
      - https://example.com/blog
      - https://example.com/articles
    allowed_domains:                 # Stay within these domains
      - example.com
    selectors:                       # CSS selectors for extracting content
      article_links: "article a[href], .post-title a[href]"
      title: "h1"
      content: ".post-content, .entry-content, article"
      tags: ".tags a, .post-tags a"
      author: ".author-name, .byline"
      published_date: "time[datetime]"
      featured_image: "article img:first-of-type"
    pagination: "a.next, a[rel='next']"  # Next page link selector
    rate_limit: 3.0                  # Seconds between requests (be polite)
    max_pages: 5                     # Max pagination pages to follow
    category_hint: wellness          # Maps to config/categories.yaml
```

Then scrape:

```bash
python -m pipeline.cli scrape --source my-health-blog -n 10
```

### Finding CSS Selectors

1. Open the target website in Chrome
2. Right-click on the article title -> "Inspect"
3. Note the CSS selector (e.g., `h1.post-title`)
4. Do the same for content area, tags, etc.
5. Test with: `document.querySelector("your-selector")` in the browser console

### Category Mapping

Edit `config/categories.yaml` to map source category hints to blog categories:

```yaml
mappings:
  ayurveda: "Ayurveda"
  wellness: "Wellness"
  yoga: "Yoga"
  nutrition: "Nutrition"
  meditation: "Meditation"
  fitness: "Fitness"
  mental-health: "Mental Health"
  skincare: "Skincare"
  recipes: "Healthy Recipes"
  lifestyle: "Lifestyle"
```

### Customizing LLM Prompts

Edit `config/prompts.yaml` to change the brand voice, rewriting instructions, or metadata format:

```yaml
system_prompt: |
  You are a health and wellness content writer for HeldeeLife...

rewrite_prompt: |
  Rewrite the following article into a fresh, original blog post...

metadata_prompt: |
  Based on the following blog post content, generate SEO metadata as JSON...
```

---

## Scheduling with Cron

### Setting up automated runs

```bash
# Open crontab editor
crontab -e
```

Add these lines (adjust paths to match your system):

```cron
# ============================================
# HeldeeLife Blog Pipeline - Daily Schedule
# ============================================

# Daily at 3 AM: Rewrite any pending raw articles
0 3 * * * cd /Users/yourname/Documents/GitHub/heldeeLife/scripts/blog-pipeline && ./venv/bin/python -m pipeline.cli rewrite --provider cli-agent >> data/cron.log 2>&1

# Daily at 4 AM: Publish rewritten articles as drafts
0 4 * * * cd /Users/yourname/Documents/GitHub/heldeeLife/scripts/blog-pipeline && ./venv/bin/python -m pipeline.cli publish --status draft >> data/cron.log 2>&1

# Weekly on Sunday at 1 AM: Full pipeline run
0 1 * * 0 cd /Users/yourname/Documents/GitHub/heldeeLife/scripts/blog-pipeline && ./venv/bin/python -m pipeline.cli run --provider cli-agent -n 10 --status draft >> data/cron.log 2>&1
```

### Checking cron logs

```bash
tail -50 scripts/blog-pipeline/data/cron.log
```

### Recommended workflow

1. **Fetch URLs manually** whenever you find good source articles
2. **Cron handles rewrite + publish** as drafts automatically
3. **Review drafts** in the admin panel (`/admin/blog`)
4. **Publish manually** by changing status to "published" in admin

---

## File Structure

```
scripts/blog-pipeline/
|
+-- .env                          # Your credentials (git-ignored)
+-- .env.example                  # Template for .env
+-- requirements.txt              # Python dependencies
+-- README.md                     # This file
|
+-- config/
|   +-- sources.yaml              # Scraping source definitions
|   +-- categories.yaml           # Category mapping rules
|   +-- prompts.yaml              # LLM prompt templates
|
+-- pipeline/
|   +-- __init__.py
|   +-- __main__.py               # Entry point for python -m pipeline.cli
|   +-- cli.py                    # Click CLI commands
|   +-- settings.py               # Pydantic settings (loads .env)
|   |
|   +-- scraper/
|   |   +-- fetch_urls.py         # Simple URL fetcher (httpx + BeautifulSoup)
|   |   +-- items.py              # RawArticleItem dataclass
|   |   +-- pipelines.py          # Scrapy item pipeline (saves to JSON)
|   |   +-- spiders/
|   |       +-- base_spider.py    # Config-driven generic Scrapy spider
|   |       +-- sitemap_spider.py # Sitemap-based discovery spider
|   |
|   +-- rewriter/
|   |   +-- base.py               # Abstract interface + factory
|   |   +-- cli_agent_rewriter.py # Claude/Agent CLI subprocess rewriter
|   |   +-- ollama_rewriter.py    # Ollama HTTP API rewriter
|   |   +-- claude_rewriter.py    # Anthropic SDK rewriter
|   |   +-- prompts.py            # Prompt loading from YAML
|   |   +-- schemas.py            # RewrittenArticle Pydantic model
|   |
|   +-- publisher/
|   |   +-- supabase_client.py    # Supabase INSERT (blog_posts + tags)
|   |   +-- seo.py                # SEO score (mirrors lib/utils/blog.ts)
|   |   +-- slug_generator.py     # Unique slug with collision check
|   |   +-- category_manager.py   # Find/create categories and tags
|   |   +-- revalidator.py        # ISR trigger via secret header
|   |
|   +-- storage/
|       +-- dedup_store.py        # SQLite URL dedup tracker
|
+-- data/                          # Runtime data (git-ignored)
    +-- raw/                       # Scraped/fetched articles (JSON)
    +-- rewritten/                 # LLM-processed articles (JSON)
    |   +-- done/                  # Published articles (moved here)
    +-- dedup.sqlite               # URL deduplication database
    +-- cron.log                   # Cron job output
```

---

## How Each Step Works

### Step 1: Fetch / Scrape

**`fetch` command** (recommended for most sites):
- Uses `httpx` with a browser-like User-Agent
- Parses HTML with BeautifulSoup
- Tries multiple common CSS selectors automatically for title, content, tags, images
- Works with most server-rendered websites
- Skips articles with less than 100 characters of content
- Tracks seen URLs in SQLite to avoid re-fetching

**`scrape` command** (for bulk crawling):
- Uses Scrapy framework with configurable CSS selectors from `config/sources.yaml`
- Respects `robots.txt`
- Rate-limited (configurable delay between requests)
- Follows pagination links
- Best for WordPress and other traditional server-rendered blogs
- Does NOT work with JavaScript-rendered sites (React, Next.js, Vue, etc.)

**Raw article JSON format:**

```json
{
  "source_url": "https://example.com/article",
  "source_name": "direct-url",
  "raw_title": "Article Title",
  "raw_content_html": "<p>The HTML content...</p>",
  "raw_content_text": "The plain text content...",
  "raw_tags": ["tag1", "tag2"],
  "raw_author": "Author Name",
  "raw_published_date": "2025-01-15",
  "raw_featured_image": "https://example.com/image.jpg",
  "category_hint": "wellness",
  "scraped_at": "2026-02-21T10:00:00"
}
```

### Step 2: LLM Rewrite

**Two-step process for quality:**

1. **Content rewrite** - Sends the raw article text to the LLM with a brand-voice system prompt. The LLM generates 800-1500 words of entirely original HTML content (headings, paragraphs, lists) inspired by the same topic.

2. **SEO metadata** - Sends the rewritten content back to the LLM and asks for structured JSON: title (30-60 chars), slug, excerpt (100-160 chars), meta description (120-160 chars), keywords (5-8), and tags (2-4).

**Rewritten article JSON format:**

```json
{
  "title": "Rewritten Title",
  "slug": "rewritten-title-slug",
  "content_html": "<p>Original rewritten content...</p>",
  "excerpt": "Compelling excerpt...",
  "meta_title": "SEO Title",
  "meta_description": "Meta description 120-160 chars...",
  "meta_keywords": ["keyword1", "keyword2", "keyword3"],
  "tags": ["Ayurveda", "Wellness"],
  "source_url": "https://original-source.com/article",
  "source_name": "direct-url",
  "category_hint": "ayurveda",
  "featured_image": ""
}
```

### Step 3: Publish to Supabase

**Inserts into these tables:**

| Table | What's inserted |
|-------|----------------|
| `blog_posts` | The main post (title, slug, content, excerpt, meta fields, SEO score, reading time) |
| `blog_categories` | Category row if it doesn't exist yet |
| `blog_tags` | Tag rows if they don't exist yet |
| `blog_post_tags` | Junction rows linking post to tags |

**SEO score calculation (mirrors `lib/utils/blog.ts` exactly):**

| Criteria | Points | How to get max |
|----------|--------|---------------|
| Title length | 0-25 | 30-60 characters |
| Meta description | 0-25 | 120-160 characters |
| Content length | 0-20 | 1000+ characters |
| Featured image | 0-10 | Any image URL |
| Keywords | 0-10 | 3+ keywords |
| Excerpt | 0-10 | 100+ characters |
| **Total** | **0-100** | |

**ISR Revalidation:**
When publishing with `--status published`, the pipeline POSTs to `/api/blog/revalidate` with the `x-revalidation-secret` header. This triggers Next.js to regenerate the static blog pages immediately.

---

## Troubleshooting

### "No .env file" or missing credentials

```
ERROR: --author-id required or set PIPELINE_DEFAULT_AUTHOR_ID
```

Make sure you copied `.env.example` to `.env` and filled in all required values:

```bash
cp .env.example .env
# Then edit .env with your credentials
```

### "CLI agent exited with code 1: Cannot be launched inside another Claude Code session"

This happens if you run the pipeline from inside a Claude Code session. The fix is already applied in the code (unsets the `CLAUDECODE` env var). If you still see this, run the pipeline from a regular terminal:

```bash
# Open a new terminal (not inside Claude Code)
cd scripts/blog-pipeline
source venv/bin/activate
python -m pipeline.cli rewrite --provider cli-agent
```

### Scrapy gets 0 articles / "Content too short"

The website likely uses JavaScript rendering (React, Next.js, Vue). Scrapy only sees the HTML shell. Use the `fetch` command instead, or provide direct article URLs:

```bash
# Instead of scrape, use fetch with specific URLs
python -m pipeline.cli fetch "https://example.com/specific-article"
```

### "Failed to fetch URL" or HTTP errors

- Check if the URL is accessible in a browser
- Some sites block non-browser user agents
- Rate limiting may apply - wait and retry
- CDN/WAF protection may block automated requests

### Duplicate slug errors

The pipeline auto-appends `-2`, `-3`, etc. for slug collisions. If you see errors, check the Supabase `blog_posts` table for existing slugs.

### Revalidation not working

1. Verify `REVALIDATION_SECRET` matches in both `.env` files (pipeline and main project)
2. Verify your Next.js app is running and accessible at `SITE_URL`
3. Check the revalidation route: `POST /api/blog/revalidate` with header `x-revalidation-secret`

### Python version errors

If you see `SyntaxError` related to type hints, ensure you're using the virtual environment:

```bash
source venv/bin/activate
which python    # Should point to venv/bin/python
python --version  # Should be 3.9+
```

### Reset the pipeline

To start fresh:

```bash
# Remove all scraped and rewritten data
rm -rf data/raw/*.json data/rewritten/*.json data/dedup.sqlite

# Check clean status
python -m pipeline.cli status
```

To remove published posts from Supabase, use the admin panel or Supabase Dashboard.
