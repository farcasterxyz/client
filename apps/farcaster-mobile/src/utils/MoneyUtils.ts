import numeral from 'numeral';

type FormatPriceParams = {
  amount: string;
  decimals: number;
  symbol: string;
  maxPrecision?: number;
};

const formatPrice = ({
  amount,
  decimals,
  symbol,
  maxPrecision,
}: FormatPriceParams) => {
  // TODO: If we ever need to do anything more complicated with money (e.g. performign operations,
  // supporting many currencies), we should introduce a library.
  // For now our use case is simple enough that we can do it ourselves.
  // https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/
  const paddedAmount = amount.padStart(decimals, '0');

  // TODO: Replace with Intl.toLocaleString after we upgrade to an Expo version that supports React Native 65
  // https://github.com/facebook/hermes/issues/23
  // https://www.reddit.com/r/reactnative/comments/na6igd/intl_polyfills_for_react_native_063_and_hermes/
  const dollars = numeral(
    parseInt(paddedAmount.slice(0, -decimals) || '0'),
  ).format();

  const cents = paddedAmount
    .slice(-decimals)
    .replace(/0*$/, '')
    .slice(0, maxPrecision || decimals);

  if (symbol === 'ETH') {
    symbol = 'Ξ';
  }

  if (cents.length === 0) {
    return `${dollars} ${symbol}`;
  }

  return `${dollars}.${cents} ${symbol}`;
};

export { formatPrice };
