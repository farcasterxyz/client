import { ApiTokenLink, getTokenEmbedUrl } from 'farcaster-client-data';
import {
  BASE_CHAIN_URI_PREFIX,
  CAIP_19_PATTERN,
  ETH_CHAIN_URI_PREFIX,
  OP_CHAIN_URI_PREFIX,
  ZORA_CHAIN_URI_PREFIX,
} from 'farcaster-expo';
import LinkifyIt, { Match } from 'linkify-it';

import {
  castLinkPrefix,
  channelLinkPrefix,
  userLinkPrefix,
} from '~/constants/Link';
import {
  cashtagMentionRegexForLinkify,
  channelMentionRegexForLinkify,
  mentionRegexForLinkify,
} from '~/constants/Regex';

const tlds = [
  'com',
  'net',
  'org',
  'io',
  'xyz',
  'app',
  'cash',
  'finance',
  'news',
  'tech',
  'dev',
  'gg',
  'ai',
  'co',
  'me',
  'studio',
  'fi',
  'fun',
  'systems',
  'build',
  'market',
  'fyi',
  'so',
];

const EVM_PATTERN = /0x[a-fA-F0-9]{40}/;
const SOLANA_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
const SOLANA_CHAR_PATTERN = /[1-9A-HJ-NP-Za-km-z]/;
const SOLANA_SCHEMA = 'solana';

const findSolanaMatches = (text: string, existingMatches: Match[]): Match[] => {
  const occupiedRanges = existingMatches.map((match) => ({
    start: match.index,
    end: match.lastIndex,
  }));

  const matches: Match[] = [];
  SOLANA_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SOLANA_PATTERN.exec(text)) !== null) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    const overlapsExistingMatch = occupiedRanges.some(
      ({ start: occupiedStart, end: occupiedEnd }) => {
        return start < occupiedEnd && end > occupiedStart;
      },
    );

    if (overlapsExistingMatch) {
      continue;
    }

    const prevChar = text[start - 1];
    const nextChar = text[end];

    if (
      (typeof prevChar === 'string' && SOLANA_CHAR_PATTERN.test(prevChar)) ||
      (typeof nextChar === 'string' && SOLANA_CHAR_PATTERN.test(nextChar))
    ) {
      continue;
    }

    matches.push({
      schema: SOLANA_SCHEMA,
      index: start,
      lastIndex: end,
      raw: match[0],
      text: match[0],
      url: `https://farcaster.xyz/~/ca/${match[0]}`,
    });
  }

  return matches;
};

const addSolanaAddressMatching = (instance: LinkifyIt) => {
  const linkifyWithSolanaSupport = instance as LinkifyIt & {
    __solanaPatched?: boolean;
  };

  if (linkifyWithSolanaSupport.__solanaPatched) {
    return instance;
  }

  const originalMatch = instance.match.bind(instance);

  linkifyWithSolanaSupport.match = (text: string) => {
    const baseMatches = originalMatch(text) || [];
    const solanaMatches = findSolanaMatches(text, baseMatches);

    if (solanaMatches.length === 0) {
      return baseMatches.length > 0 ? baseMatches : null;
    }

    const combinedMatches = [...baseMatches, ...solanaMatches].sort(
      (a, b) => a.index - b.index,
    );

    return combinedMatches;
  };

  linkifyWithSolanaSupport.__solanaPatched = true;

  return instance;
};

let linkify: LinkifyIt | undefined = undefined;

export type LinkifyInstanceType = LinkifyIt;

export function getLinkify() {
  if (typeof linkify !== 'undefined') {
    return linkify;
  }

  linkify = new LinkifyIt();
  linkify.tlds(tlds, false);

  linkify.add('@', {
    validate: function (text, pos) {
      const tail: string = text.slice(pos);

      if (mentionRegexForLinkify.test(tail)) {
        // Linkifier allows punctuation chars before prefix,
        // but we additionally disable `@` ("@@mention" is invalid)
        if (tail.charAt(0) === '@') {
          return false;
        }

        const matches = tail.match(mentionRegexForLinkify);

        if (matches && matches.length > 0) {
          return matches[0].length;
        }
      }

      return false;
    },
    normalize: function (match) {
      match.url = userLinkPrefix + match.url.replace(/^@/, '');
    },
  });

  linkify.add('/', {
    validate: function (text, pos) {
      const tail: string = text.slice(pos);

      if (channelMentionRegexForLinkify.test(tail)) {
        // Linkifier allows punctuation chars before prefix,
        // but we additionally disable `/` ("//channel" is invalid)
        if (tail.charAt(0) === '/') {
          return false;
        }

        const matches = tail.match(channelMentionRegexForLinkify);

        if (matches && matches.length > 0) {
          return matches[0].length;
        }
      }

      return false;
    },
    normalize: function (match) {
      match.url = channelLinkPrefix + match.url.replace(/^\//, '');
    },
  });

  // Treat `farcaster://` links like regular links. We process them as in-app
  // links below so they don't use the OS URL protocol handler.
  linkify.add('farcaster:', {
    validate: (text, pos) => {
      const tail = text.slice(pos);
      const matches = tail.match(/\/\/casts\/([A-Za-z0-9]+)\/([A-Za-z0-9]+)/i);
      if (matches && matches.length > 0) {
        const match = matches[0];
        return match.length;
      }
      return false;
    },
  });

  linkify.set({ fuzzyEmail: false, fuzzyLink: true });

  linkify.normalize = (match) => {
    if (!match.schema) {
      match.url = 'https://' + match.url;
    }
  };

  linkify.add(ETH_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  linkify.add(BASE_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  linkify.add(ZORA_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  linkify.add(OP_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  linkify.add('$', {
    validate: (textToMatch: string, pos: number) => {
      const tail: string = textToMatch.slice(pos);

      if (cashtagMentionRegexForLinkify.test(tail)) {
        const matches = tail.match(cashtagMentionRegexForLinkify);

        if (matches && matches.length > 0) {
          return matches[0].length;
        }
      }

      return false;
    },
    normalize(match) {
      const matchedURLRef = match.url;
      match.url = `https://farcaster.xyz/~/token/${matchedURLRef.replace(/^\$/, '')}`;
    },
  });

  linkify.add('0x', {
    validate: (textToMatch: string) => {
      const m = textToMatch.match(EVM_PATTERN);
      // Omitting 2 characters for the 0x start for the match
      return m ? m[0].length - 2 : 0;
    },
    normalize: (match) => {
      match.url = `https://farcaster.xyz/~/ca/${match.text}`;
    },
  });

  return addSolanaAddressMatching(linkify);
}

const matchUrls = ({
  text,
  tokenMentions,
  shouldMatchFirstToken,
}: {
  text: string;
  tokenMentions: ApiTokenLink[];
  shouldMatchFirstToken: boolean;
}): { urls: string[]; ticker: string | undefined } => {
  const urls: string[] = [];
  let ticker: string | undefined = undefined;

  const cashtagHasValidTerminator = (match: {
    index?: number;
    text: string;
  }) => {
    if (!match.text.startsWith('$')) {
      return false;
    }

    let matchIndex = match.index;

    if (typeof matchIndex !== 'number') {
      matchIndex = text.indexOf(match.text);

      if (matchIndex === -1) {
        return false;
      }
    }

    const nextChar = text.charAt(matchIndex + match.text.length);

    if (!nextChar) {
      return false;
    }

    return nextChar === '.' || /\s/.test(nextChar);
  };

  const l = getLinkify();

  const matches = l.match(text);

  if (matches) {
    matches
      .filter((m) => {
        if (
          m.url.startsWith(userLinkPrefix) ||
          m.url.startsWith(castLinkPrefix) ||
          m.url.startsWith(channelLinkPrefix)
        ) {
          return false;
        }

        const startsWithCashtag = m.text.startsWith('$');
        const hasValidTerminator = startsWithCashtag
          ? cashtagHasValidTerminator(m)
          : false;

        if (startsWithCashtag && !hasValidTerminator) {
          return false;
        }

        if (startsWithCashtag && shouldMatchFirstToken) {
          return true;
        }

        if (typeof tokenMentions !== 'undefined' && tokenMentions.length > 0) {
          return (
            startsWithCashtag &&
            tokenMentions.findIndex(({ ticker }) => {
              return m.text
                .toLowerCase()
                .startsWith(`$${ticker.toLowerCase()}`);
            }) !== -1
          );
        }

        return !startsWithCashtag;
      })
      .forEach((m) => {
        const startsWithCashtag = m.text.startsWith('$');
        const hasValidTerminator = startsWithCashtag
          ? cashtagHasValidTerminator(m)
          : false;

        if (startsWithCashtag && shouldMatchFirstToken) {
          if (!hasValidTerminator) {
            return;
          }

          if (typeof ticker === 'undefined') {
            ticker = m.text.toLowerCase().split('$')[1];
          }
          return;
        }

        if (
          !shouldMatchFirstToken &&
          typeof tokenMentions !== 'undefined' &&
          tokenMentions.length > 0 &&
          startsWithCashtag
        ) {
          if (!hasValidTerminator) {
            return;
          }

          const tokenLink = tokenMentions.find(({ ticker }) =>
            m.text.toLowerCase().startsWith(`$${ticker.toLowerCase()}`),
          );

          if (typeof tokenLink === 'undefined' || tokenLink === null) {
            urls.push(m.url);
          } else {
            urls.push(getTokenEmbedUrl(tokenLink));
          }
        } else {
          urls.push(m.url);
        }
      });
  }

  return { urls, ticker };
};

export { linkify, matchUrls, tlds };
