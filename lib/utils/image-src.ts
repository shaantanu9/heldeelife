/**
 * Product `image` fields may hold either a real URL or a placeholder emoji
 * (e.g. '📦'). next/image throws on anything that is not a URL/path, so
 * callers must check before rendering <Image>.
 */
export function isImageUrl(src: unknown): src is string {
  if (typeof src !== 'string') return false
  const value = src.trim()
  if (!value) return false
  if (/^https?:\/\//i.test(value)) return true
  // Root-relative local asset (but not protocol-relative "//host")
  return value.startsWith('/') && !value.startsWith('//')
}

/**
 * Plain http:// hosts (other than localhost) are not in next.config's
 * remotePatterns, so they must bypass the optimizer.
 */
export function needsUnoptimized(src: string): boolean {
  return /^http:\/\//i.test(src) && !/^http:\/\/localhost[:/]/i.test(src)
}
