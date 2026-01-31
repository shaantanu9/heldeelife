# Technical Context: heldeelife

## Technology Stack

### Frontend

- **Next.js 14.2.0**: React framework with App Router
- **React 18.3.0**: UI library
- **TypeScript 5.4.0**: Type safety
- **Tailwind CSS 3.4.3**: Utility-first CSS framework
- **shadcn/ui**: Component library (Radix UI + Tailwind)
- **next-themes**: Dark mode support

### Backend & Database

- **Supabase**: Backend-as-a-Service
  - PostgreSQL 17.6.1 database
  - Authentication service
  - Row Level Security (RLS)
- **NextAuth.js 4.24.0**: Authentication framework
- **pg 8.16.3**: PostgreSQL client

### UI Libraries

- **Radix UI**: Headless UI primitives
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **TipTap**: Rich text editor
- **Recharts**: Chart library (for analytics)

### Form Handling

- **React Hook Form 7.66.1**: Form state management
- **Zod 4.1.13**: Schema validation
- **@hookform/resolvers**: Form validation integration

### Utilities

- **date-fns**: Date manipulation
- **clsx**: Conditional class names
- **tailwind-merge**: Tailwind class merging
- **class-variance-authority**: Component variants

## Development Setup

### Prerequisites

- **Node.js 20+** (use `nvm use 20` to switch versions)
- **npm** or **yarn**
- **Git**

### Environment Variables

Required in `.env.local`:

```env
# Supabase
SUPABASE_URL=https://jwkduwxvxtggpxlzgyan.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://jwkduwxvxtggpxlzgyan.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://heldeelife.com
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

```
heldeeLife/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   └── blog/             # Blog API endpoints
│   ├── admin/                # Admin pages (protected)
│   ├── auth/                 # Auth pages (signin/signup)
│   ├── blog/                 # Blog pages
│   ├── shop/                 # Shop page
│   ├── products/             # Product detail pages
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # Checkout page
│   └── profile/              # User profile
├── components/               # React components
│   ├── layout/              # Layout components
│   ├── sections/            # Page sections
│   └── ui/                  # shadcn/ui components
├── lib/                      # Utilities
│   ├── supabase/            # Supabase clients
│   ├── utils/               # Helper functions
│   └── types/               # TypeScript types
├── contexts/                 # React contexts
├── hooks/                    # Custom React hooks
├── types/                    # Global types
├── supabase/                 # Supabase migrations
└── memory-bank/              # Project documentation
```

## Key Dependencies

### Core

- `next`: Framework
- `react` & `react-dom`: UI library
- `typescript`: Type safety

### UI & Styling

- `tailwindcss`: CSS framework
- `@radix-ui/*`: UI primitives
- `lucide-react`: Icons
- `embla-carousel-react`: Carousels

### Backend

- `@supabase/supabase-js`: Supabase client
- `next-auth`: Authentication
- `pg`: PostgreSQL client

### Forms & Validation

- `react-hook-form`: Form handling
- `zod`: Schema validation
- `@hookform/resolvers`: Integration

### Rich Text

- `@tiptap/react`: Editor
- `@tiptap/starter-kit`: Basic editor features
- `@tiptap/extension-image`: Image support
- `@tiptap/extension-link`: Link support

## Development Tools

### Code Quality

- **ESLint**: Code linting (Next.js config)
- **TypeScript**: Type checking
- **Prettier**: Code formatting (if configured)

### Version Control

- **Git**: Source control
- **.gitignore**: Excludes node_modules, .env, etc.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes

## Performance Considerations

1. **Static Generation**: Blog posts and product pages
2. **ISR**: Incremental Static Regeneration
3. **Code Splitting**: Automatic with Next.js
4. **Image Optimization**: Next.js Image component
5. **Database Indexing**: Optimized queries

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **RLS Policies**: All database tables protected
3. **Authentication**: Secure JWT-based sessions
4. **API Protection**: Role-based access control
5. **Input Validation**: Zod schemas for all inputs

## Deployment

### Recommended Platforms

- **Vercel**: Optimal for Next.js (recommended)
- **Netlify**: Alternative option
- **Self-hosted**: Docker + Node.js

### Build Configuration

- Next.js automatically optimizes builds
- Static pages pre-rendered
- API routes run on serverless functions

## Database

### Supabase PostgreSQL

- **Version**: 17.6.1
- **Region**: ap-south-1
- **Project ID**: jwkduwxvxtggpxlzgyan

### Connection Methods

1. **Supabase Client**: `@supabase/supabase-js` (recommended)
2. **Direct Postgres**: `pg` client (for migrations)

### Migrations

- Stored in `supabase/migrations/`
- Applied via Supabase dashboard or CLI

## Known Constraints

1. **Node Version**: Must use Node.js 20+
2. **TypeScript**: Strict mode enabled
3. **Supabase**: Project-specific configuration
4. **Environment**: Requires all env variables set

## Future Technical Considerations

1. **Payment Integration**: Razorpay, Stripe, or similar
2. **Email Service**: SendGrid, Resend, or similar
3. **Image Storage**: Supabase Storage or Cloudinary
4. **Analytics**: Google Analytics or similar
5. **Monitoring**: Error tracking (Sentry, etc.)
6. **CDN**: For static assets and images

---

**Last Updated**: 2025-01-27









