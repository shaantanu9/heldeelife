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
            // Enhanced error logging
            if (authError) {
              console.error('Auth error:', {
                message: authError.message,
                status: authError.status,
                name: authError.name,
              })

              // Check for connection errors
              if (
                authError.message?.includes('fetch failed') ||
                authError.message?.includes('ENOTFOUND') ||
                authError.message?.includes('ECONNREFUSED')
              ) {
                console.error(
                  '⚠️  Supabase connection error - check:',
                  '\n   1. Supabase project is active (not paused)',
                  '\n   2. SUPABASE_URL is correct in .env.local',
                  '\n   3. Network connectivity',
                  '\n   4. Run: npx tsx scripts/check-supabase-connection.ts'
                )
              }
            }
            return null
          }

          // Get or create user profile
          const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          // If profile doesn't exist, create it with default 'user' role
          if (!userProfile) {
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email || email,
                phone_number: phoneNumber,
                role: 'user', // Default role for new users
              })

            if (insertError) {
              console.error('Profile creation error:', insertError)
            }
          } else if (phoneNumber && !userProfile.phone_number) {
            // Update phone number if it wasn't set before
            await supabaseAdmin
              .from('users')
              .update({ phone_number: phoneNumber })
              .eq('id', authData.user.id)
          }

          // Return user data for NextAuth
          return {
            id: authData.user.id,
            email: authData.user.email || email,
            name:
              authData.user.user_metadata?.full_name ||
              userProfile?.full_name ||
              null,
            phoneNumber: phoneNumber || userProfile?.phone_number || null,
            role: (userProfile?.role as 'user' | 'admin') || 'user',
          }
        } catch (error) {
          // Enhanced error handling
          if (error instanceof Error) {
            console.error('Authorization error:', {
              message: error.message,
              name: error.name,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            })

            // Check for network/DNS errors
            if (
              error.message.includes('fetch failed') ||
              error.message.includes('ENOTFOUND') ||
              error.message.includes('ECONNREFUSED') ||
              (error as any).code === 'ENOTFOUND'
            ) {
              console.error(
                '⚠️  Network/DNS error detected:',
                '\n   This usually means:',
                '\n   - Supabase project is paused or deleted',
                '\n   - Incorrect SUPABASE_URL',
                '\n   - Network connectivity issue',
                '\n   Run diagnostic: npx tsx scripts/check-supabase-connection.ts'
              )
            }
          } else {
            console.error('Authorization error:', error)
          }
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
