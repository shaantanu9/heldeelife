# Rewriter, product linking & SEO — canonical guide

This document is the **single reference** for how the blog pipeline rewriter works, how product linking is done, and how it supports **ranking and discoverability**. Use it so any AI or developer can "get it properly" and keep the pipeline working as intended.

**Related config files:**

| File | Purpose |
|------|--------|
| [prompts.yaml](./prompts.yaml) | LLM system + rewrite + metadata prompts |
| [products.json](./products.json) | Product list (name, URL, category) — source of truth for linking |
| [README-products.md](./README-products.md) | How to edit `products.json` |

---

## 1. Rewriter goals (why we write this way)

- **Reader experience:** The reader should **feel good while reading** and **stay interested**. Content should be easy to follow and scannable.
- **Structure:** Write **pointwise and proper**:
  - Short paragraphs (2–4 sentences), one idea per paragraph.
  - Bulleted or numbered lists for tips, steps, takeaways.
  - Clear H2/H3 headings so the reader can scan.
  - Engaging intro; one soft CTA at the end (e.g. heldeelife.com).
- **Originality:** 100% original content — no copying or close paraphrasing of the source. Own voice, Indian/Ayurvedic perspective, unique examples.

This structure helps both **readers** (engagement, clarity) and **ranking** (signals like time on page, structure, relevance).

---

## 2. Product linking (how it works)

- **Source of truth:** [config/products.json](./products.json). The rewriter **loads this file** and passes the product list (with names, URLs, and **categories**) into the rewrite prompt.
- **Topic matching:** Products are chosen by **article topic** using the `category` field in `products.json`:
  - Cold/cough article → `cold_relief` products (e.g. Kadha Mix, Vapor Patch, Cold Relief Pack).
  - Immunity article → `immunity` products (e.g. Immunity Booster).
  - Nasal congestion article → `nasal_care` products (e.g. Tulsi Nasal Spray).
- **How many:** 1–3 products per article, only where they genuinely fit.
- **How it should read:** Product mentions must be **so simple and natural** that they do **not** read as ads. One brief, contextual mention per product (e.g. "A tulsi-based nasal spray can help with congestion" with a single inline link). No hype, no "buy now", no repeated product CTAs. Goal: it reads like **editorial advice**, not sponsored content — so natural that even an LLM would not easily classify it as a "product ad".

Linking from quality, relevant content in this way supports **relevance and trust** for both users and search.

---

## 3. SEO and ranking

- **Content quality:** Pointwise, clear, original content with practical advice supports engagement and relevance — both user and ranking signals.
- **Metadata:** The rewriter generates SEO metadata (title, slug, excerpt, meta_title, meta_description, meta_keywords, tags) via the **metadata prompt** in `prompts.yaml`. The publish step stores this and uses it for:
  - Blog listing and post pages (titles, descriptions).
  - SEO score calculation (mirrors `lib/utils/blog.ts`).
- **Internal linking:** Product links point to real URLs from `products.json` (shop or product pages), so we get valid internal links without fake or placeholder URLs.
- **No black-hat:** No keyword stuffing, no exaggerated claims. Natural language and one soft CTA at the end keep the content within guidelines and sustainable for ranking.

---

## 4. Flow summary (for AI / automation)

1. **Raw article** (title + content) is passed to the rewriter.
2. **Prompts** are built from `prompts.yaml`; **product list** (with categories) is built from `products.json` and injected into the rewrite prompt.
3. **LLM** produces:
   - Original HTML (pointwise, reader-friendly, 1–3 subtle product links chosen by topic).
   - SEO metadata JSON (title, slug, excerpt, meta_*, keywords, tags).
4. **Publish** step writes to Supabase, computes SEO score and reading time, and (if published) triggers ISR so the blog goes live.

To change behavior:

- **Voice, structure, product tone:** Edit [prompts.yaml](./prompts.yaml) (system_prompt, rewrite_prompt).
- **Which products and URLs:** Edit [products.json](./products.json) and keep `category` consistent for topic matching.
- **Metadata shape:** Edit the metadata_prompt in [prompts.yaml](./prompts.yaml).

This guide, together with `prompts.yaml` and `products.json`, is enough for an AI or developer to understand and maintain the rewriter and ranking setup.
