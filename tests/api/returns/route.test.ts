import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth-options', () => ({ authOptions: {} }))

/**
 * Minimal chainable PostgREST mock. Each `from(table)` call takes the next
 * queued result for that table; all builder methods return the chain and the
 * chain is awaitable / supports single() & maybeSingle().
 */
const db = vi.hoisted(() => {
  const queues: Record<string, any[]> = {}
  const calls: { table: string; method: string; args: any[] }[] = []
  function makeChain(table: string) {
    const result = () =>
      (queues[table] && queues[table].shift()) ?? { data: null, error: null }
    const chain: any = {}
    for (const m of [
      'select',
      'eq',
      'in',
      'order',
      'limit',
      'update',
      'insert',
      'delete',
    ]) {
      chain[m] = vi.fn((...args: any[]) => {
        calls.push({ table, method: m, args })
        return chain
      })
    }
    chain.single = vi.fn(() => Promise.resolve(result()))
    chain.maybeSingle = vi.fn(() => Promise.resolve(result()))
    chain.then = (res: any, rej: any) =>
      Promise.resolve(result()).then(res, rej)
    return chain
  }
  return {
    queues,
    calls,
    client: {
      from: vi.fn((table: string) => makeChain(table)),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  }
})

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: db.client }))

function queue(table: string, ...results: any[]) {
  db.queues[table] = [...(db.queues[table] || []), ...results]
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of Object.keys(db.queues)) delete db.queues[k]
  db.calls.length = 0
})

describe('PUT /api/returns/[id]', () => {
  it('forbids a non-admin owner from changing the status', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as any)
    queue('returns', {
      data: { id: 'r1', user_id: 'user-1', status: 'pending' },
      error: null,
    })

    const { PUT } = await import('@/app/api/returns/[id]/route')
    const res = await PUT(
      new NextRequest('http://localhost/api/returns/r1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'refunded' }),
      }),
      params('r1')
    )

    expect(res.status).toBe(403)
    expect(db.calls.some((c) => c.method === 'update')).toBe(false)
  })

  it('rejects an invalid status for admins', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any)
    const { PUT } = await import('@/app/api/returns/[id]/route')
    const res = await PUT(
      new NextRequest('http://localhost/api/returns/r1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'bogus' }),
      }),
      params('r1')
    )
    expect(res.status).toBe(400)
  })

  it('lets an admin update the status', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any)
    queue(
      'returns',
      {
        data: {
          id: 'r1',
          user_id: 'user-1',
          status: 'pending',
          order_id: 'o1',
        },
        error: null,
      },
      { data: { id: 'r1', status: 'approved' }, error: null }
    )
    const { PUT } = await import('@/app/api/returns/[id]/route')
    const res = await PUT(
      new NextRequest('http://localhost/api/returns/r1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      }),
      params('r1')
    )
    expect(res.status).toBe(200)
    const update = db.calls.find((c) => c.method === 'update')
    expect(update?.args[0]).toMatchObject({ status: 'approved' })
  })
})

describe('GET /api/returns', () => {
  it('does not embed users:user_id and responds with no-store', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as any)
    queue('returns', {
      data: [
        {
          id: 'r1',
          user_id: 'user-1',
          orders: {
            order_number: 'ORD1',
            customer_name: 'Jane',
            customer_email: 'j@x.com',
          },
        },
      ],
      error: null,
    })
    const { GET } = await import('@/app/api/returns/route')
    const res = await GET(new NextRequest('http://localhost/api/returns'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const select = db.calls.find(
      (c) => c.table === 'returns' && c.method === 'select'
    )
    expect(String(select?.args[0])).not.toMatch(/users\s*:\s*user_id/)
    const body = await res.json()
    expect(body.returns[0].customer_name).toBe('Jane')
  })
})

describe('POST /api/returns', () => {
  it('rejects an order_item_id that does not belong to the order', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as any)
    queue('orders', {
      data: {
        id: 'o1',
        user_id: 'user-1',
        status: 'delivered',
        total_amount: 100,
      },
      error: null,
    })
    queue('order_items', { data: null, error: null })

    const { POST } = await import('@/app/api/returns/route')
    const res = await POST(
      new NextRequest('http://localhost/api/returns', {
        method: 'POST',
        body: JSON.stringify({
          order_id: 'o1',
          order_item_id: 'item-from-other-order',
          reason: 'defective',
          description: 'broken',
        }),
      })
    )
    expect(res.status).toBe(400)
    expect(db.calls.some((c) => c.method === 'insert')).toBe(false)
    const itemEq = db.calls.filter(
      (c) => c.table === 'order_items' && c.method === 'eq'
    )
    expect(itemEq.map((c) => c.args)).toContainEqual(['order_id', 'o1'])
  })

  it('rejects returns for orders that are not delivered', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as any)
    queue('orders', {
      data: {
        id: 'o1',
        user_id: 'user-1',
        status: 'shipped',
        total_amount: 100,
      },
      error: null,
    })
    const { POST } = await import('@/app/api/returns/route')
    const res = await POST(
      new NextRequest('http://localhost/api/returns', {
        method: 'POST',
        body: JSON.stringify({
          order_id: 'o1',
          reason: 'defective',
          description: 'x',
        }),
      })
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/refunds', () => {
  it('blocks a new refund when one is already approved/processed', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as any)
    queue('orders', {
      data: {
        id: 'o1',
        user_id: 'user-1',
        status: 'delivered',
        total_amount: 100,
      },
      error: null,
    })
    queue('refunds', { data: [{ id: 'f1', status: 'approved' }], error: null })

    const { POST } = await import('@/app/api/refunds/route')
    const res = await POST(
      new NextRequest('http://localhost/api/refunds', {
        method: 'POST',
        body: JSON.stringify({ order_id: 'o1', reason: 'x', description: 'y' }),
      })
    )
    expect(res.status).toBe(400)
    const inCall = db.calls.find(
      (c) => c.table === 'refunds' && c.method === 'in'
    )
    expect(inCall?.args).toEqual([
      'status',
      ['pending', 'approved', 'processed'],
    ])
    expect(db.calls.some((c) => c.method === 'insert')).toBe(false)
  })
})
