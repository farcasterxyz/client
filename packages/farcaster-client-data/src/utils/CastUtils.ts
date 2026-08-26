import { CastHashPrefix } from '../types';

const getCastHashPrefix = ({ castHash }: { castHash: string }) =>
  // Use 8 characters (exluding the leading 0x, = 4 bytes) giving us a chance of collision of
  // 1 in over 4 billion. We used to use 6 (= 3 bytes) but a user got a collision and complained.
  castHash.slice(0, 10) as CastHashPrefix;

const getCastURL = ({
  castUsername,
  castHash,
}: {
  castUsername: string | undefined;
  castHash: string;
}) => {
  if (typeof castUsername !== 'undefined') {
    const castHashPrefix = getCastHashPrefix({
      castHash,
    });
    return `https://farcaster.xyz/${castUsername}/${castHashPrefix}`;
  }

  return `https://farcaster.xyz/~/conversations/${castHash}`;
};

const getDeprecatedCastURL = ({
  castUsername,
  castHash,
}: {
  castUsername: string | undefined;
  castHash: string;
}) => {
  if (typeof castUsername !== 'undefined') {
    const castHashPrefix = getCastHashPrefix({
      castHash,
    });
    return `https://warpcast.com/${castUsername}/${castHashPrefix}`;
  }

  return `https://warpcast.com/~/conversations/${castHash}`;
};

export { getCastHashPrefix, getCastURL, getDeprecatedCastURL };
