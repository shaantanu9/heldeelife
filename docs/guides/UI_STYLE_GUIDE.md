# HeldeeLife UI & Style Guide

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Purpose:** Design system documentation for product packaging, catalog design, and brand consistency

---

## 📐 Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [UI Components](#ui-components)
6. [Product Catalog Design](#product-catalog-design)
7. [Product Packaging Design](#product-packaging-design)
8. [Visual Guidelines](#visual-guidelines)
9. [Brand Assets](#brand-assets)

---

## 🎨 Brand Identity

### Brand Philosophy

**HeldeeLife** represents the harmonious blend of traditional Ayurvedic wisdom with modern medicine. Our design philosophy reflects:

- **Minimal & Clean**: Simplicity and purity of Ayurveda
- **Warm & Inviting**: Earthy, natural, approachable
- **Trustworthy**: Professional yet accessible
- **Holistic**: Balance between tradition and innovation

### Brand Values

1. **Authenticity**: Genuine Ayurvedic principles
2. **Wellness**: Holistic approach to health
3. **Trust**: Transparent, reliable, professional
4. **Accessibility**: Available to everyone
5. **Innovation**: Modern solutions with traditional roots

### Brand Personality

- **Elegant**: Refined, sophisticated, graceful
- **Natural**: Organic, earthy, grounded
- **Modern**: Contemporary, fresh, forward-thinking
- **Caring**: Warm, compassionate, supportive

---

## 🎨 Color Palette

### Primary Colors

#### Orange (Primary Brand Color)

**Usage:** Primary CTAs, highlights, accents, brand elements

| Color Name     | Hex Code  | RGB                | Usage                                |
| -------------- | --------- | ------------------ | ------------------------------------ |
| Orange 50      | `#FFF5F2` | rgb(255, 245, 242) | Light backgrounds, subtle highlights |
| Orange 100     | `#FFE5DB` | rgb(255, 229, 219) | Hover states, light accents          |
| Orange 200     | `#FFD4C4` | rgb(255, 212, 196) | Secondary backgrounds                |
| Orange 300     | `#FFB8A0` | rgb(255, 184, 160) | Tertiary accents                     |
| Orange 400     | `#FF9A7A` | rgb(255, 154, 122) | Medium accents                       |
| **Orange 500** | `#FF6B35` | rgb(255, 107, 53)  | **Primary brand color**              |
| Orange 600     | `#E55A2B` | rgb(229, 90, 43)   | Hover states, buttons                |
| Orange 700     | `#CC4A21` | rgb(204, 74, 33)   | Active states                        |
| Orange 800     | `#B33A17` | rgb(179, 58, 23)   | Dark accents                         |
| Orange 900     | `#992A0D` | rgb(153, 42, 13)   | Darkest accents                      |

**Primary Orange:** `#FF6B35` - Use for:

- Main call-to-action buttons
- Brand logo highlights
- Important links and navigation
- Product price highlights
- Featured content accents

### Ayurvedic Color Palette

#### Earth Brown (Grounding, Natural)

**Usage:** Secondary brand color, earthy elements, natural products

| Color Name  | Hex Code  | RGB                | Usage               |
| ----------- | --------- | ------------------ | ------------------- |
| Earth       | `#8B6F47` | rgb(139, 111, 71)  | Primary earth tone  |
| Earth Light | `#A6896B` | rgb(166, 137, 107) | Light earth accents |
| Earth Dark  | `#6B5435` | rgb(107, 84, 53)   | Dark earth accents  |

**Use for:**

- Ayurvedic product categories
- Natural/organic product badges
- Secondary buttons
- Text accents on light backgrounds

#### Sage Green (Healing, Nature)

**Usage:** Health, wellness, natural products

| Color Name | Hex Code  | RGB                | Usage        |
| ---------- | --------- | ------------------ | ------------ |
| Sage       | `#6B8E5A` | rgb(107, 142, 90)  | Primary sage |
| Sage Light | `#8FA87A` | rgb(143, 168, 122) | Light sage   |
| Sage Dark  | `#4F6B42` | rgb(79, 107, 66)   | Dark sage    |

**Use for:**

- Health & wellness sections
- Natural product indicators
- Success states
- Organic certifications

#### Cream (Soft, Natural Background)

**Usage:** Backgrounds, cards, subtle sections

| Color Name  | Hex Code  | RGB                | Usage         |
| ----------- | --------- | ------------------ | ------------- |
| Cream       | `#F5F1E8` | rgb(245, 241, 232) | Primary cream |
| Cream Light | `#FAF8F3` | rgb(250, 248, 243) | Light cream   |
| Cream Dark  | `#E8E0D0` | rgb(232, 224, 208) | Dark cream    |

**Use for:**

- Card backgrounds
- Section backgrounds
- Product image backgrounds
- Subtle dividers

### Neutral Colors

#### Gray Scale

**Usage:** Text, borders, backgrounds, UI elements

| Color Name | Hex Code  | Usage                |
| ---------- | --------- | -------------------- |
| Gray 50    | `#F9FAFB` | Lightest backgrounds |
| Gray 100   | `#F3F4F6` | Light backgrounds    |
| Gray 200   | `#E5E7EB` | Borders, dividers    |
| Gray 300   | `#D1D5DB` | Light borders        |
| Gray 400   | `#9CA3AF` | Disabled text        |
| Gray 500   | `#6B7280` | Secondary text       |
| Gray 600   | `#4B5563` | Body text            |
| Gray 700   | `#374151` | Headings             |
| Gray 800   | `#1F2937` | Dark text            |
| Gray 900   | `#111827` | Primary text         |

### Semantic Colors

| Color   | Hex       | Usage                              |
| ------- | --------- | ---------------------------------- |
| Success | `#10B981` | Success messages, positive actions |
| Error   | `#EF4444` | Errors, destructive actions        |
| Warning | `#F59E0B` | Warnings, cautions                 |
| Info    | `#3B82F6` | Information, links                 |

### Color Usage Guidelines

#### Do's ✅

- Use Orange 500 (`#FF6B35`) for primary CTAs
- Use Earth Brown for Ayurvedic/natural product sections
- Use Cream backgrounds for product cards
- Maintain 4.5:1 contrast ratio for text
- Use gray scale for text hierarchy

#### Don'ts ❌

- Don't use more than 3 colors in a single component
- Don't use orange on orange backgrounds
- Don't use light colors for text on light backgrounds
- Don't mix warm and cool color palettes randomly

---

## ✍️ Typography

### Font Families

#### Primary Font: Sans-Serif (Inter)

**Usage:** Body text, UI elements, navigation, buttons

```css
font-family: var(--font-sans), sans-serif;
```

**Characteristics:**

- Clean, modern, readable
- Excellent for digital interfaces
- Supports multiple weights (300-700)

#### Secondary Font: Serif (Playfair Display)

**Usage:** Headings, elegant text, brand name

```css
font-family: var(--font-serif), serif;
```

**Characteristics:**

- Elegant, sophisticated
- Perfect for headings and brand elements
- Adds warmth and tradition

### Type Scale

| Element    | Font Size       | Line Height | Font Weight     | Usage                |
| ---------- | --------------- | ----------- | --------------- | -------------------- |
| H1 (Hero)  | 4.5rem (72px)   | 1.1         | 700 (Bold)      | Main hero headings   |
| H1         | 3.75rem (60px)  | 1.2         | 700             | Page titles          |
| H2         | 3rem (48px)     | 1.3         | 600 (Semi-bold) | Section headings     |
| H3         | 2.25rem (36px)  | 1.4         | 600             | Subsection headings  |
| H4         | 1.875rem (30px) | 1.5         | 600             | Card titles          |
| H5         | 1.5rem (24px)   | 1.5         | 600             | Small headings       |
| H6         | 1.25rem (20px)  | 1.5         | 600             | Smallest headings    |
| Body Large | 1.25rem (20px)  | 1.75        | 400             | Large body text      |
| Body       | 1rem (16px)     | 1.6         | 400             | Standard body text   |
| Body Small | 0.875rem (14px) | 1.5         | 400             | Small text, captions |
| Label      | 0.875rem (14px) | 1.5         | 500             | Form labels, buttons |
| Small      | 0.75rem (12px)  | 1.4         | 400             | Fine print, metadata |

### Typography Examples

#### Hero Heading

```
Font: Serif (Playfair Display)
Size: 4.5rem (72px)
Weight: 700 (Bold)
Line Height: 1.1
Color: Gray 900 (#111827)
```

#### Section Heading

```
Font: Sans-Serif (Inter)
Size: 3rem (48px)
Weight: 600 (Semi-bold)
Line Height: 1.3
Color: Gray 900 (#111827)
```

#### Body Text

```
Font: Sans-Serif (Inter)
Size: 1rem (16px)
Weight: 400 (Regular)
Line Height: 1.6
Color: Gray 600 (#4B5563)
```

#### Button Text

```
Font: Sans-Serif (Inter)
Size: 0.875rem (14px)
Weight: 500 (Medium)
Line Height: 1.5
Color: White (on orange buttons)
```

### Typography Guidelines

#### Do's ✅

- Use serif for main headings (H1, H2)
- Use sans-serif for body text and UI
- Maintain consistent line heights
- Use appropriate font weights for hierarchy
- Ensure sufficient contrast (4.5:1 minimum)

#### Don'ts ❌

- Don't mix more than 2 font families
- Don't use all caps for body text
- Don't use font sizes smaller than 12px
- Don't use light weights (300) for body text

---

## 📏 Spacing & Layout

### Spacing Scale

| Size | Value         | Usage                 |
| ---- | ------------- | --------------------- |
| xs   | 0.25rem (4px) | Tight spacing, icons  |
| sm   | 0.5rem (8px)  | Small gaps            |
| md   | 1rem (16px)   | Standard spacing      |
| lg   | 1.5rem (24px) | Section spacing       |
| xl   | 2rem (32px)   | Large gaps            |
| 2xl  | 3rem (48px)   | Section padding       |
| 3xl  | 4rem (64px)   | Large section padding |
| 4xl  | 6rem (96px)   | Hero sections         |

### Layout Grid

#### Container

- **Max Width:** 1400px (2xl breakpoint)
- **Padding:** 2rem (32px) on desktop
- **Padding:** 1rem (16px) on mobile
- **Center aligned**

#### Breakpoints

| Breakpoint | Size   | Usage               |
| ---------- | ------ | ------------------- |
| sm         | 640px  | Small tablets       |
| md         | 768px  | Tablets             |
| lg         | 1024px | Desktop             |
| xl         | 1280px | Large desktop       |
| 2xl        | 1400px | Extra large desktop |

### Grid System

- **12-column grid** on desktop
- **Responsive columns** on mobile
- **Gap:** 1.5rem (24px) between columns
- **Gutters:** 1rem (16px) on mobile, 2rem (32px) on desktop

---

## 🧩 UI Components

### Buttons

#### Primary Button

```
Background: Orange 600 (#E55A2B)
Hover: Orange 700 (#CC4A21)
Text: White
Font: Sans-Serif, 14px, Medium
Padding: 12px 24px
Border Radius: 8px (rounded-lg)
Shadow: shadow-md
Hover Shadow: shadow-lg
```

#### Secondary Button

```
Background: Transparent
Border: 2px solid Orange 600
Text: Orange 600
Hover: Orange 50 background
```

#### Ghost Button

```
Background: Transparent
Text: Gray 700
Hover: Gray 100 background
```

### Cards

#### Product Card

```
Background: White
Border: 1px solid Gray 200
Border Radius: 12px (rounded-lg)
Shadow: shadow-md
Hover Shadow: shadow-xl
Padding: 2rem (32px)
```

#### Content Card

```
Background: Cream (#F5F1E8)
Border: None
Border Radius: 12px
Padding: 1.5rem (24px)
```

### Input Fields

```
Background: White
Border: 1px solid Gray 300
Border Radius: 8px
Padding: 12px 16px
Focus Border: Orange 600
Focus Ring: Orange 200
```

### Badges

#### Primary Badge

```
Background: Orange 600
Text: White
Font Size: 12px
Padding: 4px 8px
Border Radius: 4px
```

#### Secondary Badge

```
Background: Gray 100
Text: Gray 700
Font Size: 12px
Padding: 4px 8px
Border Radius: 4px
```

---

## 📦 Product Catalog Design

### Product Card Layout

#### Structure

1. **Image Container** (Aspect Ratio: 1:1)
   - Background: Cream (#F5F1E8) or Orange 50
   - Border Radius: 12px
   - Image: Centered, object-contain

2. **Product Name**
   - Font: Sans-Serif, 18px, Semi-bold
   - Color: Gray 900
   - Line Height: 1.4
   - Max 2 lines with ellipsis

3. **Price**
   - Font: Sans-Serif, 20px, Bold
   - Color: Orange 600
   - Format: "From Rs. XXX.XX"

4. **CTA Button**
   - Full width
   - Orange 600 background
   - White text
   - Rounded corners

### Product Grid

#### Desktop (3 columns)

- Gap: 1.5rem (24px)
- Card width: Auto (flex)
- Max width per card: 400px

#### Tablet (2 columns)

- Gap: 1rem (16px)
- Card width: Auto

#### Mobile (1 column)

- Full width
- Gap: 1rem (16px)

### Product Detail Page

#### Layout

- **Left:** Product images (60% width)
- **Right:** Product info (40% width)
- **Below:** Product description, reviews, related products

#### Typography

- **Title:** Serif, 36px, Bold
- **Price:** Sans-Serif, 32px, Bold, Orange 600
- **Description:** Sans-Serif, 16px, Regular, Gray 600

### Category Pages

#### Category Header

- Background: Gradient (slate-50 to orange-50)
- Title: Serif, 48px, Bold
- Subtitle: Sans-Serif, 20px, Regular, Gray 600

#### Filter Sidebar

- Background: White
- Border: 1px solid Gray 200
- Padding: 1.5rem
- Border Radius: 12px

---

## 📦 Product Packaging Design

### Packaging Color Scheme

#### Primary Packaging Colors

- **Main Background:** White or Cream (#F5F1E8)
- **Primary Accent:** Orange 600 (#E55A2B)
- **Secondary Accent:** Earth Brown (#8B6F47)
- **Text:** Gray 900 (#111827)

#### Ayurvedic Product Packaging

- **Background:** Cream (#F5F1E8) or White
- **Accent:** Earth Brown (#8B6F47) or Sage Green (#6B8E5A)
- **Logo/Brand:** Orange 600 (#E55A2B)
- **Natural Elements:** Earth tones, green accents

### Packaging Typography

#### Brand Name

- **Font:** Serif (Playfair Display) or Sans-Serif (Inter)
- **Size:** Large, prominent
- **Weight:** Bold (700)
- **Color:** Gray 900 or Orange 600

#### Product Name

- **Font:** Sans-Serif (Inter)
- **Size:** Medium to Large
- **Weight:** Semi-bold (600)
- **Color:** Gray 900

#### Product Details

- **Font:** Sans-Serif (Inter)
- **Size:** Small to Medium
- **Weight:** Regular (400)
- **Color:** Gray 600

### Packaging Layout Guidelines

#### Front Panel

1. **Top:** Brand logo (Orange 600)
2. **Center:** Product image (high quality, natural lighting)
3. **Below Image:** Product name (prominent)
4. **Bottom:** Key benefit or tagline

#### Side Panel

1. **Ingredients list**
2. **Usage instructions**
3. **Net weight/volume**
4. **Manufacturing details**

#### Back Panel

1. **Detailed description**
2. **Full ingredients**
3. **Benefits**
4. **Storage instructions**
5. **Safety information**
6. **Barcode/QR code**

### Packaging Design Principles

#### Do's ✅

- Use clean, minimal design
- Maintain brand color consistency
- Use high-quality product images
- Include clear, readable typography
- Add natural/organic visual elements
- Use appropriate white space
- Include Ayurvedic symbols/icons where relevant

#### Don'ts ❌

- Don't overcrowd with information
- Don't use too many colors
- Don't use low-quality images
- Don't use hard-to-read fonts
- Don't ignore brand guidelines
- Don't use cluttered designs

### Packaging Material Recommendations

#### Colors for Printing

- **Primary Orange:** Pantone 172 C or CMYK: 0, 70, 85, 0
- **Earth Brown:** Pantone 4695 C or CMYK: 30, 50, 80, 20
- **Sage Green:** Pantone 5773 C or CMYK: 50, 20, 60, 20
- **Cream:** Pantone 7499 C or CMYK: 5, 5, 15, 0

#### Paper/Stock

- **Premium:** Matte or satin finish
- **Eco-friendly:** Recycled paper options
- **Texture:** Natural, textured paper for Ayurvedic products

---

## 🎨 Visual Guidelines

### Imagery Style

#### Product Photography

- **Style:** Clean, natural, well-lit
- **Background:** White or Cream (#F5F1E8)
- **Lighting:** Natural, soft lighting
- **Composition:** Centered, clear focus on product
- **Quality:** High resolution (minimum 2000px width)

#### Lifestyle Photography

- **Style:** Warm, inviting, natural
- **Colors:** Earth tones, warm lighting
- **Mood:** Peaceful, wellness-focused
- **People:** Diverse, authentic, natural

#### Iconography

- **Style:** Minimal, line-based
- **Weight:** Medium (2px stroke)
- **Color:** Gray 600 or Orange 600
- **Size:** Consistent sizing (24px, 32px, 48px)

### Visual Elements

#### Patterns

- **Subtle geometric patterns**
- **Natural/organic shapes**
- **Minimal, not overwhelming**
- **Opacity: 5-10% for backgrounds**

#### Gradients

- **From:** Slate 50 or White
- **Via:** White
- **To:** Orange 50/40
- **Usage:** Hero sections, backgrounds

#### Shadows

- **Light:** shadow-sm (subtle elevation)
- **Medium:** shadow-md (cards, buttons)
- **Large:** shadow-xl (hover states, modals)

---

## 🏷️ Brand Assets

### Logo Usage

#### Primary Logo

- **Color:** Orange 600 (#E55A2B) or Gray 900
- **Background:** White or transparent
- **Minimum Size:** 120px width

#### Logo Variations

- **Full logo:** Brand name + icon
- **Icon only:** For small spaces
- **Monochrome:** For single-color applications

### Brand Mark

#### Wordmark

- **Font:** Serif (Playfair Display) or Sans-Serif (Inter)
- **Style:** "heldeelife" (lowercase, elegant)
- **Color:** Gray 900 or Orange 600

### Brand Elements

#### Ayurvedic Symbols

- **Om symbol** (subtle, not prominent)
- **Lotus flower** (minimal, line art)
- **Natural elements** (leaves, herbs)

#### Badges & Certifications

- **Organic:** Green badge with sage green
- **Ayurvedic:** Earth brown badge
- **Natural:** Cream background with earth brown text

---

## 📋 Design Checklist

### Product Catalog

- [ ] Consistent card design
- [ ] High-quality product images
- [ ] Clear pricing display
- [ ] Easy-to-read typography
- [ ] Proper spacing and alignment
- [ ] Responsive grid layout
- [ ] Clear CTAs

### Product Packaging

- [ ] Brand colors applied correctly
- [ ] Typography hierarchy clear
- [ ] Product image prominent
- [ ] All required information included
- [ ] Barcode/QR code placement
- [ ] Regulatory compliance
- [ ] Eco-friendly materials considered

### Brand Consistency

- [ ] Colors match brand palette
- [ ] Typography follows guidelines
- [ ] Logo used correctly
- [ ] Spacing consistent
- [ ] Visual style aligned

---

## 📞 Design Resources

### Color Tools

- **Hex to RGB:** Use online converters
- **Pantone Matching:** Use Pantone Color Bridge
- **Contrast Checker:** WebAIM Contrast Checker

### Typography Tools

- **Font Pairing:** Google Fonts combinations
- **Type Scale:** Type-scale.com

### Design Software

- **Figma:** For digital design
- **Adobe Illustrator:** For packaging design
- **Adobe Photoshop:** For image editing

---

## 📝 Notes

- This guide is a living document and will be updated as the brand evolves
- Always refer to this guide when creating new designs
- When in doubt, choose simplicity and clarity
- Maintain consistency across all touchpoints

---

**Document Owner:** Design Team  
**Review Frequency:** Quarterly  
**Next Review:** 2025-04-27

