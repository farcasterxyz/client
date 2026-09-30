import format from 'date-fns/format';
import isThisYear from 'date-fns/isThisYear';

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);

  if (!isThisYear(date)) {
    return format(date, 'h:mm a MMM d, yyyy');
  }

  return format(date, 'h:mm a MMM d');
};

export const formatPrice = (price: number) => {
  if (price >= 10000) {
    return `$${Math.round(price).toLocaleString('en-US')}`;
  }

  if (price >= 1) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // For small numbers, use subscript notation
  const priceStr = price.toFixed(20); // Get enough decimals
  const match = priceStr.match(/^0\.0+/);

  if (match) {
    const leadingZeros = match[0].length - 2; // Subtract "0."
    const remainingDigits = priceStr.slice(match[0].length).slice(0, 4); // Get first 4 significant digits
    const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    const subscript = leadingZeros
      .toString()
      .split('')
      .map((d) => subscripts[parseInt(d)])
      .join('');

    return `$0.0${subscript}${remainingDigits}`;
  }

  return `$${price.toFixed(6)}`;
};
