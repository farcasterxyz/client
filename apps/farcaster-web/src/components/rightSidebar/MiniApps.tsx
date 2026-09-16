import { ArrowRightIcon, GearIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import { frameKeyExtractor, useFavoriteFrames } from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useMemo } from 'react';

import { FrameImageIcon } from '~/components/icons/FrameImageIcon';
import { MiniAppsIcon } from '~/components/icons/MiniAppsIcon';
import { Image } from '~/components/images/Image';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useCurrentRoute } from '~/hooks/navigation/useCurrentRoute';
import { useNavigate } from '~/hooks/navigation/useNavigate';

interface FrameTileProps {
  frame: ApiFrame;
  variant?: 'default' | 'large';
}

export const FrameTile: FC<FrameTileProps> = memo(
  ({ frame, variant = 'default' }) => {
    const { launchMiniApp } = useMinimizableWindowContext();
    const [imageError, setImageError] = React.useState(false);

    const handleClick = () => {
      launchMiniApp({
        context: {
          type: 'launcher',
        },
        launchConfig: {
          type: 'standalone',
          name: frame.name,
          url: frame.homeUrl,
          splashImageUrl: frame.splashImageUrl,
          splashBackgroundColor: frame.splashBackgroundColor,
          author: frame.author,
        },
      });
    };

    const isLarge = variant === 'large';
    const size = isLarge ? 'w-[96px]' : 'w-[72px]';
    const imageSize = isLarge ? 'h-14 w-14' : 'h-14 w-14';
    const textMargin = isLarge ? 'mt-3' : 'mt-1';
    const textSize = isLarge ? 'text-sm' : 'text-xs';

    return (
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-lg hover:bg-hover',
          size,
        )}
        onClick={handleClick}
      >
        <div
          className={cn(
            'border-hairline relative rounded-[11.2px] border bg-overlay-faint border-faint',
            imageSize,
          )}
        >
          {!imageError ? (
            <Image
              src={frame.iconUrl}
              alt={frame.name}
              className="size-full rounded-[11.2px] object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <FrameImageIcon size={32} />
            </div>
          )}
        </div>
        <div
          className={cn('w-full truncate text-center', textMargin, textSize)}
        >
          {frame.name}
        </div>
      </div>
    );
  },
);

export const FavoriteFramesResults: FC = memo(() => {
  const { flatData } = useFavoriteFrames();
  const frames = useMemo(() => (flatData || []).slice(0, 12), [flatData]);

  return (
    <div className="grid grid-cols-4 gap-1">
      {frames.map((frame) => (
        <FrameTile key={frameKeyExtractor(frame)} frame={frame} />
      ))}
      {frames.length === 0 && (
        <div className="col-span-4">
          <DefaultEmptyListView
            className="!bg-transparent"
            message="No mini apps added yet"
          />
        </div>
      )}
    </div>
  );
});

const MiniApps: FC = () => {
  return (
    <Suspense>
      <MiniAppsContent />
    </Suspense>
  );
};

export const MiniAppsContent: FC = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { flatData } = useFavoriteFrames();
  const hasFrames = (flatData || []).length > 0;
  const currentRoute = useCurrentRoute();

  const handlePromoClick = () => {
    trackEvent(AnalyticsEvent.ClickDiscoverFrames, {
      source: 'sidebar',
    });
    navigate({ to: 'miniApps', params: {} });
  };

  if (currentRoute?.routeName === 'miniApps' && !hasFrames) {
    return null;
  }

  return (
    <div className="hidden rounded-xl px-4 py-3 bg-surface-secondary mdlg:block">
      {hasFrames ? (
        <>
          <div className="flex items-center justify-between">
            <div className="px-2 py-1 text-lg font-semibold">Your Apps</div>
            <div className="mr-4 flex items-center space-x-4">
              <div
                onClick={() => navigate({ to: 'settingsFrames', params: {} })}
                className="cursor-pointer rounded text-muted"
              >
                <GearIcon size={16} />
              </div>
              <div
                onClick={() => navigate({ to: 'discoverYourApps', params: {} })}
                className="cursor-pointer rounded text-muted"
              >
                <MiniAppsIcon size={16} color="currentColor" fill={false} />
              </div>
            </div>
          </div>
          <FavoriteFramesResults />
        </>
      ) : (
        <div className="cursor-pointer" onClick={handlePromoClick}>
          <div>
            {/* <Image
              src="/~/images/DiscoverFramesHero.webp"
              alt="Discover Mini Apps"
              className="w-full"
            /> */}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Discover Mini Apps</div>
              <div className="text-sm text-muted">View Mini Apps in Action</div>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-action-primary">
              <ArrowRightIcon size={16} className="text-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MiniApps.displayName = 'MiniApps';

export { MiniApps };
