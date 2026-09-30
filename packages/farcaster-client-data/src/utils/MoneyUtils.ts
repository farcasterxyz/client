export const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const formatDecimal = (decimal: number) => {
  if (decimal === 0) {
    return '$0.00';
  }

  if (decimal < 0.0075) {
    return '< $0.01';
  }

  return usdFormatter.format(decimal);
};

const usdWholeDollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatWholeDollars = (decimal: number) => {
  return usdWholeDollarFormatter.format(decimal);
};

export const formatCents = (cents: number) => formatDecimal(cents / 100);

/**
 * Formats a number of dollars into a string with a dollar sign
 * If it is less than $1, it will be formatted as a decimal
 * If it is less than $10, it will be formatted as a decimal
 * If it is greater than $10, it will be formatted as a whole number
 * @param decimal - The number of dollars to format
 * @returns A string with the formatted number of dollars
 */
export const formatDisplayDollars = (decimal: number) => {
  if (decimal === 0) {
    return '$0.00';
  }
  const isNegative = decimal < 0;

  if (!isNegative && decimal < 0.0075) {
    return '< $0.01';
  }

  if (isNegative && decimal > -0.0075) {
    return '> -$0.01';
  }

  if ((!isNegative && decimal < 10) || (isNegative && decimal > -10)) {
    return usdFormatter.format(decimal);
  }

  return formatWholeDollars(decimal);
};
