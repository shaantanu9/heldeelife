# heldeelife - Ayurveda and Modern Medicine Website

A modern, minimal Next.js website for heldeelife, featuring Ayurveda and modern medicine products and services with a clean, holistic design.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **NextAuth.js** - Authentication
- **Embla Carousel** - Carousel components

## Getting Started

### Prerequisites

- Node.js 20+ (use `nvm use 20` if you have nvm)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:
   Create a `.env.local` file in the root directory:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

````
├── app/                    # Next.js app directory
│   ├── api/               # API routes (NextAuth)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── layout/           # Layout components (Header, Footer)
│   ├── sections/         # Page sections (Hero, Products, etc.)
│   └── ui/              # shadcn/ui components
├── lib/                  # Utility functions
└── public/               # Static assets

## Features

- ✅ Responsive design
- ✅ Product carousels
- ✅ Doctor profiles section
- ✅ Testimonials
- ✅ Categories
- ✅ Newsletter subscription
- ✅ NextAuth authentication setup
- ✅ All shadcn/ui components installed

## Customization

### Brand Colors

The Ayurvedic-inspired brand colors are defined in `tailwind.config.ts`:
- `ayurveda-earth`: #8B6F47 - Warm earth tone
- `ayurveda-sage`: #87A96B - Sage green
- `ayurveda-terracotta`: #C97D60 - Terracotta
- `ayurveda-cream`: #F5F1E8 - Soft cream
- `ayurveda-teal`: #4A7C7E - Muted teal
- `ayurveda-orange`: #D97757 - Warm orange
- `ayurveda-sand`: #E8DCC6 - Sand beige

### Adding Components

To add more shadcn components:
```bash
npx shadcn@latest add [component-name]
````

## Next Steps

1. Set up authentication providers in `app/api/auth/[...nextauth]/route.ts`
2. Add product data from a database or CMS
3. Implement shopping cart functionality
4. Add doctor booking system
5. Connect newsletter subscription to an email service
6. Add real images and content

## License

© 2024 heldeelife. All rights reserved.
