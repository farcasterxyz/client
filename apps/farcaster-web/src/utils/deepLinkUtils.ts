/**
 * Converts the current page URL into a farcaster:// deep link.
 * The mobile app's deep link handler replaces farcaster:// with https://farcaster.xyz/
 * so query params are preserved correctly across all SIWF/connect flows.
 */
const buildFarcasterDeepLink = (): string => {
  const url = new URL(window.location.href);
  const pathWithoutLeadingSlash = url.pathname.startsWith('/')
    ? url.pathname.slice(1)
    : url.pathname;
  return `farcaster://${pathWithoutLeadingSlash}${url.search}`;
};

export { buildFarcasterDeepLink };
