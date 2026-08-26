// Ensure that stringify always returns a string and never undefined.
const safeStringify = (value: unknown) => {
  if (value === undefined) {
    return JSON.stringify(null);
  }

  return JSON.stringify(value);
};

// Ensure that we don't try to parse undefined
const safeParse = (value: string | undefined) => {
  if (value === undefined) {
    return value;
  }

  return JSON.parse(value);
};

const insert = (str: string, index: number, value: string) => {
  return str.substr(0, index) + value + str.substr(index);
};

const splice = (
  text: string,
  start: number,
  end: number,
  replacement: string,
) => {
  return text.slice(0, start) + replacement + text.slice(end);
};

/** Only to be used for specific UX enhancements, please prefer standard CSS text-overflow in general */
const truncateMiddle = (text: string): string => {
  if (text.length > 35) {
    return `${text.substring(0, 20)}...${text.substring(
      text.length - 10,
      text.length,
    )}`;
  }
  return text;
};

const truncateAddress = ({
  hexAddress,
  startSubstring = 4,
}: {
  hexAddress: string;
  startSubstring?: number;
}) => {
  return (
    hexAddress.substring(0, startSubstring) + '…' + hexAddress.substring(38)
  );
};

const truncateURLForFeeds = ({ url }: { url: string }) => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return url;
    }
    const path = (u.pathname === '/' ? '' : u.pathname) + u.search + u.hash;
    if (path.length > 15) {
      return u.host + path.slice(0, 13) + '...';
    }
    return u.host + path;
  } catch (e) {
    return url;
  }
};

export {
  insert,
  safeParse,
  safeStringify,
  splice,
  truncateAddress,
  truncateMiddle,
  truncateURLForFeeds,
};
