/**
 * Safe JSON-LD rendering.
 *
 * Content from the database (product names, blog text) is embedded inside a
 * <script> tag, so a raw JSON.stringify would let a value containing
 * "</script>" break out of the tag. We escape the characters that matter and
 * drop empty values so Google's Rich Results test doesn't flag nulls.
 */

type JsonLdNode = Record<string, unknown>

function prune(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((v) => v !== undefined)
    return items.length > 0 ? items : undefined
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, prune(v)] as const)
      .filter(([, v]) => v !== undefined)
    return entries.length > 0 ? Object.fromEntries(entries) : undefined
  }
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number' && !Number.isFinite(value)) return undefined
  return value
}

export function serializeJsonLd(data: JsonLdNode | JsonLdNode[]): string {
  const payload = Array.isArray(data)
    ? {
        '@context': 'https://schema.org',
        '@graph': data.map(({ '@context': _ctx, ...node }) => node),
      }
    : { '@context': 'https://schema.org', ...data }

  return JSON.stringify(prune(payload) ?? {})
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Render one schema node, or several as a single @graph.
 */
export function JsonLd({
  data,
  id,
}: {
  data: JsonLdNode | JsonLdNode[]
  id?: string
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
