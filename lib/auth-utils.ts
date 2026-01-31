/**
 * Authentication utility functions
 * Handles phone number to email conversion for heldeelife.com domain
 */

/**
 * Checks if a string is a phone number (contains only digits, spaces, dashes, parentheses, or +)
 */
export function isPhoneNumber(input: string): boolean {
  // Remove common phone number characters and check if remaining are digits
  const cleaned = input.replace(/[\s\-\(\)\+]/g, '')
  // Check if it's all digits and has reasonable length (7-15 digits)
  return /^\d{7,15}$/.test(cleaned)
}

/**
 * Normalizes phone number by removing spaces, dashes, parentheses, and + sign
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '')
}

/**
 * Converts phone number or email to email format
 * If it's a phone number, appends @heldeelife.com
 * If it's already an email, returns as is
 */
export function toEmailFormat(input: string): string {
  const trimmed = input.trim()

  if (isPhoneNumber(trimmed)) {
    const normalized = normalizePhoneNumber(trimmed)
    return `${normalized}@heldeelife.com`
  }

  // If it's already an email, return as is
  if (trimmed.includes('@')) {
    return trimmed
  }

  // Default: treat as phone number if no @ found
  const normalized = normalizePhoneNumber(trimmed)
  return `${normalized}@heldeelife.com`
}

/**
 * Extracts phone number from email format
 * Returns null if it's not a heldeelife.com email
 */
export function extractPhoneFromEmail(email: string): string | null {
  if (email.endsWith('@heldeelife.com')) {
    return email.replace('@heldeelife.com', '')
  }
  return null
}

/**
 * Validates if input is a valid phone number or email
 */
export function isValidInput(input: string): boolean {
  const trimmed = input.trim()

  if (isPhoneNumber(trimmed)) {
    return true
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(trimmed)
}









