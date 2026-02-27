# Products config for blog rewriter

**Full strategy (rewriter, product linking, SEO):** see **[REWRITER-PRODUCT-SEO-GUIDE.md](./REWRITER-PRODUCT-SEO-GUIDE.md)**. That doc is the canonical reference so AI or developers can get the full picture and keep ranking working.

The file **`products.json`** is the single source of truth for product linking in the blog pipeline. During rewriting, the rewriter **refers to this file**, matches products to the article topic using **`category`**, and adds **1–3 brief, contextual product mentions** so they read like editorial advice — not like ads.

## How it works

- The rewriter loads `config/products.json` and passes the product list (with names, URLs, and categories) into the rewrite prompt.
- Products are chosen by **topic match**: e.g. cold/cough article → `cold_relief`; immunity article → `immunity`; nasal congestion → `nasal_care`.
- Each chosen product is added as **one short, natural mention** (e.g. "A tulsi-based nasal spray can help" with a single link). The goal is that product adds are so simple and contextual that they don’t feel like product ads.

## How to edit

1. Open `config/products.json`.
2. Update **`brand_url`** if your site URL changes.
3. Under **`products`**, edit or add items with:
   - **`name`** — Full product name (e.g. "Saline Tulsi Nasal Spray (115ml)").
   - **`url`** — Full product or category page URL (e.g. `https://www.heldeelife.com/shop` or a specific product page).
   - **`short_name`** — Shorter name used in sentences (e.g. "Tulsi Nasal Spray").
   - **`category`** — Used to match article topic: e.g. `nasal_care`, `immunity`, `cold_relief`, `powders`. Keep these consistent so the rewriter can pick the right products.

## Example

```json
{
  "name": "Immunity Booster Mix",
  "url": "https://www.heldeelife.com/products/immunity-booster",
  "category": "immunity",
  "short_name": "Immunity Booster"
}
```

After saving, the next rewrite run will use the updated list for topic-based product selection and correct URLs.
