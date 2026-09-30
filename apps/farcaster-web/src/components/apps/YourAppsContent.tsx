import { GearIcon } from '@primer/octicons-react';
import {
  frameKeyExtractor,
  useAppLauncher,
  useFavoriteFrames,
} from 'farcaster-client-hooks';
import { memo, useEffect, useMemo, useRef } from 'react';

import { FrameTile } from '~/components/rightSidebar/MiniApps';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const RecentAppsSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto pb-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={`recent-skeleton-${i}`}
        className="flex flex-shrink-0 flex-col items-center gap-2"
      >
        <div className="h-14 w-14 animate-pulse rounded-[11.2px] bg-overlay" />
        <div className="h-2.5 w-12 animate-pulse rounded bg-overlay" />
      </div>
    ))}
  </div>
);

const SavedAppsSkeleton = () => (
  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={`saved-skeleton-${i}`}
        className="flex flex-col items-center gap-2"
      >
        <div className="h-14 w-14 animate-pulse rounded-[11.2px] bg-overlay" />
        <div className="h-2.5 w-12 animate-pulse rounded bg-overlay" />
      </div>
    ))}
  </div>
);

const YourAppsContent = memo(() => {
  const navigate = useNavigate();

  const { data: launcherData, isLoading: isLoadingLauncher } = useAppLauncher({
    enabled: true,
    weightRecency: 1,
    weightFrequency: 0,
    weightInstalled: 0,
    refetchOnWindowFocus: true,
  });

  const {
    flatData: savedApps,
    isLoading: isLoadingFavorites,
    onEndReached,
  } = useFavoriteFrames();

  const recentApps = useMemo(() => launcherData?.apps ?? [], [launcherData]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onEndReached || !sentinelRef.current) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onEndReached();
        }
      },
      { threshold: 0, rootMargin: '0px 0px 200px 0px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onEndReached]);

  const showSkeleton =
    !recentApps.length &&
    !savedApps?.length &&
    (isLoadingLauncher || isLoadingFavorites);

  return (
    <div className="flex flex-col gap-6 px-4 pb-6 pt-4">
      <div>
        <h2 className="mb-3 text-xl font-semibold">Recently used</h2>
        {showSkeleton ? (
          <RecentAppsSkeleton />
        ) : recentApps.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recentApps.map((frame) => (
              <div key={`recent-${frame.domain}`} className="flex-shrink-0">
                <FrameTile frame={frame} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No recently used apps</p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved</h2>
          <button
            onClick={() => navigate({ to: 'settingsFrames', params: {} })}
            className="cursor-pointer rounded p-1 text-muted hover:bg-hover"
            aria-label="Manage saved apps"
          >
            <GearIcon size={16} />
          </button>
        </div>
        {showSkeleton ? (
          <SavedAppsSkeleton />
        ) : savedApps && savedApps.length > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-5 lg:grid-cols-6">
              {savedApps.map((frame) => (
                <FrameTile key={frameKeyExtractor(frame)} frame={frame} />
              ))}
            </div>
            <div ref={sentinelRef} className="min-h-px" />
          </>
        ) : (
          <p className="text-sm text-muted">No saved apps yet</p>
        )}
      </div>
    </div>
  );
});

YourAppsContent.displayName = 'YourAppsContent';

export { YourAppsContent };
