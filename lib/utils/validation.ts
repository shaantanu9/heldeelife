/**
 * Validation Utilities
 * Input validation schemas and functions
 */

import { z } from 'zod'
import { ApiError } from './api-error'

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      'Invalid phone number (10 digits starting with 6-9)'
    ),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  uuid: z.string().uuid('Invalid UUID format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().min(0, 'Must be non-negative'),
  url: z.string().url('Invalid URL format'),
}

/**
 * Order validation schema
 */
export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: schemas.uuid,
        name: z.string().min(1, 'Product name is required'),
        sku: z.string().optional(),
        quantity: z.number().int().positive('Quantity must be positive'),
        price: schemas.positiveNumber,
      })
    )
    .min(1, 'At least one item is required'),
  shipping_address: z.object({
    name: z.string().min(1, 'Name is required'),
    email: schemas.email,
    phone: schemas.phone,
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: schemas.pincode,
    country: z.string().default('India'),
  }),
  billing_address: z
    .object({
      name: z.string().min(1, 'Name is required'),
      email: schemas.email,
      phone: schemas.phone,
      address: z.string().min(1, 'Address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: schemas.pincode,
      country: z.string().default('India'),
    })
    .optional(),
  payment_method: z
    .enum(['cod', 'online', 'card', 'upi', 'wallet'])
    .default('cod'),
  subtotal: schemas.nonNegativeNumber,
  tax_amount: schemas.nonNegativeNumber.default(0),
  shipping_amount: schemas.nonNegativeNumber.default(0),
  discount_amount: schemas.nonNegativeNumber.default(0),
  notes: z.string().optional(),
})

/**
 * Product validation schema
 */
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: schemas.positiveNumber,
  compare_at_price: schemas.nonNegativeNumber.optional(),
  category_id: schemas.uuid.optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  sku: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
})

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  type: z.enum(['home', 'work', 'other']),
  is_default: z.boolean().default(false),
  name: z.string().min(1, 'Name is required'),
  phone: schemas.phone,
  email: schemas.email.optional(),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: schemas.pincode,
  country: z.string().default('India'),
})

/**
 * Validate data against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', {
        errors,
      })
    }
    throw error
  }
}

/**
 * Safe parse - returns result instead of throwing
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean
  data?: T
  error?: z.ZodError
} {
  const result = schema.safeParse(data)
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error,
  }
}









