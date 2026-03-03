import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Resend } from 'resend'
import { authOptions } from '@/lib/auth-options'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)

/** Escape HTML special chars to prevent XSS in email templates */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function buildEmailHtml(cart: {
  id: string
  email: string
  cart_data: Array<{ name: string; price: number; quantity: number; image?: string }>
  total_amount: number
  item_count: number
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heldeelife.com'
  const cartUrl = `${siteUrl}/cart`
  const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(cart.email)}`

  const itemRows = (cart.cart_data || [])
    .map((item) => {
      const name = escapeHtml(item.name)
      const price = escapeHtml((item.price / 100).toFixed(2))
      const qty = escapeHtml(item.quantity)
      // Only use safe, escaped image URL — and only allow http/https schemes
      const rawImg = String(item.image ?? '')
      const imgUrl =
        rawImg.startsWith('http://') || rawImg.startsWith('https://')
          ? escapeHtml(rawImg)
          : ''
      const imgTag = imgUrl
        ? `<img src="${imgUrl}" alt="${name}" width="60" height="60" style="border-radius:4px;object-fit:cover;" />`
        : ''

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
            ${imgTag}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
            <strong>${name}</strong><br />
            <span style="color:#666;font-size:13px;">Qty: ${qty}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:middle;text-align:right;">
            ₹${price}
          </td>
        </tr>`
    })
    .join('')

  const total = escapeHtml((cart.total_amount / 100).toFixed(2))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You left something behind...</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">HeldeeLife</h1>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 40px 20px;text-align:center;">
              <h2 style="margin:0 0 12px;font-size:26px;color:#1a1a2e;">Your cart misses you 💛</h2>
              <p style="margin:0;font-size:16px;color:#555;line-height:1.6;">
                You left ${escapeHtml(cart.item_count)} item${cart.item_count !== 1 ? 's' : ''} behind.
                These products are popular — <strong>we can't guarantee they'll stay in stock.</strong>
              </p>
            </td>
          </tr>

          <!-- Cart Items -->
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
                <tr>
                  <td colspan="2" style="padding:16px 0 0;text-align:right;font-size:15px;color:#333;">
                    <strong>Total</strong>
                  </td>
                  <td style="padding:16px 0 0;text-align:right;font-size:18px;color:#1a1a2e;">
                    <strong>₹${total}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <a href="${escapeHtml(cartUrl)}"
                 style="display:inline-block;background:#e8b86d;color:#1a1a2e;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;font-weight:700;letter-spacing:.5px;">
                Complete Your Order →
              </a>
              <p style="margin:20px 0 0;font-size:13px;color:#888;">
                ⏳ Items in your cart are not reserved — complete your purchase before they sell out.
              </p>
            </td>
          </tr>

          <!-- Footer / CAN-SPAM -->
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0 0 8px;font-size:12px;color:#999;">
                HeldeeLife · India
              </p>
              <p style="margin:0;font-size:12px;color:#bbb;">
                You received this email because you added items to your cart on HeldeeLife.<br />
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#bbb;">Unsubscribe</a> from cart recovery emails.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// POST /api/admin/abandoned-carts/[id]/send-email - Send recovery email (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 20 recovery emails per minute per admin (email sending is expensive)
    const ip = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(`admin-send-email:${session.user.id || ip}`, 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many email requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { id } = await params

    // Get cart
    const { data: cart, error: cartError } = await supabaseAdmin
      .from('abandoned_carts')
      .select('*')
      .eq('id', id)
      .single()

    if (cartError || !cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    // Guard: must have an email address
    if (!cart.email) {
      return NextResponse.json(
        { error: 'No email address for this cart' },
        { status: 400 }
      )
    }

    if (cart.recovered) {
      return NextResponse.json(
        { error: 'Cart already recovered' },
        { status: 400 }
      )
    }

    // CAN-SPAM: skip send if email is opted out
    const { data: optOut } = await supabaseAdmin
      .from('email_unsubscribes')
      .select('email')
      .eq('email', cart.email)
      .maybeSingle()

    if (optOut) {
      return NextResponse.json(
        { success: true, message: 'Email skipped — recipient has unsubscribed', skipped: true },
        { status: 200 }
      )
    }

    // Send recovery email via Resend
    const from =
      process.env.RESEND_FROM_EMAIL || 'noreply@heldeelife.com'

    const { data: emailData, error: emailError } = await resend.emails.send({
      from,
      to: cart.email,
      subject: 'You left something behind... 🛒',
      html: buildEmailHtml(cart),
    })

    if (emailError) {
      console.error('Resend error for cart', id, ':', emailError)
      return NextResponse.json(
        { error: 'Failed to send recovery email', details: emailError },
        { status: 502 }
      )
    }

    // Increment recovery_attempts only after successful send
    const { error: updateError } = await supabaseAdmin
      .from('abandoned_carts')
      .update({
        recovery_attempts: (cart.recovery_attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating recovery attempts:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Recovery email sent',
      attempts: (cart.recovery_attempts || 0) + 1,
      emailId: emailData?.id,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/abandoned-carts/[id]/send-email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
