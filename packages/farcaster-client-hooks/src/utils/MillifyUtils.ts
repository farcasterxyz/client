/**
 * Options used to configure Millify.
 */
export interface MillifyOptions {
  /**
   * The number of significant figures.
   */
  precision: number;
  /**
   * The active browser or server location. A string with a BCP 47 language
   * tag, or an array of such strings, e.g. "en-US".
   */
  locales?: string | string[];
  /**
   * Convert units to lower case.
   */
  lowercase: boolean;
  /**
   * Add a space between the number and the unit.
   */
  space: boolean;
  /**
   * A list of units to use.
   */
  units: string[];
}

/**
 * Default options for Millify.
 */
export const defaultOptions: MillifyOptions = {
  lowercase: false,
  precision: 1,
  space: false,
  units: [
    '',
    'K', // Thousand
    'M', // Million
    'B', // Billion
    'T', // Trillion
    'P', // Quadrillion
    'E', // Quintillion
  ],
};

/**
 * parseValue ensures the value is a number and within accepted range.
 */
export function parseValue(value: number): number {
  'worklet';
  const val: number = parseFloat(value?.toString());

  if (isNaN(val)) {
    throw new Error(`Input value is not a number`);
  }
  if (val > Number.MAX_SAFE_INTEGER || val < Number.MIN_SAFE_INTEGER) {
    throw new RangeError('Input value is outside of safe integer range');
  }
  return val;
}

/**
 * Rounds a number [value] up to a specified [precision].
 */
export function roundTo(value: number, precision: number): number {
  'worklet';
  if (!Number.isFinite(value)) {
    throw new Error('Input value is not a finite number');
  }
  if (!Number.isInteger(precision) || precision < 0) {
    throw new Error('Precision is not a positive integer');
  }
  if (Number.isInteger(value)) {
    return value;
  }
  return parseFloat(value.toFixed(precision));
}

/**
 * Returns the number of digits after the decimal.
 */
export function getFractionDigits(num: number): number {
  'worklet';
  if (Number.isInteger(num)) {
    return 0;
  }
  const decimalPart = num.toString().split('.')[1];
  return decimalPart?.length ?? 0;
}

/**
 * Returns the default browser locales.
 */
export function getLocales(): string[] {
  'worklet';
  if (typeof navigator === 'undefined') {
    return [];
  }
  return Array.from(navigator.languages ?? []);
}

// Most commonly used digit grouping base.
const DIGIT_GROUPING_BASE = 1000;

/**
 * Generator that divides a number until a decimal value is found.
 *
 * The denominator is defined by the numerical digit grouping base,
 * or interval. The most commonly-used digit group interval is 1000.
 *
 * e.g. 1,000,000 is grouped in multiples of 1000.
 */
function* divider(value: number): IterableIterator<number> {
  'worklet';
  // Create a mutable copy of the base.
  let denominator = DIGIT_GROUPING_BASE;

  while (true) {
    const result = value / denominator;
    if (result < 1) {
      // End of operation. We can't divide the value any further.
      return;
    }

    yield result;

    // The denominator is increased every iteration by multiplying
    // the base by itself, until a decimal value remains.
    denominator *= DIGIT_GROUPING_BASE;
  }
}

/**
 * millify converts long numbers to human-readable strings.
 */
function millify(value: number, options?: Partial<MillifyOptions>): string {
  'worklet';
  // Override default options with options supplied by user.
  const opts: MillifyOptions = options
    ? { ...defaultOptions, ...options }
    : defaultOptions;

  if (!Array.isArray(opts.units) || !opts.units.length) {
    throw new Error('Option `units` must be a non-empty array');
  }

  // If the input value is invalid, then return the value in string form.
  // Originally this threw an error, but was changed to return a graceful fallback.
  let val: number;
  try {
    val = parseValue(value);
  } catch (e) {
    // Invalid values will be converted to string as per `String()`.
    return String(value);
  }

  // Add a minus sign (-) prefix if it's a negative number.
  const prefix = val < 0 ? '-' : '';

  // Work only with positive values for simplicity's sake.
  val = Math.abs(val);

  // Keep dividing the input value by the digit grouping base
  // until the decimal and the unit index is deciphered.
  let unitIndex = 0;
  for (const result of divider(val)) {
    val = result;
    unitIndex += 1;
  }

  // Return the original number if the number is too large to have
  // a corresponding unit. Returning anything else is ambiguous.
  const unitIndexOutOfRange = unitIndex >= opts.units.length;
  if (unitIndexOutOfRange) {
    // At this point we don't know what to do with the input value,
    // so we return it as is, without localizing the string.
    return value.toString();
  }

  // Round decimal up to desired precision.
  let rounded = roundTo(val, opts.precision);

  // Fixes an edge case bug that outputs certain numbers as 1000K instead of 1M.
  // The rounded value needs another iteration in the divider cycle.
  for (const result of divider(rounded)) {
    rounded = result;
    unitIndex += 1;
  }

  // Calculate the unit suffix and make it lowercase (if needed).
  const unit = opts.units[unitIndex] ?? '';
  const suffix = opts.lowercase ? unit.toLowerCase() : unit;

  // Add a space between number and abbreviation.
  const space = opts.space ? ' ' : '';

  // Format the number according to the desired locale.
  const formatted = rounded.toLocaleString(opts.locales ?? getLocales(), {
    // toLocaleString needs the explicit fraction digits.
    minimumFractionDigits: getFractionDigits(rounded),
  });

  return `${prefix}${formatted}${space}${suffix}`;
}

export const formatShorthandNumberWorklet = (value: number, precision = 0) => {
  'worklet';
  return millify(value, {
    lowercase: false,
    precision: value < 10000 ? 1 : precision,
  });
};
