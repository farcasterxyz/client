import Linkify from 'linkify-it';

const linkify = new Linkify();

// For triggering mention auto-complete, mimic what we do on the backend where Linkify only
// detects mentions when the token is preceeded by white space, control, formatting or punctuation
// character (no alphanumerics, not even emoji)
export const preMentionAutocompleteRegEx = new RegExp(linkify.re.src_ZPCc);

// Used for finding mentions in casts, so we look for full .eth in the username
const mentionRegexString = `[a-z0-9][a-z0-9-]{0,15}(?:\\.(?:(?:farcaster|base)\\.)?eth)?(?=$|${linkify.re.src_ZPCc})`;
export const mentionRegexForLinkify = new RegExp(`^${mentionRegexString}`);
export const mentionRegexForAutocomplete = new RegExp(
  `^@${mentionRegexString}$`,
);

const channelMentionRegexString = `[a-z0-9][a-z0-9-]{0,15}(?=$|${linkify.re.src_ZPCc})`;
export const channelMentionRegexForLinkify = new RegExp(
  `^${channelMentionRegexString}`,
);
export const channelMentionRegexForAutocomplete = new RegExp(
  `^\\/${channelMentionRegexString}$`,
);

const cashtagMentionRegexString = `[a-zA-Z][a-zA-Z0-9]{0,32}(?=$|${linkify.re.src_ZPCc})`;
export const cashtagMentionRegexForLinkify = new RegExp(
  `^${cashtagMentionRegexString}`,
);
export const cashtagMentionRegexForAutocomplete = new RegExp(
  `^\\$${cashtagMentionRegexString}$`,
);

const linkifyWithMentions = new Linkify();

linkifyWithMentions.add('@', {
  validate: function (text, pos) {
    const tail = text.slice(pos);

    if (mentionRegexForLinkify.test(tail)) {
      // Linkifier allows punctuation chars before prefix,
      // but we additionally disable `@` ("@@mention" is invalid)
      if (tail.charAt(0) === '@') {
        return false;
      }

      const matches = tail.match(mentionRegexForLinkify);

      if (matches?.length) {
        return matches[0].length;
      }
    }

    return false;
  },
  normalize: function (match) {
    match.url = match.url.replace(/^@/, '');
  },
});

linkifyWithMentions.add('/', {
  validate: function (text, pos) {
    const tail = text.slice(pos);

    if (channelMentionRegexForLinkify.test(tail)) {
      // Linkifier allows punctuation chars before prefix,
      // but we additionally disable `/` ("//channel" is invalid)
      if (tail.charAt(0) === '/') {
        return false;
      }

      const matches = tail.match(channelMentionRegexForLinkify);

      if (matches?.length) {
        return matches[0].length;
      }
    }

    return false;
  },
  normalize: function (match) {
    match.url = match.url.replace(/^\//, '');
  },
});

export const linkifyWithMentionsMatch = (text: string) => {
  return linkifyWithMentions.match(text || '');
};
