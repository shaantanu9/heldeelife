/**
 * Sanitise a free-text search term before interpolating it into a PostgREST
 * `.or()` / `.ilike` filter string. Characters such as `,` `(` `)` separate or
 * group filter expressions, `*` and `%` are wildcards and `\` escapes, so a
 * user-supplied term containing them could break or alter the filter.
 */
export function sanitizePostgrestSearch(term: string, maxLength = 100): string {
  return term
    .replace(/[,()*%\\"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}
