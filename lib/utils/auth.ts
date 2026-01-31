import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'

/**
 * Get the current user session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

/**
 * Check if user is admin
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/')
  }
  return user
}

/**
 * Check if user is admin (returns boolean, doesn't redirect)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Check if user has admin role
 */
export function hasAdminRole(
  user: { role?: string } | null | undefined
): boolean {
  return user?.role === 'admin'
}









