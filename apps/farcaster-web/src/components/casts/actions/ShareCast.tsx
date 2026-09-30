import { ImageIcon, LinkIcon, MailIcon } from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiFrame, getCastURL } from 'farcaster-client-data';
import {
  CastClickType,
  convertCastToCastShareContext,
  getCloudflareImageUrl,
  usePrefetchShareCast,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React, { useLayoutEffect, useMemo, useState } from 'react';

import { CastActionProps } from '~/components/casts/actions/types';
import { Image as ImageComponent } from '~/components/images/Image';
import { CastImageViewerModal } from '~/components/modals/CastImageViewerModal';
import { ShareCastAsDirectCastModal } from '~/components/modals/ShareCastAsDirectCastModal';
import { MenuItem } from '~/components/popovers/MenuItem';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { toast } from '~/utils/toast';

const ShareIcon: React.FC = () => {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M4.21875 7.31249C4.14416 7.31249 4.07262 7.34212 4.01988 7.39486C3.96713 7.44761 3.9375 7.51915 3.9375 7.59374V14.9062C3.9375 15.0615 4.0635 15.1875 4.21875 15.1875H13.7812C13.8558 15.1875 13.9274 15.1579 13.9801 15.1051C14.0329 15.0524 14.0625 14.9808 14.0625 14.9062V7.59374C14.0625 7.51915 14.0329 7.44761 13.9801 7.39486C13.9274 7.34212 13.8558 7.31249 13.7812 7.31249H12.6562C12.4325 7.31249 12.2179 7.22359 12.0596 7.06536C11.9014 6.90713 11.8125 6.69251 11.8125 6.46874C11.8125 6.24496 11.9014 6.03035 12.0596 5.87212C12.2179 5.71388 12.4325 5.62499 12.6562 5.62499H13.7812C14.868 5.62499 15.75 6.50699 15.75 7.59374V14.9062C15.75 15.4284 15.5426 15.9291 15.1734 16.2984C14.8042 16.6676 14.3034 16.875 13.7812 16.875H4.21875C3.69661 16.875 3.19585 16.6676 2.82663 16.2984C2.45742 15.9291 2.25 15.4284 2.25 14.9062V7.59374C2.25 6.50699 3.132 5.62499 4.21875 5.62499H5.34375C5.56753 5.62499 5.78214 5.71388 5.94037 5.87212C6.09861 6.03035 6.1875 6.24496 6.1875 6.46874C6.1875 6.69251 6.09861 6.90713 5.94037 7.06536C5.78214 7.22359 5.56753 7.31249 5.34375 7.31249H4.21875ZM8.80087 0.199113C8.827 0.172922 8.85804 0.152141 8.89221 0.137963C8.92638 0.123784 8.96301 0.116486 9 0.116486C9.03699 0.116486 9.07362 0.123784 9.10779 0.137963C9.14196 0.152141 9.173 0.172922 9.19913 0.199113L12.4571 3.45711C12.4966 3.49645 12.5234 3.54661 12.5343 3.60123C12.5452 3.65585 12.5396 3.71248 12.5183 3.76394C12.497 3.81539 12.4609 3.85935 12.4145 3.89025C12.3682 3.92115 12.3137 3.93759 12.258 3.93749H9.84375V10.4062C9.84375 10.63 9.75485 10.8446 9.59662 11.0029C9.43839 11.1611 9.22378 11.25 9 11.25C8.77622 11.25 8.56161 11.1611 8.40338 11.0029C8.24514 10.8446 8.15625 10.63 8.15625 10.4062V3.93749H5.742C5.6863 3.93759 5.63183 3.92115 5.58548 3.89025C5.53914 3.85935 5.50301 3.81539 5.48168 3.76394C5.46036 3.71248 5.45478 3.65585 5.46568 3.60123C5.47657 3.54661 5.50344 3.49645 5.54288 3.45711L8.80087 0.199113Z"
        className="fill-tertiary"
      />
    </svg>
  );
};

function CastShareMiniAppMenuItem({
  miniApp,
  cast,
  onClick,
  prefetchImage,
}: {
  miniApp: ApiFrame;
  cast: ApiCast;
  onClick: () => void;
  prefetchImage: Promise<HTMLImageElement>;
}) {
  const { launchMiniApp } = useMinimizableWindowContext();
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
  const [didImageFailToLoad, setDidImageFailToLoad] = useState(false);
  const currentUser = useCurrentUser();

  const triggerCastUrl = useMemo(() => {
    if (!miniApp.castShareUrl) {
      throw new Error('Mini app cast share URL is undefined');
    }

    // Load up the URL and add a query parameter called `castHash` equals to the hash.
    const url = new URL(miniApp.castShareUrl);
    url.searchParams.set('castHash', cast.hash);
    url.searchParams.set('castFid', cast.author.fid.toString());
    url.searchParams.set('viewerFid', currentUser.fid.toString());
    return url.toString();
  }, [cast.hash, cast.author.fid, currentUser.fid, miniApp.castShareUrl]);

  // Once the image is prefetched, set it to the state
  useLayoutEffect(() => {
    if (prefetchImage) {
      prefetchImage
        .then((image) => {
          setLoadedImageSrc(image.src);
        })
        .catch(() => {
          setDidImageFailToLoad(true);
        });
    }
  }, [prefetchImage]);

  const renderIcon = useMemo(() => {
    // If we have a prefetch promise and image isn't loaded yet, show placeholder
    if (!loadedImageSrc) {
      return (
        <div className="mx-0.5 size-4 animate-pulse rounded bg-overlay-faint" />
      );
    }

    // If image failed to load, show placeholder
    if (didImageFailToLoad) {
      return <div className="mx-0.5 size-4 rounded bg-overlay-faint" />;
    }

    return (
      <ImageComponent
        src={loadedImageSrc}
        alt={miniApp.name}
        className="mx-0.5 size-4"
        loading="eager"
      />
    );
  }, [loadedImageSrc, didImageFailToLoad, miniApp.name]);

  return (
    <MenuItem
      name={miniApp.name}
      icon={renderIcon}
      onClick={() => {
        launchMiniApp({
          context: convertCastToCastShareContext(cast),
          launchConfig: {
            type: 'standalone',
            name: miniApp.name,
            url: triggerCastUrl,
            splashImageUrl: miniApp.splashImageUrl,
            splashBackgroundColor: miniApp.splashBackgroundColor,
            author: miniApp.author,
          },
        });
        onClick();
      }}
    />
  );
}

const ShareCast: React.FC<CastActionProps> = React.memo(({ cast }) => {
  const isSignedIn = useIsSignedIn();

  const [visible, setVisible] = React.useState<boolean>(false);
  const { castShareEnabledMiniApps } = useUserAppContext();

  const miniApps = useMemo(() => {
    const withShare = castShareEnabledMiniApps.filter(
      (miniApp) => miniApp.castShareUrl !== undefined,
    );
    return [...withShare].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [castShareEnabledMiniApps]);

  const miniAppPrefetchedImages = useMemo(() => {
    return miniApps.map((miniApp) => {
      const cfUrl = getCloudflareImageUrl({
        url: miniApp.iconUrl,
        windowWidth: window.innerWidth,
        width: 12,
      });
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = cfUrl;
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
      });
    });
  }, [miniApps]);

  const miniAppMenuItems = useMemo(() => {
    return miniApps.map((miniApp, index) => (
      <CastShareMiniAppMenuItem
        key={miniApp.domain}
        miniApp={miniApp}
        cast={cast}
        onClick={() => setVisible(false)}
        prefetchImage={miniAppPrefetchedImages[index]}
      />
    ));
  }, [miniApps, miniAppPrefetchedImages, cast]);

  const [
    shareCastAsDirectCastModalVisible,
    setShareCastAsDirectCastModalVisible,
  ] = React.useState<boolean>(false);

  const [castImageViewerModalVisible, setCastImageViewerModalVisible] =
    React.useState<boolean>(false);

  const trackCastClick = useTrackCastClick();
  const { trackEvent } = useAnalytics();

  const prefetchShareCast = usePrefetchShareCast();

  const copyCastWarpcastURL = React.useCallback(
    (e: React.SyntheticEvent) => {
      setVisible(false);

      e.stopPropagation();

      const castURL = getCastURL({
        castUsername: cast.author.username,
        castHash: cast.hash,
      });

      trackCastClick({ type: CastClickType.ShareLink });
      trackEvent(AnalyticsEvent.ShareCastLink, undefined);

      navigator.clipboard.writeText(castURL);

      toast({ message: 'Link copied to clipboard' });
    },
    [cast.author.username, cast.hash, trackCastClick, trackEvent],
  );

  const onShareAsImageClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      setVisible(false);

      e.stopPropagation();

      setCastImageViewerModalVisible(true);

      trackEvent(AnalyticsEvent.ShareCastImage, undefined);

      trackCastClick({ type: CastClickType.ShareImage });
    },
    [trackCastClick, trackEvent],
  );

  const onSendAsDirectCastClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      setVisible(false);

      e.stopPropagation();

      trackCastClick({ type: CastClickType.ShareDirectCast });
      trackEvent(AnalyticsEvent.ShareCastDirectCast, undefined);

      setShareCastAsDirectCastModalVisible(true);
    },
    [trackCastClick, trackEvent],
  );

  return (
    <>
      <Popover.Root open={visible} onOpenChange={setVisible}>
        <Popover.Trigger>
          <div
            className={classNames(
              'group flex w-9 cursor-pointer flex-row items-center text-sm text-faint',
            )}
            onClick={(e) => {
              e.stopPropagation();

              trackEvent(AnalyticsEvent.ShareCast, {
                cast_author: cast.author.username || cast.author.displayName,
              });

              prefetchShareCast({ castHash: cast.hash });

              setVisible(true);
            }}
            onBlur={() => {
              setVisible(false);
            }}
          >
            <div className="group flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium">
              <ShareIcon />
            </div>
          </div>
        </Popover.Trigger>
        <Popover.Portal
          container={document.getElementById('popover-root') || undefined}
        >
          <Popover.Content
            className="outline-hidden z-50 flex max-h-[min(55vh,var(--radix-popover-content-available-height,55vh))] w-48 flex-col rounded-md border p-1 shadow-lg bg-app border-default"
            side="bottom"
            sideOffset={4}
            align="start"
          >
            <div className="flex min-h-0 shrink-0 flex-col">
              <MenuItem
                name="Copy link"
                icon={
                  <LinkIcon size={16} className={'mx-0.5 text-secondary'} />
                }
                onClick={copyCastWarpcastURL}
              />
              {isSignedIn && (
                <MenuItem
                  name="Send as direct cast"
                  icon={
                    <MailIcon size={16} className={'mx-0.5 text-secondary'} />
                  }
                  onClick={onSendAsDirectCastClick}
                />
              )}
              <MenuItem
                name="Share image"
                icon={
                  <ImageIcon size={16} className={'mx-0.5 text-secondary'} />
                }
                onClick={onShareAsImageClick}
              />
            </div>
            {miniAppMenuItems.length > 0 && (
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {miniAppMenuItems}
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {shareCastAsDirectCastModalVisible && (
        <ShareCastAsDirectCastModal
          cast={cast}
          onClose={() => setShareCastAsDirectCastModalVisible(false)}
        />
      )}
      {castImageViewerModalVisible && (
        <CastImageViewerModal
          cast={cast}
          onClose={() => setCastImageViewerModalVisible(false)}
        />
      )}
    </>
  );
});

ShareCast.displayName = 'ShareCast';

export { ShareCast };
