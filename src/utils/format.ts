/**
 * Canonical currency formatting for the entire app.
 * Uses EUR with Italian locale (comma decimal separator, dot thousands).
 * Examples: €1.234,56 | €0,00 | -€50,00
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency without decimal places (for summary/overview displays).
 * Examples: €1.234 | €0 | -€50
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a numeric amount with 2 decimal places (no currency symbol).
 * For use in table cells where the context already implies currency.
 * Examples: 1.234,56 | 0,00 | -50,00
 */
export function formatAmount(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0,00';
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Format a date consistently across the app.
 * Examples: 25 Feb 2026 | 1 Jan 2025
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
