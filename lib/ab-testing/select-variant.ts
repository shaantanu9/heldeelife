import {
  VARIANT_IDS,
  HERO_VARIANTS,
  DEFAULT_VARIANT_ID,
  type VariantId,
  type HeroVariant,
} from './variants'

export const AB_COOKIE_NAME = 'hero_variant'
export const AB_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Pick a random variant ID for initial assignment.
 * Called in middleware when no cookie exists.
 */
export function pickRandomVariant(): VariantId {
  const index = Math.floor(Math.random() * VARIANT_IDS.length)
  return VARIANT_IDS[index]
}

/**
 * Resolve the variant config from a raw cookie string.
 * Falls back to the control variant if the value is missing or invalid.
 */
export function getVariantById(variantId: string | undefined): HeroVariant {
  if (variantId && variantId in HERO_VARIANTS) {
    return HERO_VARIANTS[variantId as VariantId]
  }
  return HERO_VARIANTS[DEFAULT_VARIANT_ID]
}
