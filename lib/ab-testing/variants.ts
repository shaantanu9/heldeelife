/**
 * A/B Testing - Hero Section Headline Variants
 *
 * Each variant uses a distinct psychological trigger to test
 * which messaging drives the highest engagement and conversions.
 */

export type VariantId = 'control' | 'urgency' | 'social-proof' | 'benefit'

export interface HeroVariant {
  id: VariantId
  /** Full headline for logging/analytics */
  headline: string
  /** Split parts for styled rendering (highlight gets orange color) */
  headlineParts: {
    before: string
    highlight: string
    after: string
  }
  /** Psychological trigger applied */
  psychTrigger: 'brand-identity' | 'urgency' | 'social-proof' | 'benefit-framing'
}

export const HERO_VARIANTS: Record<VariantId, HeroVariant> = {
  /** Control — original brand-identity headline */
  control: {
    id: 'control',
    headline: 'Build a healthy Life with Us',
    headlineParts: {
      before: 'Build a ',
      highlight: 'healthy Life',
      after: ' with Us',
    },
    psychTrigger: 'brand-identity',
  },

  /** Urgency — scarcity + time pressure trigger */
  urgency: {
    id: 'urgency',
    headline: 'Start Your Wellness Journey Today — Limited Consultations Available',
    headlineParts: {
      before: 'Start Your Wellness Journey ',
      highlight: 'Today',
      after: ' — Limited Consultations Available',
    },
    psychTrigger: 'urgency',
  },

  /** Social Proof — herd behaviour + trust trigger */
  'social-proof': {
    id: 'social-proof',
    headline: 'Join 50,000+ Customers Living Healthier, Happier Lives',
    headlineParts: {
      before: 'Join ',
      highlight: '50,000+ Customers',
      after: ' Living Healthier, Happier Lives',
    },
    psychTrigger: 'social-proof',
  },

  /** Benefit Framing — outcome + guarantee trigger */
  benefit: {
    id: 'benefit',
    headline: 'Feel Better in 30 Days — Guaranteed with Authentic Ayurveda',
    headlineParts: {
      before: 'Feel Better in ',
      highlight: '30 Days',
      after: ' — Guaranteed',
    },
    psychTrigger: 'benefit-framing',
  },
}

export const VARIANT_IDS: VariantId[] = ['control', 'urgency', 'social-proof', 'benefit']

export const DEFAULT_VARIANT_ID: VariantId = 'control'
