import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  useAudioRoomsList,
  useScheduledAudioRoomsList,
} from 'farcaster-client-hooks';
import { Mic } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { CreateSpaceModal } from '~/components/spaces/CreateSpaceModal';
import { SpaceCard } from '~/components/spaces/SpaceCard';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import { prioritizeFollowedHostsAndFilterBlockedHosts } from '~/utils/audioSpaceRoomOrdering';

const tabs = ['Live now', 'Upcoming'] as const;
type Tab = (typeof tabs)[number];

const SpacesPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { tab: tabSearchParam } = useSearchParams('spacesDiscovery');
  const tab: Tab = tabSearchParam === 'upcoming' ? 'Upcoming' : 'Live now';
  const [createOpen, setCreateOpen] = useState(false);
  const currentUser = useCachedCurrentUser();
  const telemetrySessionIdRef = useRef(
    createAudioSpaceTelemetryId('spaces_page'),
  );
  const telemetryDedupeRef = useRef<Map<string, number>>(new Map());

  const { data: liveRooms, isLoading: isLoadingLive } = useAudioRoomsList();
  const { data: scheduledRooms, isLoading: isLoadingScheduled } =
    useScheduledAudioRoomsList({
      enabled: tab === 'Upcoming',
    });
  const sortedLiveRooms = useMemo(
    () => prioritizeFollowedHostsAndFilterBlockedHosts(liveRooms),
    [liveRooms],
  );
  const sortedScheduledRooms = useMemo(
    () => prioritizeFollowedHostsAndFilterBlockedHosts(scheduledRooms),
    [scheduledRooms],
  );
  const handleTabChange = useCallback(
    (nextTab: Tab) => {
      navigate({
        to: 'spacesDiscovery',
        params: {},
        searchParams: {
          tab: nextTab === 'Upcoming' ? 'upcoming' : 'live',
        },
      });
    },
    [navigate],
  );

  useEffect(() => {
    trackWebAudioSpaceEvent({
      eventName: AUDIO_SPACE_EVENTS.listViewed,
      context: {
        spaceSessionId: telemetrySessionIdRef.current,
        viewerFid: currentUser?.fid,
        platform: 'web',
        entrySource: 'spaces_list',
      },
      properties: {
        tab,
        liveCount: liveRooms?.length ?? 0,
        upcomingCount: scheduledRooms?.length ?? 0,
      },
      dedupeMap: telemetryDedupeRef.current,
      dedupeKey: `web-list-viewed-${tab}-${liveRooms?.length ?? 0}-${scheduledRooms?.length ?? 0}`,
      dedupeWindowMs: 2000,
    });
  }, [currentUser?.fid, liveRooms?.length, scheduledRooms?.length, tab]);

  return (
    <Page meta={{ title: 'Spaces' }}>
      <BorderedMainContent>
        {/* Header */}
        <div className="bg-app/95 sticky top-0 z-20 border-b backdrop-blur border-faint">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[20px] font-bold text-default">Spaces</div>
            <button
              type="button"
              onClick={() => {
                trackWebAudioSpaceEvent({
                  eventName: AUDIO_SPACE_EVENTS.openSource,
                  context: {
                    spaceSessionId: telemetrySessionIdRef.current,
                    viewerFid: currentUser?.fid,
                    platform: 'web',
                    entrySource: 'spaces_list',
                  },
                  properties: {
                    source: tab === 'Upcoming' ? 'schedule_cta' : 'start_cta',
                  },
                  dedupeMap: telemetryDedupeRef.current,
                  dedupeKey: `web-open-source-create-${tab}`,
                  dedupeWindowMs: 1000,
                });
                setCreateOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-transparent px-[0.9333rem] py-[0.4333rem] text-sm font-semibold bg-action-primary text-light hover:opacity-90"
            >
              <Mic size={12} />
              {tab === 'Upcoming' ? 'Schedule a Space' : 'Start a Space'}
            </button>
          </div>
          {/* Tabs */}
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`relative flex-1 px-4 py-3 text-center text-[14px] font-medium transition-colors hover:bg-overlay-light ${
                  tab === t ? 'text-default' : 'text-faint'
                }`}
              >
                {t}
                {tab === t && (
                  <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-14 rounded-full bg-action-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {tab === 'Live now' && (
          <>
            {isLoadingLive ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoadingIndicator />
              </div>
            ) : sortedLiveRooms.length === 0 ? (
              <EmptyState message="No live Spaces right now. Start one or check back later." />
            ) : (
              <div>
                {sortedLiveRooms.map((room) => (
                  <SpaceCard
                    key={room.id}
                    room={room}
                    viewerFid={currentUser?.fid}
                  />
                ))}
              </div>
            )}
          </>
        )}
        {tab === 'Upcoming' && (
          <>
            {isLoadingScheduled ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoadingIndicator />
              </div>
            ) : sortedScheduledRooms.length === 0 ? (
              <EmptyState message="No upcoming Spaces scheduled. Check back later." />
            ) : (
              <div>
                {sortedScheduledRooms.map((room) => (
                  <SpaceCard
                    key={room.id}
                    room={room}
                    viewerFid={currentUser?.fid}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </BorderedMainContent>
      <CreateSpaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initialMode={tab === 'Upcoming' ? 'schedule' : 'now'}
      />
    </Page>
  );
});

SpacesPage.displayName = 'SpacesPage';

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="px-6 py-16 text-center">
    <div className="mb-2 text-[15px] font-medium text-default">
      No Spaces here
    </div>
    <div className="text-[13px] text-faint">{message}</div>
  </div>
);

export { SpacesPage };
