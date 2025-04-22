/**
 * Format a date string in the local format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('default', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  }).format(date);
}

/**
 * Convert a date to ISO format (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return toISODateString(new Date());
}

/**
 * Checks if a string is a valid date
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
} 