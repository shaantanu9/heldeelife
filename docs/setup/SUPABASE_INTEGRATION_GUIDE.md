# Complete Supabase Integration Guide for Next.js

This comprehensive guide documents how Supabase is integrated in this Next.js application. Use this guide to replicate the same integration patterns in other Next.js projects.

## Table of Contents

1. [Overview](#overview)
2. [Setup & Installation](#setup--installation)
3. [Client Configuration](#client-configuration)
4. [Server Configuration](#server-configuration)
5. [Authentication Integration](#authentication-integration)
6. [API Route Patterns](#api-route-patterns)
7. [Server Components Usage](#server-components-usage)
8. [Row Level Security (RLS)](#row-level-security-rls)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Code Examples](#code-examples)

---

## Overview

This application uses **Supabase** as the complete backend solution, providing:
- **PostgreSQL Database** - Primary data storage
- **Authentication** - User authentication via Supabase Auth
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time capabilities** - (Optional, not used in this app)

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Client     │  │   Server     │  │   Admin      │  │
│  │   Component  │  │   Component  │  │   API Route  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                   ┌────────▼────────┐                    │
│                   │  Supabase Client│                    │
│                   │   (lib/supabase) │                    │
│                   └────────┬────────┘                    │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   Supabase Cloud   │
                   │  (PostgreSQL +     │
                   │   Auth + RLS)      │
                   └────────────────────┘
```

---

## Setup & Installation

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install next-auth
```

### 2. Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

**Important Notes:**
- `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` should be the same
- `SUPABASE_SERVICE_ROLE_KEY` is used for admin operations (server-side only)
- `SUPABASE_ANON_KEY` is used for client-side and public operations
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code

### 3. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Client Configuration

### File: `lib/supabase/client.ts`

**Purpose**: Client-side Supabase client for browser usage

```typescript
'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Usage in Client Components:**

```typescript
'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function MyComponent() {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(10)

      if (error) {
        console.error('Error:', error)
        return
      }

      setData(data)
    }

    fetchData()
  }, [])

  return <div>{/* Render data */}</div>
}
```

**Key Points:**
- Only use in client components (`'use client'`)
- Uses `NEXT_PUBLIC_` environment variables
- Respects RLS policies automatically
- Session management handled by Supabase Auth

---

## Server Configuration

### File: `lib/supabase/server.ts`

**Purpose**: Server-side Supabase clients for API routes and server components

```typescript
import { createClient } from '@supabase/supabase-js'

/**
 * Creates Supabase admin client with service role key
 * Bypasses RLS - use only in API routes and server-side operations
 */
function createSupabaseAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    const error = new Error('Missing env.SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
    console.error('❌ Supabase Configuration Error:', error.message)
    console.error('   Please add SUPABASE_URL to your .env.local file')
    throw error
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey
  if (!key) {
    const error = new Error(
      'Missing env.SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY'
    )
    console.error('❌ Supabase Configuration Error:', error.message)
    console.error('   Please add API keys to your .env.local file')
    throw error
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (urlError) {
    const error = new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`)
    console.error('❌ Supabase Configuration Error:', error.message)
    console.error('   SUPABASE_URL should be: https://your-project.supabase.co')
    throw error
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Creates regular Supabase client for server-side operations
 * Respects RLS policies
 */
function createSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing env.SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Export clients
export const supabaseAdmin = createSupabaseAdminClient()
export const supabase = createSupabaseClient()
```

**Key Differences:**

| Client | Key Used | RLS | Use Case |
|--------|----------|-----|----------|
| `supabaseAdmin` | Service Role | Bypassed | API routes, admin operations |
| `supabase` | Anon Key | Enforced | Server components, user operations |

**When to Use Each:**

- **`supabaseAdmin`**: 
  - API routes that need to bypass RLS
  - Admin operations
  - Bulk operations
  - System-level queries

- **`supabase`**:
  - Server components
  - User-specific queries
  - When RLS should be enforced

---

## Authentication Integration

### NextAuth + Supabase Auth

This app uses **NextAuth.js** for session management with **Supabase Auth** for authentication.

### File: `lib/auth-options.ts`

```typescript
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  toEmailFormat,
  extractPhoneFromEmail,
  normalizePhoneNumber,
} from '@/lib/auth-utils'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrPhone: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) {
          return null
        }

        try {
          // Convert phone number to email format if needed
          const email = toEmailFormat(credentials.emailOrPhone)
          const phoneNumber = extractPhoneFromEmail(email)
            ? normalizePhoneNumber(credentials.emailOrPhone)
            : null

          // Sign in with Supabase
          const { data: authData, error: authError } =
            await supabaseAdmin.auth.signInWithPassword({
              email,
              password: credentials.password,
            })

          if (authError || !authData.user) {
            console.error('Auth error:', authError)
            return null
          }

          // Get or create user profile
          const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          // If profile doesn't exist, create it
          if (!userProfile) {
            await supabaseAdmin.from('users').insert({
              id: authData.user.id,
              email: authData.user.email || email,
              phone_number: phoneNumber,
              role: 'user', // Default role
            })
          }

          // Return user data for NextAuth
          return {
            id: authData.user.id,
            email: authData.user.email || email,
            name: userProfile?.full_name || null,
            phoneNumber: phoneNumber || userProfile?.phone_number || null,
            role: (userProfile?.role as 'user' | 'admin') || 'user',
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.phoneNumber = (user as any).phoneNumber
        token.role = (user as any).role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        ;(session.user as any).phoneNumber = token.phoneNumber as string | null
        session.user.role = (token.role as 'user' | 'admin') || 'user'
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

### TypeScript Types

**File: `types/next-auth.d.ts`**

```typescript
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      phoneNumber?: string | null
      image?: string | null
      role?: 'user' | 'admin'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    phoneNumber?: string | null
    role?: 'user' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    phoneNumber?: string | null
    role?: 'user' | 'admin'
  }
}
```

### API Route: `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Usage in Components

**Client Component:**

```typescript
'use client'

import { useSession } from 'next-auth/react'

export function MyComponent() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>

  return (
    <div>
      <p>User: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
```

**Server Component or API Route:**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Use session.user.id, session.user.role, etc.
  return Response.json({ user: session.user })
}
```

---

## API Route Patterns

### Standard API Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  isSupabaseConnectionError,
  createSupabaseErrorResponse,
} from '@/lib/utils/supabase-error-handler'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization check (if needed)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Build query
    let query = supabaseAdmin
      .from('table_name')
      .select('*')
      .eq('column', 'value')

    // 4. Execute query with error handling
    let data, error
    try {
      const result = await query
      data = result.data
      error = result.error
    } catch (queryError) {
      if (isSupabaseConnectionError(queryError)) {
        const errorResponse = createSupabaseErrorResponse(queryError)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
            data: [],
          },
          { status: 503 }
        )
      }
      throw queryError
    }

    // 5. Handle errors
    if (error) {
      if (isSupabaseConnectionError(error)) {
        const errorResponse = createSupabaseErrorResponse(error)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
            data: [],
          },
          { status: 503 }
        )
      }

      console.error('Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    // 6. Return success response
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Common Query Patterns

**1. Simple Select with Filters**

```typescript
const { data, error } = await supabaseAdmin
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(10)
```

**2. Select with Relations**

```typescript
const { data, error } = await supabaseAdmin
  .from('orders')
  .select(`
    *,
    order_items (
      id,
      product_name,
      quantity,
      unit_price
    ),
    user:users (
      id,
      email,
      full_name
    )
  `)
  .eq('user_id', userId)
```

**3. Pagination**

```typescript
const page = 1
const limit = 20
const offset = (page - 1) * limit

const { data, error, count } = await supabaseAdmin
  .from('products')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
```

**4. Search**

```typescript
const { data, error } = await supabaseAdmin
  .from('products')
  .select('*')
  .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
```

**5. Insert**

```typescript
const { data, error } = await supabaseAdmin
  .from('products')
  .insert({
    name: 'Product Name',
    price: 99.99,
    is_active: true,
  })
  .select()
  .single()
```

**6. Update**

```typescript
const { data, error } = await supabaseAdmin
  .from('products')
  .update({ price: 89.99 })
  .eq('id', productId)
  .select()
  .single()
```

**7. Delete**

```typescript
const { error } = await supabaseAdmin
  .from('products')
  .delete()
  .eq('id', productId)
```

**8. Upsert (Insert or Update)**

```typescript
const { data, error } = await supabaseAdmin
  .from('products')
  .upsert({
    id: productId,
    name: 'Updated Name',
    price: 99.99,
  })
  .select()
  .single()
```

---

## Server Components Usage

### Basic Server Component

```typescript
import { supabase } from '@/lib/supabase/server'

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .limit(10)

  if (error) {
    return <div>Error loading products</div>
  }

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

### With Error Handling

```typescript
import { supabase } from '@/lib/supabase/server'
import {
  isSupabaseConnectionError,
  analyzeSupabaseError,
} from '@/lib/utils/supabase-error-handler'

export default async function ProductsPage() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)

    if (error) {
      if (isSupabaseConnectionError(error)) {
        const errorInfo = analyzeSupabaseError(error)
        return (
          <div>
            <h1>Connection Error</h1>
            <p>{errorInfo.userMessage}</p>
            <p>{errorInfo.suggestion}</p>
          </div>
        )
      }
      throw error
    }

    return (
      <div>
        {products?.map((product) => (
          <div key={product.id}>{product.name}</div>
        ))}
      </div>
    )
  } catch (error) {
    console.error('Error:', error)
    return <div>An error occurred</div>
  }
}
```

---

## Row Level Security (RLS)

### What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control access to individual rows in a table based on the user executing the query.

### Enable RLS on Tables

```sql
-- Enable RLS on a table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Common RLS Policy Patterns

**1. Public Read, Authenticated Write**

```sql
-- Public can view active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all products
CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**2. Users Can Only Access Their Own Data**

```sql
-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own orders
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**3. Admin-Only Access**

```sql
-- Admins can do everything
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

**4. Role-Based Access**

```sql
-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Testing RLS Policies

**Important**: When using `supabaseAdmin` (service role key), RLS is **bypassed**. To test RLS:

1. Use `supabase` client (anon key) in client components
2. Ensure user is authenticated
3. Test with different user roles

---

## Error Handling

### Error Handler Utility

**File: `lib/utils/supabase-error-handler.ts`**

This utility provides comprehensive error handling for Supabase connection issues:

```typescript
import {
  isSupabaseConnectionError,
  createSupabaseErrorResponse,
  analyzeSupabaseError,
} from '@/lib/utils/supabase-error-handler'

// In API route
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')

    if (error) {
      if (isSupabaseConnectionError(error)) {
        const errorResponse = createSupabaseErrorResponse(error)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
          },
          { status: 503 }
        )
      }
      // Handle other errors
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    if (isSupabaseConnectionError(error)) {
      const errorResponse = createSupabaseErrorResponse(error)
      return NextResponse.json(
        {
          error: errorResponse.error,
          suggestion: errorResponse.suggestion,
        },
        { status: 503 }
      )
    }
    throw error
  }
}
```

### Error Types Handled

1. **Connection Errors**: Network issues, DNS failures
2. **Paused Project**: Supabase project is paused
3. **Configuration Errors**: Missing or invalid env variables
4. **Database Errors**: Query errors, constraint violations

---

## Best Practices

### 1. Always Use Try-Catch

```typescript
try {
  const { data, error } = await supabaseAdmin.from('table').select('*')
  // Handle result
} catch (error) {
  console.error('Error:', error)
  // Handle error
}
```

### 2. Check for Errors

```typescript
const { data, error } = await supabaseAdmin.from('table').select('*')

if (error) {
  console.error('Error:', error)
  return // Handle error
}

// Use data
```

### 3. Use Appropriate Client

- **`supabaseAdmin`**: API routes, admin operations, bypassing RLS
- **`supabase`**: Server components, user operations, respecting RLS
- **`supabase` (client)**: Client components, browser usage

### 4. Handle Connection Errors Gracefully

```typescript
if (isSupabaseConnectionError(error)) {
  // Return user-friendly error message
  // Don't expose technical details
}
```

### 5. Use Transactions for Related Operations

```typescript
// Use Supabase transactions or handle rollback manually
const { data: order, error: orderError } = await supabaseAdmin
  .from('orders')
  .insert(orderData)
  .select()
  .single()

if (orderError) {
  // Rollback if needed
  return
}

// Continue with related operations
```

### 6. Validate Input Before Queries

```typescript
if (!productId || !isUUID(productId)) {
  return NextResponse.json(
    { error: 'Invalid product ID' },
    { status: 400 }
  )
}
```

### 7. Use Select with Specific Columns

```typescript
// Good: Select only needed columns
.select('id, name, price')

// Avoid: Select all columns when not needed
.select('*')
```

### 8. Use Indexes for Performance

Ensure database indexes exist for frequently queried columns:

```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

### 9. Cache Responses When Appropriate

```typescript
// In API route
const response = NextResponse.json({ data })
response.headers.set(
  'Cache-Control',
  'public, s-maxage=60, stale-while-revalidate=300'
)
return response
```

### 10. Use RLS Instead of Application-Level Checks

**Good**: Let RLS handle security
```typescript
// RLS policy ensures users can only see their own orders
const { data } = await supabase
  .from('orders')
  .select('*')
```

**Avoid**: Manual checks in application code
```typescript
// Don't do this - RLS should handle it
if (order.user_id !== session.user.id) {
  return // Unauthorized
}
```

---

## Code Examples

### Complete API Route Example

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  isSupabaseConnectionError,
  createSupabaseErrorResponse,
} from '@/lib/utils/supabase-error-handler'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 4. Build query
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    // 5. Execute query
    let orders, error, count
    try {
      const result = await query
      orders = result.data
      error = result.error
      count = result.count
    } catch (queryError) {
      if (isSupabaseConnectionError(queryError)) {
        const errorResponse = createSupabaseErrorResponse(queryError)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
            orders: [],
            count: 0,
          },
          { status: 503 }
        )
      }
      throw queryError
    }

    // 6. Handle errors
    if (error) {
      if (isSupabaseConnectionError(error)) {
        const errorResponse = createSupabaseErrorResponse(error)
        return NextResponse.json(
          {
            error: errorResponse.error,
            suggestion: errorResponse.suggestion,
            orders: [],
            count: 0,
          },
          { status: 503 }
        )
      }

      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // 7. Return success
    return NextResponse.json({
      orders: orders || [],
      count: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Complete Server Component Example

```typescript
import { supabase } from '@/lib/supabase/server'
import {
  isSupabaseConnectionError,
  analyzeSupabaseError,
} from '@/lib/utils/supabase-error-handler'

export default async function ProductsPage() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      if (isSupabaseConnectionError(error)) {
        const errorInfo = analyzeSupabaseError(error)
        return (
          <div className="container py-8">
            <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
            <p className="text-red-600">{errorInfo.userMessage}</p>
            <p className="text-gray-600 mt-2">{errorInfo.suggestion}</p>
          </div>
        )
      }
      throw error
    }

    if (!products || products.length === 0) {
      return (
        <div className="container py-8">
          <p>No products found</p>
        </div>
      )
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-gray-600">${product.price}</p>
            </div>
          ))}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading products:', error)
    return (
      <div className="container py-8">
        <p className="text-red-600">An error occurred loading products</p>
      </div>
    )
  }
}
```

---

## Migration Checklist

When setting up Supabase in a new Next.js project:

- [ ] Install `@supabase/supabase-js` and `next-auth`
- [ ] Create `.env.local` with Supabase credentials
- [ ] Create `lib/supabase/client.ts` for client-side usage
- [ ] Create `lib/supabase/server.ts` for server-side usage
- [ ] Set up NextAuth with Supabase Auth integration
- [ ] Create TypeScript types for NextAuth session
- [ ] Set up error handling utilities
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for each table
- [ ] Test authentication flow
- [ ] Test API routes with authentication
- [ ] Test server components
- [ ] Test error handling

---

## Troubleshooting

### Common Issues

**1. "Missing env.NEXT_PUBLIC_SUPABASE_URL"**
- Check `.env.local` file exists
- Verify environment variable names
- Restart development server after adding env vars

**2. "Invalid SUPABASE_URL format"**
- URL should be: `https://your-project.supabase.co`
- No trailing slash
- Include `https://` protocol

**3. Connection Errors**
- Check Supabase project is not paused
- Verify network connectivity
- Check API keys are correct
- Run: `npx tsx scripts/check-supabase-connection.ts`

**4. RLS Policy Issues**
- Ensure user is authenticated
- Check policy conditions match your use case
- Use `supabaseAdmin` to bypass RLS for testing
- Verify `auth.uid()` returns correct user ID

**5. Type Errors**
- Ensure TypeScript types are properly declared
- Check `types/next-auth.d.ts` exists
- Restart TypeScript server in IDE

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Last Updated**: 2024-12-19

This guide provides a complete reference for integrating Supabase in Next.js applications. Follow the patterns and best practices outlined here for a robust, secure, and maintainable integration.



