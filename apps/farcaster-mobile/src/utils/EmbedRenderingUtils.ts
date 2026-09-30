import {
  ApiCastEmbeds,
  ApiCastImageEmbed,
  ApiCastUrlEmbed,
  ApiCastVideoEmbed,
  ApiGroupInviteEmbed,
  ApiOpenGraphMetadata,
  ApiQuoteCastEmbed,
  isDomainOrSubdomain,
  isExactDomain,
} from 'farcaster-client-data';
import {
  buildQuoteCastUrlSet,
  isQuoteCastUrl,
  urlEmbedFromHoistedSnap,
} from 'farcaster-client-hooks';

import { resolveUniversalLink } from '~/utils/DeepLinkUtils';

import { getOpenGraphType } from './UrlUtils';

type RenderableEmbed =
  | { type: 'image'; data: ApiCastImageEmbed }
  | { type: 'video'; data: ApiCastVideoEmbed }
  | { type: 'non-carousel-bunched-og'; data: ApiCastUrlEmbed }
  | { type: 'og'; data: ApiCastUrlEmbed }
  | { type: 'quote'; data: ApiQuoteCastEmbed }
  | { type: 'groupInvite'; data: ApiGroupInviteEmbed }
  | { type: 'unsupported'; source: string };

function shouldRenderRichOpenGraphAttachment(
  og: ApiOpenGraphMetadata,
): boolean {
  if (!og.domain || !og.url) {
    return false;
  }

  // Frame V1 embeds (deprecated)
  if (
    typeof og.frame !== 'undefined' &&
    typeof og.domain !== 'undefined' &&
    typeof og.frameEmbedNext === 'undefined'
  ) {
    return false; // Do not render legacy frames
  }

  // Twitter/X
  if (
    isDomainOrSubdomain(og.domain, 'twitter.com') ||
    isExactDomain(og.domain, 'x.com')
  ) {
    return !!og.description;
  }

  // Warpcast/Farcaster logic
  const isWarpcastDomain =
    isDomainOrSubdomain(og.domain, 'warpcast.com') ||
    isDomainOrSubdomain(og.domain, 'farcaster.xyz');

  if (!isWarpcastDomain) {
    return false;
  }

  const ogType = getOpenGraphType({ domain: og.domain, url: og.url });

  if (ogType === 'token' || ogType === 'news') {
    return true;
  }

  try {
    const parsed = new URL(og.url);
    const resolved = resolveUniversalLink({
      url: parsed.href,
      pathname: parsed.pathname,
      searchParams: parsed.searchParams,
    });

    if (
      !resolved ||
      !(resolved.type === 'navigate' || resolved.type === 'push')
    ) {
      return false;
    }

    return [
      'MutesAndBlocks',
      'MutedKeywords',
      'StarterPacks',
      'ProfilesFromX',
      'StarterPack',
      'ContractAddressTransition',
    ].includes(resolved.name);
  } catch {
    return false;
  }
}

function getRenderableEmbeds({
  embeds,
  castText,
}: {
  embeds?: ApiCastEmbeds;
  castText: string;
}): RenderableEmbed[] {
  if (!embeds) {
    return [];
  }

  const result: RenderableEmbed[] = [];

  const quoteCastUrls = buildQuoteCastUrlSet({ quotes: embeds.casts ?? [] });

  // --- Video embeds
  for (const v of embeds.videos ?? []) {
    result.push({ type: 'video', data: v });
  }

  // --- Image embeds
  for (const i of embeds.images ?? []) {
    result.push({ type: 'image', data: i });
  }

  // --- Quote casts
  for (const quote of embeds.casts ?? []) {
    result.push({ type: 'quote', data: quote });
  }

  // --- Group Invites
  for (const gi of embeds.groupInvites ?? []) {
    result.push({ type: 'groupInvite', data: gi });
  }

  const urls = embeds.urls.filter(
    (urlEmbed) =>
      !isQuoteCastUrl({
        url: urlEmbed.openGraph.url,
        sourceUrl: urlEmbed.openGraph.sourceUrl,
        quoteCastUrls,
      }),
  );

  // --- OG embeds (skip quotes and deprecated)
  for (const urlEmbed of urls) {
    const og = urlEmbed.openGraph;

    if (shouldRenderRichOpenGraphAttachment(og)) {
      result.push({ type: 'non-carousel-bunched-og', data: urlEmbed });
    } else {
      result.push({ type: 'og', data: urlEmbed });
    }
  }

  // --- Hoisted snaps (`embeds.snap[]`) not already represented as legacy
  // `urls[*].openGraph.snap` rows (see NEYN-10204 / NEYN-10425). Always `og`
  // so snap-mode rendering uses `SnapEmbedAttachment`, not rich OG.
  const legacySnapManifestUrls = new Set(
    (embeds.urls ?? [])
      .map((u) => u.openGraph?.snap?.url)
      .filter((u): u is string => typeof u === 'string'),
  );
  for (const hoisted of embeds.snap ?? []) {
    if (!hoisted.url || legacySnapManifestUrls.has(hoisted.url)) {
      continue;
    }
    result.push({ type: 'og', data: urlEmbedFromHoistedSnap(hoisted) });
  }

  // --- Unknowns that are missing from text (as fallbacks)
  for (const unknown of embeds.unknowns ?? []) {
    if (
      unknown.source.startsWith('eip155:') ||
      unknown.source.startsWith('solana:')
    ) {
      continue;
    }
    const source = unknown.source;
    const textMissing =
      !castText.includes(source) &&
      !(source.startsWith('https://') && castText.includes(source.slice(8))) &&
      !(source.startsWith('http://') && castText.includes(source.slice(7)));
    if (textMissing) {
      result.push({ type: 'unsupported', source });
    }
  }

  return result;
}

export { getRenderableEmbeds };
