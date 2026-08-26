import { CastHashPrefix } from 'farcaster-client-data';

/** Full cast hash: 0x + 40 hex digits (42 chars). Farcaster cast hashes are 20 bytes. */
const FULL_CAST_HASH_RE = /^0x[a-fA-F0-9]{40}$/i;

/**
 * Short cast hash prefix: 0x + 8–39 hex digits (not a full 40-digit hash).
 * Matches public cast URLs like https://farcaster.xyz/{user}/0x61539040
 */
const SHORT_CAST_HASH_PREFIX_RE = /^0x[a-fA-F0-9]{8,39}$/i;

/**
 * Accepts Farcaster username path segments in cast URLs.
 * We intentionally allow dots so ENS-style handles like "alice.eth" parse.
 */
const USERNAME_SEGMENT_RE = /^[a-z0-9][a-z0-9.-]{0,63}$/i;

export type ParsedCastUrl =
  | {
      kind: 'username-and-hash';
      username: string;
      /** Lowercase 0x-prefixed hex; may be short (8–39 hex after 0x) or full (40 hex). */
      hashSegment: string;
    }
  | {
      kind: 'conversation-hash';
      /** Lowercase 0x-prefixed hex; may be short or full. */
      hashSegment: string;
    }
  | { kind: 'not-cast-url' };

function normalizeHashSegment(segment: string): string {
  return segment.toLowerCase();
}

/** Hosts whose `/{username}/{hash}` and `/~/conversations/{hash}` paths are cast pages. */
function isCastPageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'farcaster.xyz' || host === 'warpcast.com') {
    return true;
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return true;
  }
  if (host.endsWith('.farcaster.xyz')) {
    return true;
  }
  return false;
}

/**
 * Parses Farcaster / Warpcast cast page URLs into username + hash or conversation hash.
 * Does not validate the hash length beyond distinguishing short vs full for resolution.
 */
function parseCastUrl(rawUrl: string): ParsedCastUrl {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { kind: 'not-cast-url' };
  }

  if (!isCastPageHost(url.hostname)) {
    return { kind: 'not-cast-url' };
  }

  const path = url.pathname.replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  // /~/conversations/{hash}
  if (
    segments.length === 3 &&
    segments[0] === '~' &&
    segments[1] === 'conversations'
  ) {
    const hashSegment = normalizeHashSegment(segments[2]);
    if (
      FULL_CAST_HASH_RE.test(hashSegment) ||
      SHORT_CAST_HASH_PREFIX_RE.test(hashSegment)
    ) {
      return { kind: 'conversation-hash', hashSegment };
    }
    return { kind: 'not-cast-url' };
  }

  // /{username}/{hash}
  if (segments.length === 2) {
    const [username, hashSeg] = segments;
    if (!USERNAME_SEGMENT_RE.test(username)) {
      return { kind: 'not-cast-url' };
    }
    const hashSegment = normalizeHashSegment(hashSeg);
    if (
      FULL_CAST_HASH_RE.test(hashSegment) ||
      SHORT_CAST_HASH_PREFIX_RE.test(hashSegment)
    ) {
      return {
        kind: 'username-and-hash',
        username: username.toLowerCase(),
        hashSegment,
      };
    }
  }

  return { kind: 'not-cast-url' };
}

function isFullCastHash(hashSegment: string): boolean {
  return FULL_CAST_HASH_RE.test(hashSegment);
}

function isCastEmbedReference(value: string): boolean {
  const trimmed = value.trim();
  return (
    FULL_CAST_HASH_RE.test(trimmed) ||
    SHORT_CAST_HASH_PREFIX_RE.test(trimmed) ||
    parseCastUrl(trimmed).kind !== 'not-cast-url'
  );
}

function toHashPrefix(hashSegment: string): CastHashPrefix {
  return hashSegment.slice(0, 10) as CastHashPrefix;
}

export {
  FULL_CAST_HASH_RE,
  isCastEmbedReference,
  isCastPageHost,
  isFullCastHash,
  parseCastUrl,
  SHORT_CAST_HASH_PREFIX_RE,
  toHashPrefix,
};
