/**
 * Formats large numbers for display (e.g., 1000 -> "1K", 1000000 -> "1M")
 * Score values are limited to 2 decimal places.
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    // For values less than 1000, show 2 decimal places
    return num.toFixed(2);
  }

  const units = ['', 'K', 'M', 'B', 'T', 'Q'];
  let unitIndex = 0;
  let value = num;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  // Format to 2 decimal places
  const formatted = value.toFixed(2);
  return `${formatted}${units[unitIndex]}`;
}

