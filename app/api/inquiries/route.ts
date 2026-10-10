import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const email = z.string().trim().toLowerCase().max(254).email('Invalid email')
const name = z.string().trim().min(1, 'Name is required').max(100)
const phone = z
  .string()
  .trim()
  .max(20)
  .regex(/^[+\d\s()-]{7,20}$/, 'Invalid phone number')

const contactSchema = z.object({
  type: z.literal('contact'),
  name,
  email,
  phone: z.union([phone, z.literal('')]).optional(),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(5000),
})

const consultationSchema = z.object({
  type: z.literal('consultation'),
  name,
  email,
  phone,
  service: z.string().trim().min(1, 'Service is required').max(100),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time'),
  message: z.string().trim().max(5000).optional(),
})

const newsletterSchema = z.object({
  type: z.literal('newsletter'),
  email,
  source: z.string().trim().max(50).optional(),
})

const inquirySchema = z.discriminatedUnion('type', [
  contactSchema,
  consultationSchema,
  newsletterSchema,
])

type Inquiry = z.infer<typeof inquirySchema>

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function toRow(inquiry: Inquiry) {
  switch (inquiry.type) {
    case 'contact':
      return {
        type: inquiry.type,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || null,
        subject: inquiry.subject,
        message: inquiry.message,
        metadata: {},
      }
    case 'consultation':
      return {
        type: inquiry.type,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        subject: `Consultation: ${inquiry.service}`,
        message: inquiry.message || null,
        metadata: {
          service: inquiry.service,
          date: inquiry.date,
          time: inquiry.time,
        },
      }
    case 'newsletter':
      return {
        type: inquiry.type,
        name: null,
        email: inquiry.email,
        phone: null,
        subject: null,
        message: null,
        metadata: { source: inquiry.source || null },
      }
  }
}

const TYPE_LABELS: Record<Inquiry['type'], string> = {
  contact: 'Contact form message',
  consultation: 'Consultation booking request',
  newsletter: 'Newsletter signup',
}

function buildEmail(row: ReturnType<typeof toRow>) {
  const label = TYPE_LABELS[row.type]
  const fields: [string, unknown][] = [
    ['Name', row.name],
    ['Email', row.email],
    ['Phone', row.phone],
    ['Subject', row.subject],
    ...Object.entries(row.metadata).map(
      ([k, v]) =>
        [k.charAt(0).toUpperCase() + k.slice(1), v] as [string, unknown]
    ),
  ]
  const rows = fields
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`
    )
    .join('')
  const message = row.message
    ? `<h3 style="margin:16px 0 8px;">Message</h3><p style="white-space:pre-wrap;margin:0;">${escapeHtml(row.message)}</p>`
    : ''

  return {
    subject:
      `[heldeelife] ${label}${row.name ? ` from ${row.name}` : ''}`.slice(
        0,
        200
      ),
    html: `<div style="font-family:Arial,sans-serif;color:#222;"><h2 style="margin:0 0 12px;">${escapeHtml(label)}</h2><table style="border-collapse:collapse;">${rows}</table>${message}</div>`,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per 10 minutes per IP
    const ip = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(`inquiries:${ip}`, 5, 600)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            ),
          },
        }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const parsed = inquirySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const row = toRow(parsed.data)

    // Persist to database
    let dbOk = false
    try {
      const { error } = await supabaseAdmin
        .from('customer_inquiries')
        .insert(row)
      if (error) {
        logger.error('Failed to save customer inquiry', error, {
          type: row.type,
        })
      } else {
        dbOk = true
      }
    } catch (error) {
      logger.error('Failed to save customer inquiry', error)
    }

    // Notify support via email (only if Resend is configured)
    let emailOk = false
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.RESEND_FROM_EMAIL || 'noreply@heldeelife.com'
        const to =
          process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@heldeelife.com'
        const { subject, html } = buildEmail(row)
        const { error } = await resend.emails.send({
          from,
          to,
          replyTo: row.email,
          subject,
          html,
        })
        if (error) {
          logger.error('Failed to send inquiry notification email', error, {
            type: row.type,
          })
        } else {
          emailOk = true
        }
      } catch (error) {
        logger.error('Failed to send inquiry notification email', error)
      }
    }

    if (!dbOk && !emailOk) {
      return NextResponse.json(
        {
          error:
            'We could not process your request right now. Please try again later.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error in inquiries route', error)
    return NextResponse.json(
      {
        error:
          'We could not process your request right now. Please try again later.',
      },
      { status: 500 }
    )
  }
}
