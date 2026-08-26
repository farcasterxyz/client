import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOpenGraphMetadata, ApiWalletLink } from 'farcaster-client-data';
import {
  requestedUrlMatchesUrlEmbed,
  useCastAttachmentPreviewCache,
  useFetchCastAttachment,
  useTrackEvent,
  useWalletLinks,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  getSeenWalletLinkIds,
  isWalletLinksCollapsed,
  setSeenWalletLinkIds,
  setWalletLinksCollapsed,
} from 'farcaster-expo';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { Text2 } from '~/components/Text';
import { useMinimizedInAppBrowser } from '~/contexts/MinimizedInAppBrowserProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useIsWalletLinksEnabled } from '~/hooks/useIsWalletLinksEnabled';

import { resolveWalletLinkDisplayName, WalletLinkCard } from './WalletLinkCard';

const CARD_ASPECT_RATIO = 1.91;
// Approximate rendered height of the "Explore" heading (Text2 size="lg").
// Used to reserve carousel space while the query resolves, so the wallet
// header height doesn't jump when data arrives (which would shift Pulse /
// Collectibles / Tokens scroll positions).
const HEADING_APPROX_HEIGHT = 24;
// Matches the ScrollView contentContainerStyle paddingHorizontal below —
// the x-offset of the first card's left edge in content coordinates.
const CONTENT_PADDING_X = 12;
// A card counts as "seen" once this fraction of its width is in the viewport.
// Cards are ~full-width, so only ~1 shows at a time.
const CARD_VISIBILITY_RATIO = 0.5;

const WalletLinksCarousel: FC = () => {
  const t = useTheme();
  const enabled = useIsWalletLinksEnabled();
  const { trackEvent } = useTrackEvent();
  const { setOpenInAppBrowser } = useMinimizedInAppBrowser();

  const { data, isPending } = useWalletLinks({ enabled });

  // Randomize links within sort order groups
  const links = useMemo(() => {
    const raw = data?.result?.links;
    if (!Array.isArray(raw) || raw.length === 0) return [];

    // Group by sortOrder
    const grouped = raw.reduce<Record<number, ApiWalletLink[]>>((acc, link) => {
      const order = link.sortOrder ?? 0;
      if (!acc[order]) acc[order] = [];
      acc[order].push(link);
      return acc;
    }, {});

    // Randomize within each group and flatten
    const result: ApiWalletLink[] = [];
    Object.keys(grouped)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((key) => {
        const group = grouped[Number(key)];
        // Fisher-Yates shuffle
        for (let i = group.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [group[i], group[j]] = [group[j], group[i]];
        }
        result.push(...group);
      });

    return result;
  }, [data]);

  const hasLinks = links.length > 0;

  // Collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() =>
    isWalletLinksCollapsed(),
  );

  const toggleCollapsed = useCallback(() => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    setWalletLinksCollapsed({ collapsed: newValue });
    trackEvent(AnalyticsEvent.ClickWalletLink, {
      action: newValue ? 'collapse' : 'expand',
    });
  }, [isCollapsed, trackEvent]);

  // Track seen link IDs and determine if there are new links
  const [seenLinkIds, setSeenLinkIds] = useState<Set<string>>(() => {
    return new Set(getSeenWalletLinkIds());
  });

  const hasNewLinks = useMemo(() => {
    return links.some((link) => !seenLinkIds.has(link.id));
  }, [links, seenLinkIds]);

  // Mark links as seen when they're viewed (expanded)
  useEffect(() => {
    if (!enabled || !hasLinks || isCollapsed) return;

    const currentIds = links.map((l) => l.id);
    const updated = new Set([...seenLinkIds, ...currentIds]);

    if (updated.size !== seenLinkIds.size) {
      setSeenLinkIds(updated);
      setSeenWalletLinkIds({ ids: Array.from(updated) });
    }
  }, [enabled, hasLinks, links, isCollapsed, seenLinkIds]);

  const { width: screenWidth } = Dimensions.get('window');
  const cardHeight = useMemo(
    () => Math.ceil((screenWidth - sizes.s3 * 6) / CARD_ASPECT_RATIO),
    [screenWidth],
  );
  const cardWidth = useMemo(
    () => Math.ceil(cardHeight * CARD_ASPECT_RATIO),
    [cardHeight],
  );

  const fetchCastAttachment = useFetchCastAttachment();
  const checkCastAttachmentPreviewCache = useCastAttachmentPreviewCache();
  const [ogByUrl, setOgByUrl] = useState<Record<string, ApiOpenGraphMetadata>>(
    {},
  );
  // URLs whose client OG crawl has settled (resolved/cache-hit/no-match/fail).
  // Gates per-card impressions until the display name is final (see below).
  const [ogSettledUrls, setOgSettledUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Skip OG enrichment when the feature flag is off — react-query can
    // still expose cached rows from a prior session, but the carousel is
    // rendering null so there's no reason to hit processCastAttachments.
    if (!enabled || !hasLinks) return;
    // Rows the backend has already enriched (`link.imageUrl` populated by
    // WalletLinksService.fetchOgForUrl at admin write time) don't need a
    // client-side crawl. Older rows (created before the backend cache
    // shipped, or rows the admin hasn't re-crawled yet via `refetchOg`)
    // still fall back to the client-side path so we don't regress their
    // hero image between the backend deploy and the admin backfill.
    const urls = links.filter((l) => !l.imageUrl).map((l) => l.url);
    if (urls.length === 0) return;

    const cachedEntries: Record<string, ApiOpenGraphMetadata> = {};
    const missing: string[] = [];
    for (const url of urls) {
      const hit = checkCastAttachmentPreviewCache({ previewUrl: url });
      if (hit?.openGraph) {
        cachedEntries[url] = hit.openGraph;
      } else {
        missing.push(url);
      }
    }
    const cachedUrls = Object.keys(cachedEntries);
    if (cachedUrls.length > 0) {
      setOgByUrl((prev) => ({ ...prev, ...cachedEntries }));
      setOgSettledUrls((prev) => {
        const next = new Set(prev);
        cachedUrls.forEach((url) => next.add(url));
        return next;
      });
    }
    if (missing.length === 0) return;

    let cancelled = false;
    const markOgSettled = (settledUrl: string) =>
      setOgSettledUrls((prev) => {
        if (prev.has(settledUrl)) return prev;
        const next = new Set(prev);
        next.add(settledUrl);
        return next;
      });
    // Fetch each URL independently rather than in one batch. The
    // processCastAttachments endpoint crawls URLs live server-side, and a
    // single slow / bot-protected URL (e.g. Vercel/Cloudflare-guarded sites)
    // used to stall the whole batch past the 10s client timeout and drop OG
    // for every card. Per-URL fetches keep the working URLs working even
    // when one target is broken.
    missing.forEach((requestedUrl) => {
      (async () => {
        try {
          const result = await fetchCastAttachment({ embeds: [requestedUrl] });
          if (cancelled) return;
          const returnedEmbeds =
            result?.responseData?.result?.embeds?.urls ?? [];
          // The crawler may return an embed whose canonical `openGraph.url`
          // differs from the requested URL (redirects, trailing-slash
          // canonicalization). Use the codebase's canonical matcher, and
          // fall back to the first returned embed if there's only one — some
          // sites (e.g. Cloudflare-guarded pages) crawl but the canonical URL
          // it echoes back has extra path segments that fail strict match.
          const match =
            returnedEmbeds.find((embed) =>
              requestedUrlMatchesUrlEmbed(requestedUrl, embed),
            ) ?? (returnedEmbeds.length === 1 ? returnedEmbeds[0] : undefined);
          if (match?.openGraph) {
            setOgByUrl((prev) => ({
              ...prev,
              [requestedUrl]: match.openGraph,
            }));
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `[WalletLinksCarousel] no OG match for ${requestedUrl}`,
              { returnedCount: returnedEmbeds.length },
            );
          }
          markOgSettled(requestedUrl);
        } catch (err) {
          // OG enrichment is best-effort — the card falls back to favicon +
          // domain. Log unconditionally (visible in on-device Xcode / logcat)
          // so we can see WHY the fetch failed (auth, timeout, 5xx) rather
          // than silently swallowing while every card falls back to favicon.
          // eslint-disable-next-line no-console
          console.warn(
            `[WalletLinksCarousel] OG fetch failed for ${requestedUrl}`,
            err,
          );
          if (!cancelled) markOgSettled(requestedUrl);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    links,
    hasLinks,
    fetchCastAttachment,
    checkCastAttachmentPreviewCache,
  ]);

  // Impression fires at most once per wallet-screen focus, and only while
  // the screen is actually focused. Tracks focus in state (not a ref) so the
  // tracking effect re-runs on focus/blur, and gates firing on `isFocused`
  // so a background query resolve on an unfocused wallet doesn't emit.
  // Reset happens on blur (not on focus) to avoid a duplicate-fire race
  // when cached data is available on mount.
  const [isFocused, setIsFocused] = useState(false);
  const impressionFiredRef = useRef(false);
  // Per-card impressions: ids we've already logged a `ViewWalletLinkCard` for
  // this focus. Cleared on blur so re-entering the wallet re-counts.
  const cardImpressionsFiredRef = useRef<Set<string>>(new Set());
  // Mirrors `isFocused` but updated synchronously on blur, so a late momentum
  // scroll event can't fire an impression (or repopulate the fired set) after
  // the blur cleanup ran — `handleScroll` reads a possibly-stale callback.
  const isFocusedRef = useRef(false);
  // Latest horizontal scroll offset, so a re-focus re-evaluates visibility
  // against where the carousel is actually scrolled (RN preserves offset).
  const scrollOffsetRef = useRef(0);
  const linksCountRef = useRef(links.length);
  linksCountRef.current = links.length;
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      setIsFocused(true);
      return () => {
        isFocusedRef.current = false;
        setIsFocused(false);
        impressionFiredRef.current = false;
        cardImpressionsFiredRef.current.clear();
      };
    }, []),
  );
  useEffect(() => {
    if (!enabled || !hasLinks || !isFocused || impressionFiredRef.current) {
      return;
    }
    impressionFiredRef.current = true;
    trackEvent(AnalyticsEvent.ViewWalletLinks, {
      count: linksCountRef.current,
    });
  }, [enabled, hasLinks, isFocused, trackEvent]);

  // Fire a per-card impression the first time each card is ≥50% visible while
  // focused, so per-card CTR can be computed against `ClickWalletLink`.
  const trackVisibleCards = useCallback(
    (offsetX: number) => {
      if (!enabled || !isFocusedRef.current) return;
      const viewportLeft = offsetX;
      const viewportRight = offsetX + screenWidth;
      links.forEach((link, index) => {
        if (cardImpressionsFiredRef.current.has(link.id)) return;
        const cardLeft = CONTENT_PADDING_X + index * (cardWidth + sizes.s3);
        const cardRight = cardLeft + cardWidth;
        const visibleWidth =
          Math.min(cardRight, viewportRight) - Math.max(cardLeft, viewportLeft);
        if (visibleWidth < cardWidth * CARD_VISIBILITY_RATIO) return;
        // Hold the impression until the display name is final so `name` matches
        // what the user sees; admin name / imageUrl settle now, others wait.
        const nameSettled =
          !!link.name || !!link.imageUrl || ogSettledUrls.has(link.url);
        if (!nameSettled) return;
        cardImpressionsFiredRef.current.add(link.id);
        // Resolve the name the same way the card + click event do, so an
        // impression's `name` never disagrees with what the user saw.
        const displayedName = resolveWalletLinkDisplayName(
          link,
          ogByUrl[link.url],
        );
        trackEvent(AnalyticsEvent.ViewWalletLinkCard, {
          id: link.id,
          name: displayedName || undefined,
          url: link.url,
          index,
        });
      });
    },
    [
      enabled,
      screenWidth,
      links,
      cardWidth,
      ogByUrl,
      ogSettledUrls,
      trackEvent,
    ],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      scrollOffsetRef.current = offsetX;
      trackVisibleCards(offsetX);
    },
    [trackVisibleCards],
  );

  // The ScrollView unmounts on the early returns below and RN resets its offset
  // to 0 on remount; reset the ref too so a stale offset can't mis-attribute.
  useEffect(() => {
    if (!enabled || !hasLinks || isPending) scrollOffsetRef.current = 0;
  }, [enabled, hasLinks, isPending]);

  // Fire impressions for on-screen cards at focus, and for cards whose
  // impression was deferred until `ogSettledUrls` finalized their name.
  useEffect(() => {
    if (!enabled || !hasLinks || !isFocused) return;
    trackVisibleCards(scrollOffsetRef.current);
  }, [enabled, hasLinks, isFocused, trackVisibleCards]);

  const handleCardPress = useCallback(
    (link: ApiWalletLink) => {
      if (!link.url.startsWith('https://')) {
        return;
      }
      // Reuse the exact resolver that WalletLinkCard renders — including
      // the bogus-crawler-title filter — so this analytics event never
      // records a string different from what the user saw on the tapped
      // card (e.g. "Vercel Security Checkpoint" for a bot-blocked target
      // whose card visually displayed the URL domain).
      const og = ogByUrl[link.url];
      const displayedName = resolveWalletLinkDisplayName(link, og);
      const index = links.findIndex((l) => l.id === link.id);
      const walletLink = {
        id: link.id,
        name: displayedName || undefined,
        url: link.url,
        ...(index >= 0 ? { index } : {}),
      };
      trackEvent(AnalyticsEvent.ClickWalletLink, walletLink);
      // Thread the link identity into the browser session so a resulting
      // wallet transaction can be attributed back to this card (NEYN-12452).
      setOpenInAppBrowser({ url: link.url, source: 'wallet-card', walletLink });
    },
    [setOpenInAppBrowser, trackEvent, ogByUrl, links],
  );

  if (!enabled) {
    return null;
  }

  // While the query is pending, reserve carousel-sized space so
  // `WalletHomeOverview`'s `headerHeight` (measured onLayout) doesn't grow
  // when data arrives — preventing scroll-position jumps on Pulse /
  // Collectibles / Tokens tabs. When the response is definitively empty,
  // collapse the space (shrink is far less jarring than growth).
  if (isPending) {
    const reservedHeight =
      sizes.s2 + HEADING_APPROX_HEIGHT + sizes.s3 + cardHeight;
    return <View style={{ height: reservedHeight }} />;
  }

  if (!hasLinks) {
    return null;
  }

  return (
    <View style={[t.flexCol, t.pT2, t.pB2]}>
      <View style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.pX3, t.mB3]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <Text2 weight="semibold" color="primary" size="lg">
            Explore
          </Text2>
          {hasNewLinks && !isCollapsed && (
            <View
              style={[
                t.roundedFull,
                {
                  width: 6,
                  height: 6,
                  backgroundColor: t.colors.blue500,
                },
              ]}
            />
          )}
        </View>
        <AnimatedPressable
          style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
          onPress={toggleCollapsed}
        >
          {isCollapsed ? (
            <ChevronDown size={18} color={t.colors.text.secondary} />
          ) : (
            <ChevronUp size={18} color={t.colors.text.secondary} />
          )}
        </AnimatedPressable>
      </View>
      {!isCollapsed && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled
          alwaysBounceVertical={false}
          bounces={false}
          overScrollMode="never"
          onScroll={handleScroll}
          scrollEventThrottle={100}
          contentContainerStyle={{
            paddingHorizontal: CONTENT_PADDING_X,
            gap: sizes.s3,
          }}
        >
          {links.map((link) => (
            <WalletLinkCard
              key={link.id}
              link={link}
              og={ogByUrl[link.url]}
              width={cardWidth}
              height={cardHeight}
              onPress={handleCardPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export { WalletLinksCarousel };
