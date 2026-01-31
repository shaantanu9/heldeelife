# NextAuth + Supabase Authentication Setup

## ✅ Setup Complete

Authentication is now fully integrated with NextAuth and Supabase, supporting both email and phone number login.

## Features

### 🔐 Authentication Features

- ✅ Email login support
- ✅ Phone number login support (automatically converts to `number@heldeelife.com`)
- ✅ Seamless user experience (users don't see the @heldeelife.com domain)
- ✅ JWT-based sessions
- ✅ Secure password authentication via Supabase
- ✅ User profile management

### 📱 Phone Number Support

- Users can enter phone numbers (e.g., `1234567890`) or emails
- Phone numbers are automatically converted to `number@heldeelife.com` format
- Phone numbers are stored separately in the database
- Users never see the @heldeelife.com domain in the UI

## Database Schema

### `users` Table

```sql
- id (UUID, Primary Key) - References auth.users(id)
- phone_number (TEXT, Unique) - User's phone number
- email (TEXT) - User's email (may be phone@heldeelife.com)
- full_name (TEXT, Nullable) - User's full name
- created_at (TIMESTAMPTZ) - Account creation timestamp
- updated_at (TIMESTAMPTZ) - Last update timestamp
```

**Security:**

- Row Level Security (RLS) enabled
- Users can only view/update their own profile
- Policies configured for authenticated users

## Files Created/Modified

### Core Authentication

- `lib/auth-options.ts` - NextAuth configuration with Supabase integration
- `lib/auth-utils.ts` - Phone number/email conversion utilities
- `types/next-auth.d.ts` - TypeScript type definitions

### API Routes

- `app/api/auth/signup/route.ts` - User registration endpoint
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler (existing)

### Pages

- `app/auth/signin/page.tsx` - Sign in page
- `app/auth/signup/page.tsx` - Sign up page
- `app/profile/page.tsx` - Updated to show phone number

## Usage

### Sign Up Flow

1. User enters phone number or email
2. System converts phone to `number@heldeelife.com` format
3. Account created in Supabase Auth
4. User profile created in `users` table
5. Phone number stored separately for easy lookup

### Sign In Flow

1. User enters phone number or email
2. System converts phone to `number@heldeelife.com` format
3. Authentication via Supabase
4. Session created with JWT
5. User redirected to profile page

### Accessing User Data

```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()

  // Access user data
  const userId = session?.user?.id
  const email = session?.user?.email
  const phoneNumber = session?.user?.phoneNumber
  const name = session?.user?.name
}
```

### Server-Side Access

```typescript
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Access user data
  const userId = session.user.id
  const email = session.user.email
  const phoneNumber = session.user.phoneNumber
}
```

## Utility Functions

### `lib/auth-utils.ts`

**`isPhoneNumber(input: string): boolean`**

- Checks if input is a phone number

**`normalizePhoneNumber(phone: string): string`**

- Removes spaces, dashes, parentheses, and + sign

**`toEmailFormat(input: string): string`**

- Converts phone number to `number@heldeelife.com` format
- Returns email as-is if already an email

**`extractPhoneFromEmail(email: string): string | null`**

- Extracts phone number from `number@heldeelife.com` format

**`isValidInput(input: string): boolean`**

- Validates if input is valid phone number or email

## Environment Variables

Required in `.env`:

```env
# Supabase
SUPABASE_URL=https://jwkduwxvxtggpxlzgyan.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://jwkduwxvxtggpxlzgyan.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# NextAuth
NEXTAUTH_URL=http://localhost:4400
NEXTAUTH_SECRET=your_secret
```

## Testing

### Test Sign Up

1. Navigate to `/auth/signup`
2. Enter phone number (e.g., `1234567890`) or email
3. Enter password (min 6 characters)
4. Submit form
5. Check Supabase Auth dashboard for new user

### Test Sign In

1. Navigate to `/auth/signin`
2. Enter phone number or email used during signup
3. Enter password
4. Should redirect to `/profile`

### Verify Data Storage

```sql
-- Check users table
SELECT * FROM users;

-- Check auth.users
SELECT id, email FROM auth.users;
```

## Security Considerations

1. **Password Requirements**: Minimum 6 characters (can be increased)
2. **RLS Policies**: Users can only access their own data
3. **Service Role Key**: Never exposed to client-side
4. **JWT Sessions**: 30-day expiration
5. **Phone Number Storage**: Stored separately for easy queries

## Next Steps

1. **Email Verification**: Configure Supabase email templates
2. **Password Reset**: Add forgot password functionality
3. **Phone Verification**: Add SMS verification if needed
4. **Profile Updates**: Add profile editing functionality
5. **Social Login**: Add OAuth providers if needed

## Troubleshooting

### User can't sign in

- Check if user exists in Supabase Auth dashboard
- Verify email format (should be `number@heldeelife.com` for phones)
- Check password is correct

### Phone number not showing

- Verify user profile was created in `users` table
- Check if phone_number field was populated during signup

### TypeScript errors

- Ensure `types/next-auth.d.ts` is included in `tsconfig.json`
- Restart TypeScript server

---

**Last Updated**: 2025-11-24
**Status**: ✅ Fully Operational

