# System Patterns: heldeelife

## Architecture Overview

heldeelife is built on **Next.js 14** with the **App Router** architecture, using **TypeScript** for type safety, **Supabase** for backend services, and **shadcn/ui** for UI components.

## Key Technical Decisions

### 1. Next.js App Router

- **Why**: Modern React patterns, server components, better performance
- **Pattern**: Server components by default, client components when needed
- **Routing**: File-based routing in `app/` directory

### 2. Supabase Integration

- **Why**: Unified backend (database, auth, storage) with PostgreSQL
- **Pattern**:
  - Client-side: `lib/supabase/client.ts`
  - Server-side: `lib/supabase/server.ts` (with admin client)
- **Security**: Row Level Security (RLS) enabled on all tables

### 3. Authentication Strategy

- **NextAuth.js** + **Supabase Auth**
- **Phone Number Support**: Converts phone numbers to `number@heldeelife.com` format
- **Session Management**: JWT-based sessions with 30-day expiration
- **Role-Based Access**: User and Admin roles

### 4. State Management

- **React Context**: For cart state (`contexts/cart-context.tsx`)
- **LocalStorage**: Cart persistence
- **Server State**: Direct Supabase queries in server components

### 5. UI Component Library

- **shadcn/ui**: Radix UI primitives with Tailwind CSS
- **Pattern**: Copy components to project, fully customizable
- **Styling**: Tailwind CSS with custom Ayurvedic color palette

## Component Structure

### Layout Components

```
components/layout/
├── header.tsx       # Main navigation header
├── footer.tsx       # Site footer
└── mobile-nav.tsx   # Mobile navigation
```

### Section Components

```
components/sections/
├── hero.tsx          # Homepage hero section
├── products.tsx      # Featured products
├── categories.tsx    # Product categories
├── promotions.tsx    # Promotional banners
├── testimonials.tsx  # Customer testimonials
├── doctors.tsx      # Doctor profiles
├── insights.tsx     # Blog insights
└── newsletter.tsx   # Newsletter subscription
```

### UI Components

```
components/ui/       # shadcn/ui components (50+ components)
```

## Data Flow Patterns

### 1. Product Data Flow

```
Database (Supabase)
  → API Routes (/api/blog/posts)
  → Server Components
  → Client Components (if needed)
```

### 2. Cart Data Flow

```
Client Component
  → Cart Context
  → LocalStorage (persistence)
  → Checkout Page
```

### 3. Authentication Flow

```
User Action
  → NextAuth API Route
  → Supabase Auth
  → Session Creation
  → Middleware Protection
```

## Database Schema Patterns

### Core Tables

1. **users**: User profiles with role-based access
2. **products**: Product catalog with full details
3. **product_categories**: Hierarchical category system
4. **inventory**: Stock management with locations
5. **orders**: Customer orders with status tracking
6. **order_items**: Order line items
7. **blog_posts**: SEO-optimized blog content
8. **blog_categories**: Blog organization
9. **blog_tags**: Content tagging

### Analytics Tables

- `product_views`: Track product page views
- `product_sales_analytics`: Daily aggregated sales
- `cart_analytics`: Cart behavior tracking
- `product_searches`: Search query tracking
- `inventory_alerts`: Stock alerts

### Security Pattern

- **RLS Enabled**: All tables have Row Level Security
- **Policies**:
  - Public: Can read published content/products
  - Authenticated: Can create orders, view own data
  - Admin: Full access to all resources

## API Route Patterns

### Authentication Required

```typescript
const session = await getServerSession(authOptions)
if (!session)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Admin Only

```typescript
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  return NextResponse.json({ error: 'Message' }, { status: 500 })
}
```

## Middleware Protection

### Route Protection

```typescript
// middleware.ts
- /admin/* → Requires admin role
- /profile/* → Requires authentication
- /cart/* → Requires authentication
- /checkout/* → Requires authentication
```

## Component Patterns

### Server Components (Default)

- Fetch data directly from Supabase
- No client-side JavaScript
- Better performance and SEO

### Client Components

- Marked with `"use client"`
- Used for:
  - Interactive UI (forms, buttons)
  - State management (cart)
  - Browser APIs (localStorage)

### Hybrid Pattern

- Server component fetches data
- Passes data to client component for interactivity

## Styling Patterns

### Tailwind CSS

- Utility-first approach
- Custom color palette in `tailwind.config.ts`
- Responsive design with breakpoints
- Dark mode support (via next-themes)

### Component Styling

- shadcn/ui components use `cn()` utility for class merging
- Variants using `class-variance-authority`
- Consistent spacing and typography

## File Organization

```
app/                    # Next.js App Router
├── api/               # API routes
├── (routes)/          # Page routes
lib/                    # Utilities and helpers
├── supabase/          # Supabase clients
├── utils/             # Helper functions
├── types/             # TypeScript types
components/            # React components
contexts/              # React contexts
hooks/                 # Custom hooks
```

## Error Handling Patterns

### API Routes

- Try-catch blocks
- Proper HTTP status codes
- Error messages in response

### Client Components

- Error boundaries (to be added)
- Loading states
- User-friendly error messages

## Performance Optimizations

1. **Static Generation**: Blog posts and product pages
2. **ISR**: Incremental Static Regeneration for dynamic content
3. **Image Optimization**: Next.js Image component (when images added)
4. **Code Splitting**: Automatic with Next.js
5. **Database Indexing**: Indexes on frequently queried columns

## Security Patterns

1. **Authentication**: NextAuth + Supabase
2. **Authorization**: Role-based middleware and API checks
3. **Data Protection**: RLS policies on all tables
4. **Input Validation**: Zod schemas for forms
5. **Environment Variables**: Sensitive data in `.env`

## Testing Patterns (Future)

- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows (using Cypress per user preference)

---

**Last Updated**: 2025-01-27









