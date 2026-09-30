import compact from 'lodash/compact';
import millify from 'millify';

const formatNumber = (value: number) => {
  // Ideally, we would just use Number.prototype.toLocaleString() to format numbers.
  // Unfortunately, Intl does not yet ship with Hermes. We could polyfill the functionality,
  // but the packages are pretty heavy. Considering that we don't yet support multiple
  // locales and that our number formatting use cases are very limited, let's just
  // write our own naive solution for now. Hopefully within the next two versions,
  // Intl will be incorporated into React Native, so we won't need any extra dependencies.
  // https://github.com/facebook/hermes/issues/23#issuecomment-1156823548
  const [integer, decimal] = String(value).split('.');
  return compact([integer.replace(/(.)(?=(\d{3})+$)/g, '$1,'), decimal]).join(
    '.',
  );
};

const formatShorthandNumber = (value: number, precision = 0) => {
  return millify(value, {
    lowercase: false,
    precision: value < 10000 ? 1 : precision,
  });
};

const formatViewCount = (viewCount: number) => {
  viewCount = Math.floor(viewCount / 100) * 100;

  if (viewCount < 100) {
    return '<100';
  } else if (viewCount < 1000) {
    return `${formatShorthandNumber(viewCount)}+`;
  } else {
    return `${formatShorthandNumber(viewCount)}`;
  }
};

const formatFollowCount = ({
  followCount,
  formattingCountLimit = 1000,
}: {
  followCount: number;
  formattingCountLimit?: number;
}) => {
  if (followCount < formattingCountLimit) {
    return followCount.toLocaleString().toLocaleUpperCase();
  }

  return formatShorthandNumber(followCount).toLocaleUpperCase();
};

const formatBuyerCount = (value: number) => {
  if (value < 1000) {
    if (value < 10) {
      return `10+`;
    }
    if (value < 100) {
      const rounded = Math.floor(value / 10) * 10;
      return `${rounded}+`;
    }

    const rounded = Math.floor(value / 50) * 50;
    return `${rounded}+`;
  }

  return `${millify(value, { lowercase: false, precision: 1 })}+`;
};

export {
  formatBuyerCount,
  formatFollowCount,
  formatNumber,
  formatShorthandNumber,
  formatViewCount,
};
