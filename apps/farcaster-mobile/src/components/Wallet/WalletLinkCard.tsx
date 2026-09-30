import { Ionicons } from '@expo/vector-icons';
import { ApiOpenGraphMetadata, ApiWalletLink } from 'farcaster-client-data';
import { AnimatedPressable } from 'farcaster-expo';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { RemoteImage } from '~/components/RemoteImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { buildGoogleFaviconUrl, getDomain } from '~/utils/FaviconUtils';

const CARD_BORDER_RADIUS = 16;
const CARD_OVERLAY_COLOR = '#24292E';
const CARD_OVERLAY_HEIGHT = 60;
const FAVICON_FALLBACK_SIZE = 96;
// Titles the crawler returns when the target site blocks bots. These are
// technically valid OG titles but they surface the CDN's block page, not the
// user-facing product name. Treat as "no title" so the card falls through to
// the DB name / domain instead of showing "Vercel Security Checkpoint" etc.
const BOGUS_CRAWLER_TITLES = [
  'Vercel Security Checkpoint',
  'Just a moment...',
  'Attention Required! | Cloudflare',
  'Access denied',
  'Please Wait... | Cloudflare',
];

const isBogusCrawlerTitle = (title: string | undefined): boolean =>
  !!title && BOGUS_CRAWLER_TITLES.includes(title.trim());

/**
 * Single source of truth for the name text that appears on a wallet-link
 * card. Both `WalletLinkCard` (visual render) and `WalletLinksCarousel`
 * (analytics `name` on `ClickWalletLink`) call this so the analytics
 * event can never disagree with what the user actually saw on-screen —
 * e.g. logging "Vercel Security Checkpoint" for a bot-blocked card that
 * visually displayed the URL domain.
 *
 * Precedence:
 *   1. DB `link.name` — admin-curated, wins outright.
 *   2. `og.title` — client-crawl fallback, unless it matches a known
 *      bot-block CDN title (Vercel Security Checkpoint, Cloudflare "Just
 *      a moment...", etc). Those are stripped and we fall through.
 *   3. `og.domain` — normalized domain from the OG response.
 *   4. `getDomain(link.url)` — URL-derived fallback so the card can
 *      never render text-less.
 */
const resolveWalletLinkDisplayName = (
  link: Pick<ApiWalletLink, 'name' | 'url'>,
  og?: Pick<ApiOpenGraphMetadata, 'title' | 'domain'>,
): string => {
  const ogTitle = isBogusCrawlerTitle(og?.title) ? undefined : og?.title;
  return link.name || ogTitle || og?.domain || getDomain(link.url) || '';
};

type Props = {
  link: ApiWalletLink;
  og?: ApiOpenGraphMetadata;
  width: number;
  height: number;
  onPress: (link: ApiWalletLink) => void;
};

const WalletLinkCard: FC<Props> = memo(
  ({ link, og, width, height, onPress }) => {
    const t = useTheme();

    const handlePress = useCallback(() => {
      onPress(link);
    }, [link, onPress]);

    const linkDomain = useMemo(() => getDomain(link.url), [link.url]);

    // Use `||` (not `??`) so an empty string on link.name/description falls
    // through to the OG fallback. The backend normally omits null fields
    // outright, but if a row is seeded with `''` we still want the enriched
    // title/description to render.
    const displayName = resolveWalletLinkDisplayName(link, og);
    const displayDescription = link.description || og?.description || '';
    // Hero image priority:
    //   1. link.imageUrl — populated at admin write time by the backend
    //      (WalletLinksService.fetchOgForUrl). Zero-latency, works around
    //      bot-protected sites via admin override.
    //   2. og.image — client-side crawl fallback for rows created before
    //      the backend started caching (imageUrl still null in the DB).
    //   3. og.logo — some DeFi sites (Curve, Compound) only expose a brand
    //      mark. Better than the favicon fallback.
    const heroImageUrl = link.imageUrl || og?.image || og?.logo;

    const faviconUri = useMemo(() => {
      // Google's s2 favicon service supports sz up to 256. Ask for 256 so the
      // fallback tile doesn't render as a smudgy 32px icon stretched over 96px.
      return linkDomain ? buildGoogleFaviconUrl(linkDomain, 256) : undefined;
    }, [linkDomain]);

    const heroFallback = useMemo(
      () => (
        <View
          style={[
            t.flex1,
            t.itemsCenter,
            t.justifyCenter,
            { backgroundColor: t.colors.bgDefault },
          ]}
        >
          {faviconUri ? (
            <RemoteImage
              uri={faviconUri}
              width={FAVICON_FALLBACK_SIZE}
              height={FAVICON_FALLBACK_SIZE}
              fallback={
                <Ionicons
                  name="image-outline"
                  size={FAVICON_FALLBACK_SIZE * 0.6}
                  color={t.colors.text.secondary}
                />
              }
            />
          ) : (
            <Ionicons
              name="image-outline"
              size={FAVICON_FALLBACK_SIZE * 0.6}
              color={t.colors.text.secondary}
            />
          )}
        </View>
      ),
      [
        faviconUri,
        t.colors.bgDefault,
        t.colors.text.secondary,
        t.flex1,
        t.itemsCenter,
        t.justifyCenter,
      ],
    );

    return (
      <AnimatedPressable style={[t.flexCol]} onPress={handlePress}>
        <View
          style={[
            t.relative,
            {
              width,
              height,
              overflow: 'hidden',
              borderRadius: CARD_BORDER_RADIUS,
              backgroundColor: t.colors.bgDefault,
            },
          ]}
        >
          {heroImageUrl ? (
            <RemoteImage
              uri={heroImageUrl}
              width={width}
              height={height}
              contentFit="cover"
              contentPosition="center"
              containerStyle={[
                {
                  borderRadius: CARD_BORDER_RADIUS,
                  overflow: 'hidden',
                  backgroundColor: '#111',
                },
              ]}
              fallback={heroFallback}
            />
          ) : (
            heroFallback
          )}

          <View
            style={[
              t.absolute,
              t.bottom0,
              t.wFull,
              {
                height: CARD_OVERLAY_HEIGHT,
                backgroundColor: CARD_OVERLAY_COLOR,
                opacity: 0.8,
              },
            ]}
          />

          <View style={[t.absolute, t.bottom0, t.p3, { width }]}>
            {!!displayName && (
              <Text2
                weight="semibold"
                size="sm"
                numberOfLines={1}
                style={{ color: 'white' }}
              >
                {displayName}
              </Text2>
            )}
            {!!displayDescription && (
              <Text2 size="xs" numberOfLines={1} style={{ color: '#9FA3AF' }}>
                {displayDescription}
              </Text2>
            )}
          </View>
        </View>
      </AnimatedPressable>
    );
  },
);
WalletLinkCard.displayName = 'WalletLinkCard';

export { resolveWalletLinkDisplayName, WalletLinkCard };
