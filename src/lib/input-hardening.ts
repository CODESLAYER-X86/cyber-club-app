/**
 * Input Hardening & Sanitization Utilities
 * Provides strict input cleansing and validation for form fields across the application.
 */

/**
 * Sanitizes phone numbers: only allows digits and an optional leading '+'.
 * Strips all spaces, letters, dashes, parentheses, or special characters.
 * Maximum length 15 characters (E.164 standard).
 */
export function sanitizePhone(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  const result = hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
  return result.slice(0, 16);
}

/**
 * Validates phone format: must be 7 to 15 digits, optional leading '+'.
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  return /^\+?[0-9]{7,15}$/.test(phone.trim());
}

/**
 * Sanitizes Student / Registration IDs:
 * Allows alphanumeric characters, hyphens, dots, underscores, and slashes.
 * Maximum length 25 characters.
 */
export function sanitizeStudentId(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9.\-_/]/g, '').slice(0, 25);
}

/**
 * Sanitizes Roll Numbers:
 * Allows alphanumeric characters and hyphens.
 * Maximum length 15 characters.
 */
export function sanitizeRollNumber(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 15);
}

/**
 * Sanitizes Academic Batch:
 * Allows alphanumeric characters, spaces, and common suffixes (e.g. 62nd, 2024-1).
 * Maximum length 20 characters.
 */
export function sanitizeBatch(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9\s\-_.#]/g, '').slice(0, 20);
}

/**
 * Sanitizes Transaction IDs (bKash, Nagad, Rocket, Bank Ref):
 * Strips all spaces and special symbols, converts to uppercase alphanumeric.
 * Maximum length 30 characters.
 */
export function sanitizeTransactionId(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 30);
}

/**
 * Sanitizes Monetary Amounts:
 * Allows only digits and at most one decimal point.
 */
export function sanitizeAmount(input: string): string {
  if (!input) return '';
  const clean = input.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return clean.slice(0, 10);
}

/**
 * Sanitizes General Text / Names:
 * Strips HTML tags, trims extra whitespace, caps length.
 */
export function sanitizeText(input: string, maxLength: number = 100): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').slice(0, maxLength);
}
