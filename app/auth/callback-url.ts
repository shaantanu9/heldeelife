/**
 * Sanitises a post-login redirect target taken from `?callbackUrl=`.
 *
 * Only same-origin relative paths are allowed (must start with a single `/`).
 * Protocol-relative (`//evil.com`), backslash tricks (`/\evil.com`), absolute
 * URLs (`https://evil.com`), `javascript:` etc. are rejected. An absolute URL
 * pointing at the current origin (NextAuth's middleware produces these) is
 * reduced to its path + search + hash.
 */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback = '/profile',
  currentOrigin?: string
): string {
  if (!raw || typeof raw !== 'string') return fallback

  let value = raw.trim()
  if (!value) return fallback

  // Same-origin absolute URL -> make it relative
  if (currentOrigin && /^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      if (url.origin !== currentOrigin) return fallback
      value = `${url.pathname}${url.search}${url.hash}`
    } catch {
      return fallback
    }
  }

  if (!value.startsWith('/')) return fallback
  // Reject protocol-relative and backslash variants (browsers treat `\` as `/`)
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  // Reject control characters / whitespace that could be used for smuggling
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return fallback
  if (value.includes('\\')) return fallback

  // Avoid redirect loops back into the auth pages
  if (value === '/auth/signin' || value.startsWith('/auth/signin?')) {
    return fallback
  }

  return value
}
