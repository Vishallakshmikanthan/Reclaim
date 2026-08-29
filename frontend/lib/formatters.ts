/**
 * Formats a value in paise to Indian Rupees string format (e.g. ₹25,00,000)
 */
export function formatPaiseToRupees(paise: number | bigint): string {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Formats a plain rupee amount to Indian Rupees string format
 */
export function formatRupees(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Formats a decimal (0 to 1) as a percentage string (e.g. 70.5%)
 */
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * Formats ISO date to readable string
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
