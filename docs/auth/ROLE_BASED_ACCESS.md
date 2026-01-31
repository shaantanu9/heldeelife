# Role-Based Access Control (RBAC) Setup

## ✅ Implementation Complete

Your application now has role-based access control with two user roles:

### Roles

1. **User** (`user`)
   - Default role for all new signups
   - Can access ecommerce features:
     - Browse products
     - Add to cart
     - Checkout
     - View profile
     - View blog posts (read-only)

2. **Admin** (`admin`)
   - Can do everything users can do
   - Plus admin features:
     - Create/edit/delete blog posts
     - Manage blog categories and tags
     - Manage products (when implemented)
     - Manage users (when implemented)
     - View analytics (when implemented)
     - Access admin dashboard

## Database Schema

### `users` Table

- Added `role` column (TEXT, default: 'user')
- Constraint: role must be 'user' or 'admin'
- Indexed for fast lookups

## Authentication Flow

### Sign Up

- New users are automatically assigned `role: 'user'`
- Role is set in the signup API route

### Sign In

- User role is fetched from database
- Role is included in JWT token
- Role is available in session

## Protection Mechanisms

### 1. Middleware Protection

- File: `middleware.ts`
- Protects all `/admin/*` routes
- Redirects non-admin users to home page
- Requires authentication for admin routes

### 2. Server-Side Protection

- Utility functions in `lib/utils/auth.ts`:
  - `requireAuth()` - Ensures user is authenticated
  - `requireAdmin()` - Ensures user is admin (redirects if not)
  - `isAdmin()` - Returns boolean
  - `hasAdminRole()` - Client-side check

### 3. API Route Protection

- All blog management APIs check for admin role
- Returns 403 Forbidden if non-admin tries to access

### 4. Client-Side Protection

- Admin pages check role before rendering
- Redirects non-admin users
- UI elements only show for admins

## Usage

### Server Components

```typescript
import { requireAdmin } from "@/lib/utils/auth"

export default async function AdminPage() {
  await requireAdmin() // Redirects if not admin

  return <div>Admin Content</div>
}
```

### Client Components

```typescript
"use client"
import { useSession } from "next-auth/react"
import { hasAdminRole } from "@/lib/utils/auth"

export default function MyComponent() {
  const { data: session } = useSession()

  if (!hasAdminRole(session)) {
    return null // Or redirect
  }

  return <div>Admin Only Content</div>
}
```

### API Routes

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin-only logic
}
```

## Making a User Admin

To make a user an admin, update their role in the database:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Or via Supabase Dashboard:

1. Go to Table Editor → `users`
2. Find the user
3. Change `role` from `user` to `admin`

## Protected Routes

### Admin Routes (require admin role):

- `/admin` - Admin dashboard
- `/admin/blog` - Blog management
- `/admin/blog/new` - Create blog post
- `/admin/blog/[id]` - Edit blog post
- `/admin/products` - Product management (when implemented)
- `/admin/users` - User management (when implemented)
- `/admin/analytics` - Analytics (when implemented)
- `/admin/settings` - Settings (when implemented)

### Protected API Routes:

- `POST /api/blog/posts` - Create post
- `PUT /api/blog/posts/[id]` - Update post
- `DELETE /api/blog/posts/[id]` - Delete post
- `POST /api/blog/categories` - Create category
- `POST /api/blog/tags` - Create tag

## UI Updates

### Profile Page

- Shows "Admin Dashboard" button only for admins
- Regular users see standard profile options

### Navigation

- Admin links only visible to admins (can be added to header if needed)

## Security Notes

1. **Never trust client-side checks alone**
   - Always verify on server-side
   - Middleware provides first layer of protection
   - API routes provide second layer

2. **JWT Tokens**
   - Role is included in JWT
   - Token is signed and verified
   - Role cannot be modified client-side

3. **Database**
   - Role is stored in database
   - Always fetch fresh role from database on critical operations
   - RLS policies can be added for additional security

## Testing

### Test as Regular User:

1. Sign up with a new account
2. Try to access `/admin` - should redirect to home
3. Try to create a blog post - should get 403 error
4. Can browse products and blog posts normally

### Test as Admin:

1. Update a user's role to 'admin' in database
2. Sign in with that account
3. Should be able to access `/admin` dashboard
4. Should be able to create/edit blog posts
5. Should see "Admin Dashboard" in profile

## Next Steps

1. **Product Management**: Add admin-only product CRUD operations
2. **User Management**: Add admin interface to view/manage users
3. **Analytics**: Add admin-only analytics dashboard
4. **Permissions**: Consider adding more granular permissions (e.g., blog_editor, product_manager)
5. **Audit Log**: Track admin actions for security

