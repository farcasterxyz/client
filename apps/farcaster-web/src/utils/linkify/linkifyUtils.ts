// eslint-disable-next-line no-restricted-imports
import Linkify, { type Match as LinkifyMatch } from 'linkify-it';

import { tlds } from '~/utils/linkify/tlds';

const userLinkPrefix = 'farcaster://user/';
const channelLinkPrefix = 'farcaster://channel/';

const BASE_CHAIN_ID = 8453;
const ZORA_CHAIN_ID = 7777777;
const OP_CHAIN_ID = 10;
const ETH_CHAIN_ID = 1;

export const ETH_CHAIN_URI_PREFIX = `chain://eip155:${ETH_CHAIN_ID}/`;
export const BASE_CHAIN_URI_PREFIX = `chain://eip155:${BASE_CHAIN_ID}/`;
export const ZORA_CHAIN_URI_PREFIX = `chain://eip155:${ZORA_CHAIN_ID}/`;
export const OP_CHAIN_URI_PREFIX = `chain://eip155:${OP_CHAIN_ID}/`;

const CAIP_19_PATTERN = /([a-z0-9]+):((?:0x)?[a-fA-F0-9]{1,})(\/(\d+))?$/;

const EVM_PATTERN = /0x[a-fA-F0-9]{40}/;
const SOLANA_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
const SOLANA_CHAR_PATTERN = /[1-9A-HJ-NP-Za-km-z]/;
const SOLANA_SCHEMA = 'solana';

const findSolanaMatches = (
  text: string,
  existingMatches: LinkifyMatch[],
): LinkifyMatch[] => {
  const occupiedRanges = existingMatches.map((match) => ({
    start: match.index,
    end: match.lastIndex,
  }));

  const matches: LinkifyMatch[] = [];
  SOLANA_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SOLANA_PATTERN.exec(text)) !== null) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    const overlapsExistingMatch = occupiedRanges.some(
      ({ start: occupiedStart, end: occupiedEnd }) =>
        start < occupiedEnd && end > occupiedStart,
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

const addSolanaAddressMatching = (instance: Linkify) => {
  const linkifyWithSolanaSupport = instance as Linkify & {
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

const getDefaultLinkifyInstance = () => {
  const instance = new Linkify();
  instance.tlds(tlds, true);

  instance.add('@', {
    validate(text, pos) {
      const tail = text.slice(pos);

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
    normalize(match) {
      match.url = userLinkPrefix + match.url.replace(/^@/, '');
    },
  });

  instance.add('/', {
    validate(text, pos) {
      const tail = text.slice(pos);

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
    normalize(match) {
      match.url = channelLinkPrefix + match.url.replace(/^\//, '');
    },
  });

  instance.add('$', {
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

  instance.add('0x', {
    validate: (textToMatch: string) => {
      const m = textToMatch.match(EVM_PATTERN);
      // Omitting 2 characters for the 0x start for the match
      return m ? m[0].length - 2 : 0;
    },
    normalize: (match) => {
      match.url = `https://farcaster.xyz/~/ca/${match.text}`;
    },
  });

  // Treat `farcaster://` links like regular links. We process them as in-app
  // links below so they don't use the OS URL protocol handler.
  instance.add('farcaster:', {
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

  instance.add(ETH_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  instance.add(BASE_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  instance.add(ZORA_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  instance.add(OP_CHAIN_URI_PREFIX, {
    validate: (textToMatch: string) => {
      const matches = textToMatch.match(CAIP_19_PATTERN);

      return matches !== null && matches.length > 0 && matches[0].length;
    },
  });

  return addSolanaAddressMatching(instance);
};

const mentionRegexString = `^[a-z0-9][a-z0-9-]{0,15}(?:\\.(?:(?:farcaster|base)\\.)?eth)?(?=$|${
  getDefaultLinkifyInstance().re.src_ZPCc
})`;
const mentionRegexForLinkify = new RegExp(`^${mentionRegexString}`);

const channelMentionRegexString = `^[a-z0-9][a-z0-9-]{0,15}(?=$|${
  getDefaultLinkifyInstance().re.src_ZPCc
})`;
const channelMentionRegexForLinkify = new RegExp(
  `^${channelMentionRegexString}`,
);
const cashtagMentionRegexString = `[a-zA-Z][a-zA-Z0-9]{0,32}(?=$|${getDefaultLinkifyInstance().re.src_ZPCc})`;
export const cashtagMentionRegexForLinkify = new RegExp(
  `^${cashtagMentionRegexString}`,
);

const getComposerInstance = () => {
  const instance = new Linkify();
  instance.tlds(tlds, true);

  instance.set({ fuzzyEmail: false, fuzzyLink: true });

  instance.normalize = (match) => {
    if (!match.schema) {
      match.url = 'https://' + match.url;
    }
  };

  instance.add('mailto:', null);

  instance.add('@', {
    validate(text: string, pos: number) {
      const tail = text.slice(pos);

      if (mentionRegexForLinkify.test(tail)) {
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
  });

  instance.add('/', {
    validate(text: string, pos: number) {
      const tail = text.slice(pos);

      if (channelMentionRegexForLinkify.test(tail)) {
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
  });

  instance.add('$', {
    validate: (textToMatch: string, pos: number) => {
      const tail: string = textToMatch.slice(pos);
      const matches = tail.match(cashtagMentionRegexForLinkify);
      return matches?.[0]?.length || false;
    },
  });

  instance.add('0x', {
    validate: (textToMatch: string) => {
      const m = textToMatch.match(EVM_PATTERN);
      return m ? m[0].length - 2 : 0;
    },
    normalize: (match) => {
      match.url = `https://farcaster.xyz/~/ca/${match.text}`;
    },
  });

  const addCaip19Prefix = (prefix: string) => {
    instance.add(prefix, {
      validate: (textToMatch: string) => {
        const matches = textToMatch.match(CAIP_19_PATTERN);
        return matches?.[0]?.length || 0;
      },
    });
  };

  addCaip19Prefix(ETH_CHAIN_URI_PREFIX);
  addCaip19Prefix(BASE_CHAIN_URI_PREFIX);
  addCaip19Prefix(ZORA_CHAIN_URI_PREFIX);
  addCaip19Prefix(OP_CHAIN_URI_PREFIX);

  return addSolanaAddressMatching(instance);
};

const getDirectCastsComposerInstance = () => {
  const instance = new Linkify();
  instance.tlds(tlds, true);

  instance.set({ fuzzyLink: false });
  instance.set({ fuzzyEmail: false });
  instance.add('mailto:', null);
  instance.add('@', null);
  instance.add('/', null);
  instance.add('$', null);

  return instance;
};

export {
  channelLinkPrefix,
  getComposerInstance,
  getDefaultLinkifyInstance,
  getDirectCastsComposerInstance,
  userLinkPrefix,
};
