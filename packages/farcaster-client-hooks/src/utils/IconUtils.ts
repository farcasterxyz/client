export type LikeIconType =
  | 'default'
  | 'gm'
  | 'ga'
  | 'gn'
  | 'farcaster'
  | 'clanker'
  | 'noggles'
  | 'wowow'
  | 'degen'
  | 'rainbow-wallet';

const GM_PREFIX_REGEX = /^gm\b/;
const GA_PREFIX_REGEX = /^ga\b/;
const GN_PREFIX_REGEX = /^gn\b/;
const NOUN_GLASSES_REGEX = /⌐◨-◨/;
const NOUNS_REGEX = /\bnouns\b/;
const WOWOW_REGEX = /\bwowow\b/;
const RAINBOW_REGEX = /\brainbow\b/;
const RAINBOW_EMOJI_REGEX = /🌈/;
const DEGEN_REGEX = /\$degen\b/;
const CLANKED_REGEX = /\bclanked\b/;
const CLANKING_REGEX = /\bclanking\b/;
const CLANK_CLANK_REGEX = /\bclank\s+clank\b/;
const CLANKER_REGEX = /\bclanker\b/;
const FARCASTER_REGEX = /\bfarcaster\b/;
const URL_REGEX =
  /\b(?:https?:\/\/|farcaster:\/\/|www\.)\S+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/g;

type LikeIconRule = {
  iconType: Exclude<LikeIconType, 'default'>;
  regexes: readonly RegExp[];
};

const LIKE_ICON_RULES: readonly LikeIconRule[] = [
  { iconType: 'gm', regexes: [GM_PREFIX_REGEX] },
  { iconType: 'ga', regexes: [GA_PREFIX_REGEX] },
  { iconType: 'gn', regexes: [GN_PREFIX_REGEX] },
  {
    iconType: 'clanker',
    regexes: [CLANKER_REGEX, CLANKED_REGEX, CLANKING_REGEX, CLANK_CLANK_REGEX],
  },
  { iconType: 'noggles', regexes: [NOUN_GLASSES_REGEX, NOUNS_REGEX] },
  { iconType: 'wowow', regexes: [WOWOW_REGEX] },
  { iconType: 'rainbow-wallet', regexes: [RAINBOW_REGEX, RAINBOW_EMOJI_REGEX] },
  { iconType: 'degen', regexes: [DEGEN_REGEX] },
  { iconType: 'farcaster', regexes: [FARCASTER_REGEX] },
];

const getFirstMatchIndex = (
  message: string,
  regexes: readonly RegExp[],
): number | null => {
  let firstMatchIndex: number | null = null;

  for (const regex of regexes) {
    const matchIndex = message.search(regex);

    if (matchIndex === -1) {
      continue;
    }

    if (matchIndex === 0) {
      return 0;
    }

    if (firstMatchIndex === null || matchIndex < firstMatchIndex) {
      firstMatchIndex = matchIndex;
    }
  }

  return firstMatchIndex;
};

const maskUrls = (message: string): string => {
  return message.replace(URL_REGEX, (url) => ' '.repeat(url.length));
};

const getLikeIconType = (message: string): LikeIconType => {
  const lowerCasedMessage = maskUrls(message.toLowerCase()).trimStart();
  let firstMatchingIconType: LikeIconType = 'default';
  let firstMatchingIconIndex: number | null = null;

  for (const rule of LIKE_ICON_RULES) {
    const matchIndex = getFirstMatchIndex(lowerCasedMessage, rule.regexes);

    if (matchIndex === null) {
      continue;
    }

    if (matchIndex === 0) {
      return rule.iconType;
    }

    if (
      firstMatchingIconIndex === null ||
      matchIndex < firstMatchingIconIndex
    ) {
      firstMatchingIconIndex = matchIndex;
      firstMatchingIconType = rule.iconType;
    }
  }

  return firstMatchingIconType;
};

export { getLikeIconType };
