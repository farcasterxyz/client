// Threshold above which a raw approval amount is displayed as "All".
//
// Real-world ERC-20 total supplies cap well below 10^30 even after scaling by
// 18 decimals (the largest existing tokens sit in the 10^27 range). Anything
// at or above 10^30 is therefore a sentinel value — most commonly the
// Permit2 uint160 max (≈1.46e48) or a classic ERC-20 uint256 max (≈1.16e77).
// We deliberately keep this well below both sentinels so float-precision
// rounding at extreme magnitudes still triggers the "All" branch reliably.
export const UNLIMITED_ALLOWANCE = 1e30;

/**
 * Format a BigInt with possible scientific notation for large values
 */
const formatBigInt = (
  bigIntValue: bigint,
  decimalPlaces: number,
  magnitudeThreshold: number,
): string => {
  const valueStr = bigIntValue.toString();

  // Use regular format for small BigInts
  if (valueStr.replace('-', '').length <= magnitudeThreshold) {
    return valueStr;
  }

  // For large BigInts, use scientific notation
  const isNegative = bigIntValue < 0n;
  const absStr = isNegative ? valueStr.substring(1) : valueStr;
  const sign = isNegative ? '-' : '';
  const firstDigit = absStr[0];
  const fractionalPart = absStr.slice(1, decimalPlaces + 1);
  const exponent = absStr.length - 1;

  return `${sign}${firstDigit}${fractionalPart.length ? '.' + fractionalPart : ''}e+${exponent}`;
};

/**
 * Format a value (string, number, or bigint) for display, with appropriate handling
 * of different number sizes and decimal precision.
 */
export const formatValue = (
  value: string | number | bigint,
  decimals: number = 4,
  alwaysShowDecimals: boolean = false,
  magnitudeThreshold: number = 3,
): string | undefined => {
  if (decimals < 0) {
    throw new Error('decimals must be a non-negative number');
  }

  const decimalPlaces = Math.floor(decimals);

  // Handle BigInt separately
  if (typeof value === 'bigint') {
    return formatBigInt(value, decimalPlaces, magnitudeThreshold);
  }

  // Convert string to number if needed
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // Handle invalid input
  if (!Number.isFinite(num)) {
    return undefined;
  }

  // Handle zero specially
  if (num === 0) {
    return alwaysShowDecimals ? `0.${'0'.repeat(decimalPlaces)}` : '0';
  }

  const absValue = Math.abs(num);

  // Use scientific notation for very small numbers
  if (absValue > 0 && absValue < 10 ** -magnitudeThreshold) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 7,
    });
  }

  if (absValue >= 10 ** magnitudeThreshold) {
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
    const rawMagnitude = Math.floor(Math.log10(absValue) / 3);
    // Clamp to the last known suffix so astronomically large values (e.g.
    // token allowances approaching uint256) don't render as "1undefined".
    const magnitude = Math.min(rawMagnitude, suffixes.length - 1);
    const scaledValue = absValue / Math.pow(1000, magnitude);
    const suffix = suffixes[magnitude] ?? '';

    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: absValue < 100_0000 ? 2 : 0,
      useGrouping: false,
    };

    const formatted = scaledValue.toLocaleString('en-US', options);
    return `${num < 0 ? '-' : ''}${formatted}${suffix}`;
  }

  // For normal-sized numbers, use locale formatting but with proper decimal handling
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: alwaysShowDecimals ? decimalPlaces : 0,
    maximumFractionDigits: decimalPlaces,
    useGrouping: false, // Don't add thousand separators
  };

  // Format the number using toLocaleString
  let formatted = num.toLocaleString('en-US', options);

  // If not showing decimals, remove trailing zeros and decimal point
  if (!alwaysShowDecimals && formatted.includes('.')) {
    formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
  }

  return formatted;
};
