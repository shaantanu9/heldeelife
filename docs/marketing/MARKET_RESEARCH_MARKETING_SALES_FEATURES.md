# Market Research: Features That Help Marketing and Increase Sales

**Workflow:** marketing-campaign | **Task:** what feature help us in marketing and increasing sales  
**Date:** 2025-02-20  
**Agent:** researcher (Market Research)

---

## 1. Market Analysis

### Global Ayurveda & Health E-Commerce

- **Ayurveda market size:** USD 19.29B (2025) → USD 46.32B (2030), **19.14% CAGR** (Mordor Intelligence).
- **Largest region:** Asia-Pacific (India as core). **Fastest-growing:** North America.
- **~80% of global population** across 170 countries uses some form of traditional medicine including Ayurveda (WHO, Jan 2023).
- **India Ayush/herbal exports:** USD 651.17M (FY 2023-24), +3.6% YoY (DGCI&S, May 2024).
- **E-commerce role:** Amazon India and others have dedicated Ayurvedic storefronts; D2C (e.g. Kama Ayurveda UK) and digital channels are central to growth.
- **Trends:** Preventive healthcare, chronic-disease management, natural/organic demand, clean beauty, personal care as fastest-growing segment; AI/dosha personalization and apps (e.g. AYUFY) emerging.

### E-Commerce Marketing Benchmarks (General)

- **Cart abandonment:** ~69% of online carts abandoned (Baymard Institute); shipping costs, account creation, slow delivery, and complex checkout are top causes.
- **Cart recovery:** Abandoned-cart emails and incentives (e.g. discount, free shipping) are essential; recovery potential often cited in **10–30%** range.
- **By 2026:** ~25% of retail purchases expected online (Statista).
- **Conversion levers:** Product-page optimization, checkout simplification, free-shipping thresholds, discounts/coupons, loyalty programs, personalization, and post-purchase/retention email.

---

## 2. Target Audience

### Segments (Demographics & Psychographics)

| Segment | Demographics | Psychographics | Needs / Pain Points |
|--------|--------------|----------------|----------------------|
| **Health-conscious mainstream** | 25–55, urban/semi-urban, India + diaspora | Wants natural/authentic options; values education and trust | Authenticity, clear benefits, safety, easy discovery |
| **Ayurveda / holistic seekers** | 28–50, higher income | Prefers traditional + evidence; reads ingredients and origins | Quality, transparency, dosage/usage guidance, practitioner credibility |
| **Personal care / clean beauty** | Millennials, Gen Z, 18–40 | Clean beauty, sustainability, social proof | Natural ingredients, reviews, before/after, brand story |
| **Chronic / preventive** | 35–65 | Managing or preventing chronic conditions; open to supplements and lifestyle | Efficacy, preventive messaging, replenishment, subscriptions |
| **International (NA, EU)** | 30–55, developed markets | Growing interest in Ayurveda; willing to pay for “authentic” | Certification, shipping clarity, local currency, trust badges |

### Behavioural Notes

- Researches online (SEO, blogs, comparison); influenced by reviews, ratings, and recommendations.
- Mobile-heavy (align with mobile-first UX and fast load).
- Values trust (certifications, guarantees, returns) and reduced risk (free shipping, easy returns, guarantees).

---

## 3. Competitive Landscape

### Key Players

- **Large / legacy:** Dabur, Himalaya, Patanjali, Baidyanath, Charak Pharma, Emami, Vicco, Shahnaz Husain.
- **D2C / premium:** Kama Ayurveda (e.g. UK expansion), new-age brands with modern packaging and digital-first distribution.
- **Channels:** Amazon India (dedicated Ayurvedic storefronts), modern retail, e-commerce, specialty and pharmacy.

### Positioning & Messaging

- **Common themes:** Authenticity, natural/herbal, traditional wisdom, scientific validation, GMP/quality.
- **Differentiation:** Premium vs mass, skin/hair vs digestive vs general wellness, personal care vs medicinal, regional and export focus.
- **Gaps/opportunities:** Clear D2C experience, personalised recommendations (e.g. dosha/condition), subscription/replenishment, strong content (blog/SEO), and retention (loyalty, email, abandoned cart).

### Success Factors (from research)

- Balance **traditional authenticity** with **modern UX** (speed, clarity, mobile).
- **Digital and e-commerce** as core: discovery, checkout, retention.
- **Scientific validation** and **regulatory compliance** (e.g. GMP) to build trust.
- **Personalisation** (AI/dosha, condition-based) and **subscription** for LTV.

---

## 4. Opportunities (Features for Marketing & Sales)

### High Impact (Prioritise)

1. **Abandoned cart recovery (email + onsite)**  
   - **Why:** 69% abandonment; 10–30% recovery potential.  
   - **Status in repo:** Tracking and admin UI exist; **TODO: send actual recovery email** in `app/api/admin/abandoned-carts/[id]/send-email/route.ts`.  
   - **Action:** Implement transactional/triggered recovery emails (with optional incentive e.g. 10% off or free shipping).

2. **Coupons and discounts**  
   - **Why:** Drives trials, clears inventory, improves conversion.  
   - **Status:** Implemented (create, validate, apply at checkout).  
   - **Action:** Use in campaigns (first order, abandoned cart, seasonal) and measure redemption.

3. **Loyalty program**  
   - **Why:** Repeat purchases, LTV, retention.  
   - **Status:** Points, tiers, admin adjust; rewards API present.  
   - **Action:** Surface points/tiers in header/checkout; add redeem flow and loyalty-driven campaigns.

4. **Checkout and shipping transparency**  
   - **Why:** Shipping cost and complexity drive abandonment.  
   - **Action:** Free-shipping threshold with progress bar, clear delivery estimates, and optional guest checkout (if not already emphasised).

5. **Social proof and trust**  
   - **Why:** Ratings, reviews, and guarantees improve conversion (15–25% in internal docs).  
   - **Status:** Partially implemented (trust badges, ratings on cards).  
   - **Action:** Ensure reviews on PDP, “X bought recently”, stock/urgency where accurate.

### Medium Impact

6. **Newsletter and lifecycle email**  
   - **Status:** Newsletter section on homepage/blog.  
   - **Action:** Replenishment reminders, post-purchase follow-up, segment by interest (e.g. skin, digestive).

7. **Personalisation**  
   - **Why:** 20–30% improvement potential (internal conversion doc).  
   - **Action:** Recommendations (bought together, for you), optional dosha/condition quiz for product suggestions.

8. **Exit-intent and onsite recovery**  
   - **Status:** Exit-intent popup and abandoned-cart recovery component exist.  
   - **Action:** Tie exit-intent to discount or “save cart” + email capture; ensure recovery modal works for returning users.

9. **SEO and content**  
   - **Why:** Long-term acquisition; category and product pages rank for “Ayurveda”, “natural”, condition terms.  
   - **Status:** Blog and SEO in place.  
   - **Action:** Product-page SEO, category pages, and content aligned with search demand.

### Additional Levers

10. **Live chat / support**  
    - **Status:** Live-chat component present.  
    - **Action:** Use for trust and objection-handling (ingredients, usage, shipping).

11. **Subscriptions / replenishment**  
    - **Why:** Predictable revenue, higher LTV (e.g. 15% off for subscribe).  
    - **Action:** Add “Subscribe & save” for repeat-use products.

12. **Influencer / creator marketing**  
    - **Why:** Trust and reach in health/wellness; micro-influencers effective.  
    - **Action:** Affiliate or paid partnerships; track via UTM and dedicated codes.

---

## 5. Summary for Next Steps

- **Market:** Large and growing Ayurveda/health e-commerce; India + North America and e-commerce/D2C are core.
- **Audience:** Health-conscious, Ayurveda seekers, clean-beauty, chronic/preventive, and international; trust and clarity matter.
- **Competition:** Mix of legacy brands and D2C; differentiation via UX, personalisation, retention, and content.
- **Top feature priorities for marketing and sales:**  
  (1) Complete abandoned-cart **email** flow,  
  (2) Use **coupons** in campaigns,  
  (3) Expose and promote **loyalty** (points/tiers + redeem),  
  (4) **Checkout/shipping** clarity and free-shipping threshold,  
  (5) **Social proof** and trust on PDP and listing pages.

---

**Sources:** Mordor Intelligence (Ayurveda market), Shopify (e-commerce strategy, cart recovery), WHO, DGCI&S, project docs (ECOMMERCE_CONVERSION_COMPLETE.md, CONVERSION_RETENTION_COMPLETE.md, conversion-machine-complete.md), codebase audit (abandoned-cart, coupons, loyalty, newsletter, conversion components).
