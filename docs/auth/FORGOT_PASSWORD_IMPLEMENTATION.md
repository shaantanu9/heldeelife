# Forgot Password Implementation

## Overview

The forgot password feature allows users to reset their password securely using email or phone number. The implementation uses Supabase's built-in password reset functionality, which sends a secure reset link via email.

## Features

- ✅ Email/Phone number support (consistent with signin/signup)
- ✅ Secure token-based password reset
- ✅ User-friendly UI with clear feedback
- ✅ Security best practices (doesn't reveal if email exists)
- ✅ Automatic redirect after successful reset
- ✅ Password validation (minimum 6 characters)

## User Flow

### 1. Request Password Reset

1. User clicks **"Forgot password?"** link on the signin page (`/auth/signin`)
2. User is redirected to the forgot password page (`/auth/forgot-password`)
3. User enters their email or phone number
4. System sends password reset email via Supabase
5. User receives a success message (regardless of whether email exists - security best practice)

### 2. Reset Password

1. User clicks the password reset link in their email
2. Supabase redirects to `/auth/reset-password` with tokens in URL hash
3. User enters new password (minimum 6 characters)
4. User confirms new password
5. System validates and updates password
6. User is redirected to signin page with success message

## Technical Implementation

### Architecture

```
┌─────────────────┐
│  Sign In Page   │
│  /auth/signin   │
└────────┬────────┘
         │ "Forgot password?" link
         ▼
┌─────────────────────┐
│ Forgot Password Page │
│ /auth/forgot-password│
└──────────┬──────────┘
           │ POST /api/auth/forgot-password
           ▼
┌──────────────────────────┐
│ Forgot Password API Route │
│ Uses Supabase             │
│ resetPasswordForEmail()   │
└──────────┬───────────────┘
           │ Sends email with reset link
           ▼
┌──────────────────────┐
│  User's Email Inbox   │
│  Reset Link Received  │
└──────────┬───────────┘
           │ User clicks link
           ▼
┌─────────────────────┐
│ Reset Password Page │
│ /auth/reset-password │
└──────────┬──────────┘
           │ Extracts tokens from URL hash
           │ Updates password via Supabase
           ▼
┌─────────────────┐
│  Sign In Page   │
│  (Redirected)    │
└─────────────────┘
```

### Files Structure

```
app/
├── auth/
│   ├── signin/
│   │   └── page.tsx                    # Updated with forgot password link
│   ├── forgot-password/
│   │   └── page.tsx                    # Forgot password request page
│   └── reset-password/
│       └── page.tsx                    # Password reset page
└── api/
    └── auth/
        ├── forgot-password/
        │   └── route.ts                # API: Request password reset
        └── reset-password/
            └── route.ts                # API: Reset password (fallback)
```

## API Endpoints

### POST `/api/auth/forgot-password`

**Purpose**: Request a password reset email

**Request Body**:

```json
{
  "emailOrPhone": "user@example.com" // or phone number
}
```

**Response** (Success):

```json
{
  "message": "If an account exists with this email or phone number, a password reset link has been sent."
}
```

**Response** (Error):

```json
{
  "error": "Email or phone number is required"
}
```

**Implementation Details**:

- Converts phone number to email format using `toEmailFormat()` utility
- **Rate limiting**: Checks recent attempts using `get_recent_reset_attempts()` function
  - Maximum 5 attempts per email per 24 hours
  - Rate-limited requests are logged but no email is sent
- **Audit logging**: Logs all attempts to `password_reset_attempts` table
  - Captures IP address, user agent, email, user_id, status
- Uses Supabase `resetPasswordForEmail()` to send reset email
- Always returns success message (security best practice - doesn't reveal if email exists)
- Redirect URL is set to `/auth/reset-password`

### POST `/api/auth/reset-password`

**Purpose**: Reset password using access token (fallback method)

**Request Body**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "newSecurePassword123"
}
```

**Response** (Success):

```json
{
  "message": "Password reset successfully"
}
```

**Response** (Error):

```json
{
  "error": "Invalid or expired reset token. Please request a new password reset link."
}
```

**Implementation Details**:

- Validates and uses access token to create session
- Updates password via Supabase `updateUser()`
- **Tracks completion**: Marks password reset attempt as completed in database
  - Uses `mark_password_reset_completed()` function if attemptId provided
  - Otherwise finds most recent attempt for the user and marks it complete
- Logs failures with reason for security monitoring

**Note**: This is primarily a fallback. The main flow uses client-side Supabase client, but completion tracking works for both flows.

## Pages

### Forgot Password Page (`/auth/forgot-password`)

**Features**:

- Clean, user-friendly UI matching the signin/signup design
- Email/phone number input field
- Success message after submission
- Link back to signin page
- Loading states during API call

**Key Code**:

```typescript
const response = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ emailOrPhone }),
})
```

### Reset Password Page (`/auth/reset-password`)

**Features**:

- Extracts tokens from URL hash (Supabase standard flow)
- Password and confirm password fields
- Password visibility toggle
- Password validation (min 6 characters, matching confirmation)
- Success message and auto-redirect to signin

**Key Code**:

```typescript
// Extract tokens from URL hash
const hashParams = new URLSearchParams(window.location.hash.substring(1))
const accessToken = hashParams.get('access_token')
const refreshToken = hashParams.get('refresh_token')

// Set session and update password
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken || '',
})

await supabase.auth.updateUser({
  password: password,
})
```

## Supabase Integration

### Password Reset Email

When `resetPasswordForEmail()` is called, Supabase:

1. Generates a secure recovery token
2. Sends an email to the user with a reset link
3. The link includes tokens in the URL hash: `#access_token=...&refresh_token=...&type=recovery`

### Email Template

The email template is configured in Supabase Dashboard:

- **Path**: Authentication → Email Templates → Reset Password
- **Redirect URL**: Should point to your site's `/auth/reset-password` page
- **Template Variables**: Available variables include `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.

### Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Security Considerations

### 1. Email Existence Privacy

- The API always returns a success message, even if the email doesn't exist
- This prevents attackers from discovering valid email addresses

### 2. Token Security

- Tokens are only valid for a limited time (configured in Supabase, default: 1 hour)
- Tokens are single-use (consumed after password reset)
- Tokens are transmitted securely via HTTPS

### 3. Password Requirements

- Minimum 6 characters (can be increased)
- Password confirmation to prevent typos
- Password is hashed by Supabase (never stored in plain text)

### 4. Rate Limiting

- **Database-level rate limiting**: Maximum 5 reset attempts per email per 24 hours
- Uses `get_recent_reset_attempts()` database function to check attempts
- Prevents abuse and brute force attacks
- Rate-limited requests are still logged but no email is sent

### 5. Audit Logging

- All password reset attempts are logged to `password_reset_attempts` table
- Tracks: user_id, email, IP address, user agent, status, timestamps
- Helps identify suspicious activity and security issues
- Admins can view all reset attempts for security monitoring

## Phone Number Support

The forgot password feature supports both email and phone numbers, consistent with the signin/signup flow:

- **Phone numbers** are converted to email format: `{phone}@heldeelife.com`
- Uses the same `toEmailFormat()` utility from `lib/auth-utils.ts`
- Works seamlessly with existing authentication system

## Testing

### Manual Testing Steps

1. **Test Forgot Password Request**:

   ```
   1. Navigate to /auth/signin
   2. Click "Forgot password?"
   3. Enter a valid email or phone number
   4. Submit form
   5. Verify success message appears
   6. Check email inbox for reset link
   ```

2. **Test Password Reset**:

   ```
   1. Click reset link in email
   2. Verify redirect to /auth/reset-password
   3. Enter new password (min 6 characters)
   4. Confirm password
   5. Submit form
   6. Verify redirect to /auth/signin
   7. Sign in with new password
   ```

3. **Test Error Cases**:
   ```
   - Invalid/expired token
   - Password mismatch
   - Password too short
   - Missing token
   ```

### Test with Different Inputs

- **Email**: `user@example.com`
- **Phone**: `+1234567890` or `1234567890`
- **Invalid email**: Should still show success (security)
- **Non-existent account**: Should still show success (security)

## Troubleshooting

### Issue: Reset link not received

**Possible Causes**:

1. Email in spam folder
2. Incorrect email address
3. Supabase email service not configured
4. Rate limiting (too many requests)

**Solutions**:

- Check spam/junk folder
- Verify email address in Supabase Auth dashboard
- Check Supabase email settings
- Wait before requesting another reset

### Issue: "Invalid or expired token"

**Possible Causes**:

1. Token already used
2. Token expired
3. Token corrupted in URL

**Solutions**:

- Request a new password reset link
- Ensure full URL is copied correctly
- Check token hasn't expired (default: 1 hour)

### Issue: Password reset not working

**Possible Causes**:

1. Supabase client not initialized
2. Session not set correctly
3. Network error

**Solutions**:

- Check browser console for errors
- Verify Supabase environment variables
- Check network tab for API errors
- Ensure tokens are extracted correctly from URL hash

## Configuration

### Supabase Dashboard Settings

1. **Authentication → URL Configuration**:
   - Site URL: Your production URL
   - Redirect URLs: Add `/auth/reset-password`

2. **Authentication → Email Templates**:
   - Customize reset password email template
   - Ensure `{{ .ConfirmationURL }}` is included

3. **Authentication → Settings**:
   - Password reset token expiry (default: 1 hour)
   - Enable/disable password reset

## Future Enhancements

Potential improvements:

- [ ] SMS password reset for phone numbers
- [ ] Password strength meter
- [ ] Two-factor authentication integration
- [ ] Password reset history/audit log
- [ ] Custom email templates with branding
- [ ] Rate limiting UI feedback

## Database Schema

### Users Table

The `users` table stores user profiles and is automatically created/updated by the migration:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**:

- `idx_users_email` - Fast email lookups
- `idx_users_phone_number` - Fast phone number lookups
- `idx_users_role` - Role-based queries
- `idx_users_created_at` - Chronological queries

### Password Reset Attempts Table (Optional Audit)

For security monitoring and audit purposes, a `password_reset_attempts` table tracks reset requests:

```sql
CREATE TABLE password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested', 'completed', 'expired', 'failed')),
  reset_token_hash TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**:

- `idx_password_reset_attempts_user_id` - User-specific queries
- `idx_password_reset_attempts_email` - Email-based queries
- `idx_password_reset_attempts_status` - Status filtering
- `idx_password_reset_attempts_recent` - Rate limiting queries (last 24 hours)

**Database Functions**:

- `log_password_reset_attempt()` - Log a reset request
- `get_recent_reset_attempts()` - Check rate limiting (count attempts in last N hours)
- `mark_password_reset_completed()` - Mark attempt as completed

**Note**: The password reset attempts table is optional. The forgot password feature works without it, but it provides valuable security monitoring capabilities.

### Migration File

The database schema is defined in:

- `supabase/migrations/009_password_reset_schema.sql`

This migration:

- Ensures the `users` table exists with all required columns
- Creates the optional `password_reset_attempts` table for audit
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Defines helper functions for tracking and rate limiting

## Related Files

- `lib/auth-utils.ts` - Email/phone conversion utilities
- `lib/supabase/client.ts` - Supabase client for client-side operations
- `lib/supabase/server.ts` - Supabase admin client for server-side operations
- `app/auth/signin/page.tsx` - Signin page with forgot password link
- `app/auth/signup/page.tsx` - Signup page (related auth flow)
- `supabase/migrations/009_password_reset_schema.sql` - Database schema migration

## Summary

The forgot password feature provides a secure, user-friendly way for users to reset their passwords. It integrates seamlessly with the existing authentication system, supports both email and phone numbers, and follows security best practices. The implementation uses Supabase's built-in password reset functionality, ensuring reliability and security.

The database schema includes:

- ✅ Users table with proper indexes and RLS policies
- ✅ Optional password reset attempts tracking for security monitoring
- ✅ Helper functions for rate limiting and audit logging
- ✅ Comprehensive indexes for optimal query performance

---

**Last Updated**: 2025-01-27  
**Status**: ✅ Fully Operational  
**Version**: 1.0
