# heldeelife — SEO & GEO Setup

This document describes how search-engine optimisation (SEO) and generative-engine
optimisation (GEO: being understood and cited by AI answer engines such as ChatGPT
search, Perplexity, Claude, Gemini/AI Overviews and Copilot) are implemented, what
was fixed, and what still needs a human.

---

## 1. Architecture: one source of truth

| File                  | Purpose                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/seo/site.ts`     | Brand identity, canonical `SITE_URL`, NAP (name/address/phone), geo coordinates, shipping/return policy numbers, social profiles, verification tokens. All overridable via env vars.                                                                                                                                      |
| `lib/seo/metadata.ts` | `buildMetadata()` for public pages (title, description clamp, canonical, hreflang `en-IN` + `x-default`, Open Graph, Twitter, robots). `privateMetadata()` for noindex pages.                                                                                                                                             |
| `lib/seo/schema.ts`   | schema.org builders: `Organization`+`OnlineStore`, `WebSite`+`SearchAction`, `WebPage`/`AboutPage`/`ContactPage`/`CollectionPage`, `BreadcrumbList`, `FAQPage`, `Product` (+ `Offer`, `OfferShippingDetails`, `MerchantReturnPolicy`), `ItemList`. Every node links to the shared Organization/WebSite via stable `@id`s. |
| `lib/seo/json-ld.tsx` | `<JsonLd>` renderer: escapes `<`, `>`, `&`, U+2028/2029 (prevents `</script>` XSS from DB content), prunes null/empty values, combines nodes into one `@graph`.                                                                                                                                                           |

Because NAP and policies live in one place, the footer, contact page, JSON-LD,
`llms.txt` and product offers can never disagree — consistency is a core trust
signal for both Google and LLMs.

---

## 2. Technical SEO

| Area                             | Status                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `robots.txt` (`app/robots.ts`)   | Every user-agent group repeats the private paths. **Fixed bug:** the old `Googlebot` group overrode `*` and re-allowed `/cart`, `/checkout`, `/profile`. Internal search, previews, orders, wishlist etc. are now disallowed.                                                                 |
| `sitemap.xml` (`app/sitemap.ts`) | All public static pages, every active product and published post, with **image sitemap** entries. Each DB query is isolated — a Supabase outage no longer fails the whole sitemap. `/insights/*` duplicates removed (they canonicalise to `/blog/*`). No fake `lastModified` on static pages. |
| Canonicals                       | Set per page from `path`. **Fixed:** the root layout set `canonical: '/'`, which every page without its own canonical (incl. 404s) inherited — telling Google they were duplicates of the homepage.                                                                                           |
| Titles                           | **Fixed double branding** (`"FAQ \| heldeelife \| heldeelife"`) on 13 pages — pages now pass the bare title and the layout template appends the brand once.                                                                                                                                   |
| Descriptions                     | Rewritten to 120–160 chars, answer-first, with India/₹ specifics. **Fixed** literal `&apos;` that would have shown as `&amp;apos;` in Google snippets.                                                                                                                                        |
| `noindex`                        | Added to auth, cart, checkout, orders, profile, wishlist, compare, tracking, offline, unsubscribe, unauthorized, blog previews; `noindex,follow` for internal search and the placeholder resources hub. Previously all of these were indexable.                                               |
| `<html lang>` / locale           | `en-IN`, `og:locale=en_IN`, hreflang `en-IN` + `x-default`.                                                                                                                                                                                                                                   |
| Duplicate content                | `/insights/[slug]` canonical → `/blog/[slug]`; product UUID URLs already 301 to slug URLs.                                                                                                                                                                                                    |
| Icons / OG image                 | **Were all 404** (`/logo.png`, `/og-image.jpg`, `/icon-192.png`, `/icon-512.png` were referenced but missing). Generated placeholders + favicon, apple-touch-icon and a maskable icon (`scripts/generate-brand-assets.py`).                                                                   |
| Manifest                         | Removed invalid `_comment`, split `"any maskable"` into separate icons, added `id`, `lang`.                                                                                                                                                                                                   |
| Core Web Vitals                  | Razorpay SDK moved from **every page** to `app/checkout/layout.tsx` (`next/script`, `afterInteractive`).                                                                                                                                                                                      |
| Head cleanup                     | Removed duplicate/contradictory manual tags (second `robots` meta, `bingbot`/`slurp`, `distribution: global`/`coverage: worldwide` vs an India-only store).                                                                                                                                   |
| Verification                     | Google / Bing / Yandex tokens via env (`NEXT_PUBLIC_*_VERIFICATION`).                                                                                                                                                                                                                         |

---

## 3. Structured data (rich results)

| Page                 | Schema                                                                                                                                                                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All pages            | `Organization`+`OnlineStore` (logo, contactPoint with hours, address, areaServed India, return policy, `sameAs`) + `WebSite` with sitelinks `SearchAction`                                                                                                                                                                 |
| `/products/[slug]`   | `Product` (images, SKU/GTIN, brand, `Offer` with stable `priceValidUntil`, `OfferShippingDetails` — free ≥ ₹500, 1–2 day handling, 3–15 day transit — and `MerchantReturnPolicy` 7 days), `BreadcrumbList`, `FAQPage` when the product has FAQs. `aggregateRating` only when real reviews exist. Plus `product:*` OG meta. |
| `/blog/[slug]`       | Single `BlogPosting` + `BreadcrumbList` (+ `FAQPage` when question headings are detected). **Removed:** duplicate `Article` entity, misused `QAPage` (Google reserves it for forum Q&A), and the **author's email address** that was being published.                                                                      |
| `/blog`              | `Blog` linked to the Organization                                                                                                                                                                                                                                                                                          |
| `/shop`              | `CollectionPage` + summary `ItemList` (URLs only — full Product markup lives on product pages, per Google's guidance)                                                                                                                                                                                                      |
| `/faq`               | `WebPage` + `FAQPage` generated from the exact on-page Q&As (22 questions)                                                                                                                                                                                                                                                 |
| `/about`, `/contact` | `AboutPage`, `ContactPage` + breadcrumbs                                                                                                                                                                                                                                                                                   |
| `/service`           | `WebPage` + `Service` with an `OfferCatalog` of consultation types                                                                                                                                                                                                                                                         |
| Policy/help pages    | `WebPage` + breadcrumbs                                                                                                                                                                                                                                                                                                    |

Validate with <https://search.google.com/test/rich-results> and
<https://validator.schema.org> after deploying.

---

## 4. GEO — Generative Engine Optimisation

| Signal                  | Implementation                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/llms.txt`             | Dynamic (hourly ISR) Markdown summary per <https://llmstxt.org>: key facts (location, shipping, returns, payments, support), main pages, policies, top 50 products with price/category/summary, latest 50 articles linking to their Markdown versions. Advertised via `<link rel="alternate">` in every page head. |
| Markdown alternates     | `/blog/[slug]/markdown` (existing) now advertised correctly via `alternates.types['text/markdown']` (the old `links` key was not valid Next metadata and broke type-checking).                                                                                                                                     |
| AI crawler access       | `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Bingbot, CCBot, Meta-ExternalAgent, DuckAssistBot, cohere-ai. Remove a name to opt that vendor out of training/citation.         |
| Entity consistency      | Same name, description, NAP, policies everywhere (JSON-LD ↔ footer ↔ contact page ↔ llms.txt). `knowsAbout` declares topical expertise.                                                                                                                                                                            |
| Answer-ready content    | FAQ answers in clean `FAQPage` schema; descriptions lead with concrete facts (₹500 free shipping, 7-day returns, India-wide delivery) — the kind of text LLMs quote.                                                                                                                                               |
| Safe, parseable JSON-LD | One `@graph` per page, no nulls, stable `@id`s so engines merge facts into one entity.                                                                                                                                                                                                                             |

## 5. Local / geographic signals (India)

- `geo.region=IN-MH`, `geo.placename`, `geo.position`, `ICBM` meta.
- `PostalAddress` + `areaServed: India` + `availableLanguage: English, Hindi` in Organization.
- Footer and contact page render the same address/phone/email/hours with `<address>`, `mailto:` and `tel:` links.

---

## 6. Other fixes made while "completing" the app

- **Build was broken**: stray closing `</div>` in `app/admin/blog/new/client.tsx` and `app/admin/blog/[id]/client.tsx` (JSX syntax error) — fixed.
- **`next build` crashed** without `RESEND_API_KEY` because two routes constructed `new Resend()` at module load — now lazy.
- Type errors fixed (`tsconfig` target ES2020 for regex `s` flag, implicit `any`s, vitest globals); `tsc --noEmit` is clean.
- **Contact, consultation, newsletter and exit-intent forms discarded submissions** — now POST to `/api/inquiries` (zod-validated, rate-limited, stored in `customer_inquiries`, emailed to support via Resend). Run migration `supabase/migrations/025_customer_inquiries.sql`.
- Dead `href="#"` links on `/resource` now point to real sections.
- Admin blog form test now targets the client component (it was importing the async server page).

---

## 7. Action items for the team (cannot be done in code)

1. **Set real business details** in production env: `NEXT_PUBLIC_SITE_URL` (pick www _or_ apex and 301 the other at the host), street address, phone, social URLs. The current phone/address are placeholders that were already on the site — Google penalises inconsistent or fake NAP.
2. **Replace placeholder brand assets** in `public/` (same filenames/sizes) with designer artwork.
3. **Verify** the domain in Google Search Console & Bing Webmaster Tools (set the env tokens), then **submit `sitemap.xml`**.
4. Create a **Google Business Profile** (and Bing Places) with the exact same NAP.
5. **Google Merchant Center**: connect the domain; product structured data now includes shipping + returns, which free listings require.
6. Run `025_customer_inquiries.sql` on Supabase.
7. **Content (E-E-A-T, the biggest remaining lever)** — health is a YMYL category:
   - Real author bios with credentials (BAMS/MBBS) on blog posts; medical reviewer + "last reviewed" dates.
   - Replace the "Trusted by 50,000+ customers" claim and the home-page testimonials/doctor profiles with verifiable data, or remove them.
   - Fill `/resource` with real guides (then remove its `noindex`).
   - Write answer-first category/landing pages (e.g. "Ayurvedic remedies for cough", "Tulsi benefits") — these are what AI engines cite.
8. Consider indexable category URLs (`/shop/category/[slug]`) instead of `?category=` query strings, which currently canonicalise to `/shop`.

## 8. Known follow-ups (not addressed)

- `/unsubscribe` unsubscribes via a plain GET with the email in the query string — link scanners/prefetchers can trigger it and anyone can unsubscribe any address. Use a signed token + POST confirmation.
- The home page reads cookies for A/B testing, which makes it dynamic (the `revalidate = 60` has no effect). Fine for SEO, costs TTFB.
- 21 pre-existing unit-test failures (live-API integration test with relative URLs, outdated UI copy in image-upload/product-search tests, ImageKit network mock).
- ESLint 10 is installed but there is no `eslint.config.*`, so `npm run lint` does not run.

## 9. How to verify locally

```bash
npm run build && npm start
curl localhost:3000/robots.txt
curl localhost:3000/sitemap.xml
curl localhost:3000/llms.txt
npx vitest run tests/lib/seo.test.ts
```
