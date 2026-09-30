import { XIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  MILLIS_PER_DAY,
  useExploreFeed,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { Image } from '~/components/images/Image';
import { Clickable } from '~/components/motion/Clickable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useNavigateToNewsArticle } from '~/hooks/navigation/useNavigateToNewsArticle';
import { applyCloudflarePath } from '~/utils/images';

const makeDismissKey = ({ fid }: { fid: number }) =>
  `clanker-spotlight-dismiss:${fid}`;

const getIsDismissed = ({ fid }: { fid: number }) => {
  try {
    const key = makeDismissKey({ fid });
    const raw = localStorage.getItem(key);
    if (!raw) {
      return false;
    }
    const { expiresAt } = JSON.parse(raw);
    if (typeof expiresAt !== 'number' || Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const setDismissed = ({ fid }: { fid: number }) => {
  try {
    const key = makeDismissKey({ fid });
    localStorage.setItem(
      key,
      JSON.stringify({ expiresAt: Date.now() + MILLIS_PER_DAY * 30 }),
    );
  } catch {}
};

type ClankerSpotlightProps = {};

function ClankerSpotlight(_: ClankerSpotlightProps) {
  const { fid } = useCurrentUser();

  const { trackEvent } = useAnalytics();

  const { data: userPreferences } = useUserPreferences();

  const { data } = useExploreFeed();

  const mostRecentClankerSpotlight = React.useMemo(() => {
    if (typeof data.feed.news !== 'undefined' && data.feed.news.length !== 0) {
      const spotlights = data.feed.news.filter(
        ({ isClankerSpotlight }) =>
          typeof isClankerSpotlight !== 'undefined' &&
          isClankerSpotlight !== false,
      );

      if (spotlights.length !== 0) {
        return spotlights[0];
      }
    }

    return undefined;
  }, [data.feed.news]);

  const navigate = useNavigateToNewsArticle();

  const isGeoRestricted = useWalletGeoRestricted();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  const onTokenClick = React.useCallback(() => {
    if (
      !isGeoRestricted &&
      navigateInWallet &&
      typeof mostRecentClankerSpotlight !== 'undefined' &&
      typeof mostRecentClankerSpotlight.token !== 'undefined'
    ) {
      trackEvent(AnalyticsEvent.ClankerSpotlightTokenClick, {});

      navigateInWallet({
        path: 'Token',
        params: {
          chain: mostRecentClankerSpotlight.token.chain,
          ca: mostRecentClankerSpotlight.token.ca,
          via: 'web-clankler-spotlight-banner',
        },
      });
    }
  }, [
    isGeoRestricted,
    mostRecentClankerSpotlight,
    navigateInWallet,
    trackEvent,
  ]);

  const onBannerClick = React.useCallback(() => {
    if (typeof mostRecentClankerSpotlight === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.ClankerSpotlightBannerClick, {});

    navigate({ articlePublicId: mostRecentClankerSpotlight.publicId });
  }, [mostRecentClankerSpotlight, navigate, trackEvent]);

  const [isDismissed, setIsDismissed] = React.useState(false);

  const onDismissClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      trackEvent(AnalyticsEvent.ClankerSpotlightBannerDismiss, {});

      setIsDismissed(true);

      setDismissed({ fid: fid });
    },
    [fid, trackEvent],
  );

  React.useLayoutEffect(() => {
    if (!isDismissed) {
      setIsDismissed(getIsDismissed({ fid }));
    }
  }, [fid, isDismissed]);

  if (isDismissed) {
    return null;
  }

  if (userPreferences.result.preferences.optOutTradeIdeas) {
    return null;
  }

  if (typeof mostRecentClankerSpotlight === 'undefined') {
    return null;
  }

  return (
    <Clickable disabled={false} onClick={onBannerClick}>
      <div className="w-max max-w-[393px] overflow-hidden rounded-xl border border-[#F8F6FF] bg-[#F8F6FF] dark:border-[#231A36] dark:bg-[#1B1429]">
        <div className="relative flex flex-col justify-start space-y-[12px] p-3">
          <div className="flex flex-col space-y-[4px]">
            <div className="flex flex-row items-center gap-1">
              <div className="text-lg font-semibold text-brand">
                {mostRecentClankerSpotlight.title}
              </div>
            </div>
            <div className="line-clamp-3 text-sm font-normal text-muted">
              {mostRecentClankerSpotlight.description}
            </div>
          </div>
          {typeof mostRecentClankerSpotlight.token !== 'undefined' && (
            <Clickable disabled={false} onClick={onTokenClick}>
              <div className="flex h-[32px] w-max items-center justify-start gap-1 rounded-[24px] px-2 text-base font-normal bg-tertiary text-default">
                <Image
                  src={
                    applyCloudflarePath(
                      mostRecentClankerSpotlight.token?.imageUrl,
                      16,
                    ) || NFT_IMAGE_UNAVAILABLE_URL
                  }
                  className={'aspect-cover shrink-0 rounded-full bg-app'}
                  style={{
                    width: 16,
                    height: 16,
                    minWidth: 16,
                    minHeight: 16,
                  }}
                  alt={`Image`}
                  fallback={NFT_IMAGE_UNAVAILABLE_URL}
                />
                {mostRecentClankerSpotlight.token.symbol}
              </div>
            </Clickable>
          )}
          <div
            className="absolute right-0 top-0 z-10 !mr-3 !mt-3 flex size-4 cursor-pointer items-center justify-center rounded-full p-4 bg-swap"
            onClick={onDismissClick}
          >
            <XIcon size={12} className="text-muted" />
          </div>
        </div>
      </div>
    </Clickable>
  );
}

export { ClankerSpotlight };
