// eslint-disable-next-line no-restricted-imports
import Linkify, { type Match as LinkifyMatch } from 'linkify-it';

interface Rule {
  validate: (text: string, pos: number) => number | boolean;
  normalize: (match: LinkifyMatch) => void;
}

class CustomRule implements Rule {
  domainToken: string;

  linkPrefix: string | (({ match }: { match: string }) => string);

  regexForLinkify: RegExp;

  regexForMatchAll: RegExp;

  dotExt: string;

  stripExt: boolean;

  constructor({
    dotExt,
    minCharCount,
    allowedChars,
    preMatch,
    domainToken,
    linkPrefix,
    stripExt,
  }: {
    dotExt: string;
    minCharCount: number;
    allowedChars: string;
    preMatch: string;
    domainToken: string;
    linkPrefix: string | (({ match }: { match: string }) => string);
    stripExt: boolean;
  }) {
    this.domainToken = domainToken;
    this.linkPrefix = linkPrefix;
    // Regex explanation:
    // - It is case-insensitive
    // - (?![\\.\\/][a-z0-9]) is a negative lookahead that prevents creating a link when there is a trailing /x or .x. This does not
    // prevent the link to end with . or / though, so links appear correctly at the end of sentences.
    // - (?=$|${new Linkify().re.src_ZPCc}) is a positive lookahead that ensures what follows is a non-character or the end of the text
    const regex = `${preMatch}[${allowedChars}]{${minCharCount},}\\${dotExt}(?![\\.\\/][a-z0-9])(?=$|${
      new Linkify().re.src_ZPCc
    })`;
    // Regex used by linkify to find links in the content
    this.regexForLinkify = new RegExp(`^${regex}`, 'i');
    // Regex used by us to pre-process the text. Ignore leading @ (don't match usernames) and ensure it's a full domain match (no
    // extra characters before). We don't use a positive lookbehind because it doesn't work reliably.
    this.regexForMatchAll = new RegExp(
      `(^|[^@${allowedChars}])(${regex})`,
      'gi',
    );
    this.dotExt = dotExt;
    this.stripExt = stripExt;
  }

  validate = (text: string, pos: number): number | boolean => {
    const tail = text.slice(pos);

    if (this.regexForLinkify.test(tail)) {
      const matches = tail.match(this.regexForLinkify);

      if (matches && matches.length > 0) {
        return matches[0].length;
      }
    }

    return false;
  };

  normalize = (match: LinkifyMatch): void => {
    let cleanedLink = match.url.replace(new RegExp(`^${this.domainToken}`), '');
    if (this.stripExt) {
      cleanedLink = cleanedLink.replace(this.dotExt, '');
    }

    if (typeof this.linkPrefix === 'function') {
      match.url = this.linkPrefix({ match: cleanedLink });
    } else {
      match.url = this.linkPrefix + cleanedLink;
    }
  };
}

/**
 * Add custom rules here for any dot extension (.xyz) to be swapped.
 * Define a `*CustomRule` above following the existing patterns.
 * `addCustomRules` will have to be called before wherever we start using the linkify object
 * as it is currently a global singleton and it will have to be mutated.
 * Once that is successful, below helpers will be called accordingly to
 * swap and replace the content with clickbable links.
 */
const customRules: CustomRule[] = [];

/**
 * Find and replace all external links with Farcaster specific Linkify prefixes
 * to enable future parsing.
 */
const swapLinksWithCustomRuleTokens = (content: string): string => {
  let output = content;
  customRules.forEach((rule) => {
    const matches = output.matchAll(rule.regexForMatchAll);
    let readCursor = 0;
    let swappedOutput = '';
    for (const match of matches) {
      if (match.index !== undefined) {
        // Group 1 is the pre-match (space or something else), 2 is the actual url
        const matchStartPos = match.index + match[1].length;
        swappedOutput +=
          output.substring(readCursor, matchStartPos) +
          rule.domainToken +
          match[2];
        readCursor = matchStartPos + match[2].length;
      }
    }
    if (readCursor !== output.length) {
      swappedOutput += output.substring(readCursor);
    }
    output = swappedOutput;
  });
  return output;
};

const removeCustomRuleTokens = (content: string): string => {
  let output = content;
  customRules.forEach((rule) => {
    output = output.replaceAll(rule.domainToken, '');
  });
  return output;
};

export { customRules, removeCustomRuleTokens, swapLinksWithCustomRuleTokens };
