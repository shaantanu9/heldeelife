import { supabaseAdmin } from '@/lib/supabase/server'

export type CouponCheck =
  | {
      valid: true
      couponId: string
      code: string
      name: string
      discount: number
    }
  | { valid: false; error: string }

/**
 * Validate a coupon against the real cart using the validate_coupon() SQL
 * function (expiry, minimum spend, usage limits, per-user reuse, product /
 * category applicability). Discount is clamped to the subtotal.
 */
export async function validateCouponForOrder(
  code: string,
  cart: {
    userId: string | null
    subtotal: number
    productIds: string[]
    categoryIds: string[]
  }
): Promise<CouponCheck> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { valid: false, error: 'Invalid coupon code' }

  // validate_coupon takes a single category; pick the coupon's own category
  // when any cart item belongs to it.
  const { data: meta } = await supabaseAdmin
    .from('coupons')
    .select('applicable_category_id, usage_limit, used_count')
    .eq('code', normalized)
    .maybeSingle()

  if (
    meta?.usage_limit != null &&
    (meta.used_count ?? 0) >= meta.usage_limit
  ) {
    return { valid: false, error: 'Coupon usage limit reached' }
  }

  const categoryId =
    meta?.applicable_category_id &&
    cart.categoryIds.includes(meta.applicable_category_id)
      ? meta.applicable_category_id
      : null

  const { data, error } = await supabaseAdmin.rpc('validate_coupon', {
    p_code: normalized,
    p_user_id: cart.userId,
    p_order_amount: cart.subtotal,
    p_product_ids: cart.productIds,
    p_category_id: categoryId,
  })

  if (error || !data) {
    console.error('validate_coupon failed:', error)
    return { valid: false, error: 'Could not validate coupon' }
  }
  if (!data.valid) {
    return { valid: false, error: data.error || 'Invalid coupon code' }
  }

  return {
    valid: true,
    couponId: data.coupon_id,
    code: data.code,
    name: data.name,
    discount: Math.min(Number(data.discount_amount) || 0, cart.subtotal),
  }
}
