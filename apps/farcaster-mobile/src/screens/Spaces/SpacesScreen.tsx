import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiAudioRoom } from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  useAudioRoomsList,
  useRsvpAudioRoom,
  useScheduledAudioRoomsList,
  useStartScheduledAudioRoom,
} from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { buildScreen } from '~/components/Screen';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { useSpace } from '~/contexts/SpaceContext';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { CreateSpaceBottomSheet } from '~/screens/Spaces/CreateSpaceBottomSheet';
import { CommonStackParamList } from '~/types/navigation';
import { trackMobileAudioSpaceEvent } from '~/utils/AudioSpaceInstrumentation';
import { prioritizeFollowedHostsAndFilterBlockedHosts } from '~/utils/audioSpaceRoomOrdering';

const ACTION_PRIMARY = '#7c65c1';
const RED = '#dc3412';

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#101010' : '#ffffff',
    bgSecondary: isDark ? '#1f1f1f' : '#f2f2f2',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    actionPrimary: ACTION_PRIMARY,
    danger: RED,
  };
}

const tabs = ['Live now', 'Upcoming'] as const;
type Tab = (typeof tabs)[number];

type SpacesScreenProps = NativeStackScreenProps<CommonStackParamList, 'Spaces'>;

const SpacesScreen = buildScreen<SpacesScreenProps>({ name: 'Spaces' }, () => {
  return <SpacesScreenInner />;
});

SpacesScreen.displayName = 'SpacesScreen';

function SpacesScreenInner() {
  const c = useColors();
  const currentUser = useCurrentUser();
  const [tab, setTab] = useState<Tab>('Live now');
  const [createOpen, setCreateOpen] = useState(false);
  const telemetrySessionIdRef = useRef(
    createAudioSpaceTelemetryId('spaces_list'),
  );
  const telemetryDedupeRef = useRef<Map<string, number>>(new Map());

  const {
    data: liveRooms,
    isLoading: isLoadingLive,
    refetch: refetchLive,
    isRefetching: isRefetchingLive,
  } = useAudioRoomsList();
  const {
    data: scheduledRooms,
    isLoading: isLoadingScheduled,
    refetch: refetchScheduled,
    isRefetching: isRefetchingScheduled,
  } = useScheduledAudioRoomsList({
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

  useEffect(() => {
    trackMobileAudioSpaceEvent({
      eventName: AUDIO_SPACE_EVENTS.listViewed,
      context: {
        spaceSessionId: telemetrySessionIdRef.current,
        viewerFid: currentUser?.fid,
        platform: 'mobile',
        entrySource: 'spaces_list',
      },
      properties: {
        tab,
        liveCount: liveRooms?.length ?? 0,
        upcomingCount: scheduledRooms?.length ?? 0,
      },
      dedupeMap: telemetryDedupeRef.current,
      dedupeKey: `mobile-list-viewed-${tab}-${liveRooms?.length ?? 0}-${scheduledRooms?.length ?? 0}`,
      dedupeWindowMs: 2000,
    });
  }, [currentUser?.fid, liveRooms?.length, scheduledRooms?.length, tab]);

  const rooms = tab === 'Live now' ? sortedLiveRooms : sortedScheduledRooms;
  const isLoading = tab === 'Live now' ? isLoadingLive : isLoadingScheduled;
  const emptyMsg =
    tab === 'Live now'
      ? 'No live Spaces right now. Start one or check back later.'
      : 'No upcoming Spaces scheduled. Check back later.';

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Tabs */}
      <View style={[styles.tabsRow, { borderColor: c.border }]}>
        {tabs.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={styles.tabButton}>
            <Text
              style={[styles.tabText, { color: tab === t ? c.fg : c.fgFaint }]}
            >
              {t}
            </Text>
            {tab === t && (
              <View
                style={[
                  styles.tabUnderline,
                  { backgroundColor: c.actionPrimary },
                ]}
              />
            )}
          </Pressable>
        ))}
      </View>

      {/* Start CTA */}
      <View style={[styles.startRow, { borderColor: c.border }]}>
        <Pressable
          onPress={() => {
            trackMobileAudioSpaceEvent({
              eventName: AUDIO_SPACE_EVENTS.openSource,
              context: {
                spaceSessionId: telemetrySessionIdRef.current,
                viewerFid: currentUser?.fid,
                platform: 'mobile',
                entrySource: 'spaces_list',
              },
              properties: {
                source: tab === 'Upcoming' ? 'schedule_cta' : 'start_cta',
              },
              dedupeMap: telemetryDedupeRef.current,
              dedupeKey: `mobile-open-source-create-${tab}`,
              dedupeWindowMs: 1000,
            });
            setCreateOpen(true);
          }}
          style={[styles.startButton, { backgroundColor: c.actionPrimary }]}
        >
          <Octicons name="unmute" size={14} color="white" />
          <Text style={styles.startButtonText}>
            {tab === 'Upcoming' ? 'Schedule a Space' : 'Start a Space'}
          </Text>
        </Pressable>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={
              tab === 'Live now' ? isRefetchingLive : isRefetchingScheduled
            }
            onRefresh={() => {
              if (tab === 'Live now') {
                refetchLive();
              } else {
                refetchScheduled();
              }
            }}
            tintColor={c.fgFaint}
          />
        }
      >
        {isLoading && !rooms ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
          </View>
        ) : (rooms ?? []).length === 0 ? (
          <EmptyState message={emptyMsg} />
        ) : (
          (rooms ?? []).map((room) => (
            <SpaceListRow
              key={room.id}
              room={room}
              viewerFid={currentUser?.fid}
            />
          ))
        )}
      </ScrollView>

      <CreateSpaceBottomSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initialMode={tab === 'Upcoming' ? 'schedule' : 'now'}
      />
    </View>
  );
}

function SpaceListRow({
  room,
  viewerFid,
}: {
  room: ApiAudioRoom;
  viewerFid?: number;
}) {
  const c = useColors();
  const push = usePush();
  const toast = useToast();
  const { join, joined, participantCount } = useSpace();
  const startScheduledRoom = useStartScheduledAudioRoom();
  const rsvpAudioRoom = useRsvpAudioRoom();
  const [isStarting, setIsStarting] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [localRsvped, setLocalRsvped] = useState<boolean | null>(null);

  const isScheduled = room.state === 'scheduled';
  const isLive = room.state === 'live';
  const isJoined = joined?.room.id === room.id;
  const isViewerHost = viewerFid !== undefined && room.hostFid === viewerFid;
  const rsvped = localRsvped ?? room.viewerContext?.rsvped ?? false;
  const scheduledLabel = useScheduledLabel(room.scheduledAt);
  const listenerCount =
    isJoined && participantCount > 0 ? participantCount : room.listenerCount;
  const roomMetaSuffix = isLive
    ? ` · ${listenerCount.toLocaleString()} listening`
    : isScheduled && scheduledLabel
      ? ` · ${scheduledLabel}${
          (room.rsvpCount ?? 0) > 0 ? ` · ${room.rsvpCount} interested` : ''
        }`
      : '';

  const open = useCallback(() => {
    const spaceSessionId = createAudioSpaceTelemetryId('space_open');
    trackMobileAudioSpaceEvent({
      eventName: AUDIO_SPACE_EVENTS.cardOpened,
      context: {
        spaceSessionId,
        roomId: room.id,
        viewerFid,
        platform: 'mobile',
        entrySource: 'spaces_list',
      },
      properties: {
        roomState: room.state,
      },
    });
    trackMobileAudioSpaceEvent({
      eventName: AUDIO_SPACE_EVENTS.openSource,
      context: {
        spaceSessionId,
        roomId: room.id,
        viewerFid,
        platform: 'mobile',
        entrySource: 'spaces_list',
      },
      properties: {
        source: 'spaces_list',
      },
    });
    push('SpaceRoom', { roomId: room.id });
  }, [push, room.id, room.state, viewerFid]);

  const goLive = useCallback(async () => {
    setIsStarting(true);
    try {
      const result = await startScheduledRoom({ roomId: room.id });
      const didJoin = await join(result.room.id, 'spaces_list');
      if (!didJoin) {
        return;
      }
      push('SpaceRoom', { roomId: result.room.id });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to start Space', {
        type: 'danger',
      });
    } finally {
      setIsStarting(false);
    }
  }, [startScheduledRoom, room.id, join, push, toast]);

  const handleRsvp = useCallback(async () => {
    setIsRsvping(true);
    const wasRsvped = rsvped;
    setLocalRsvped(!wasRsvped);
    try {
      const result = await rsvpAudioRoom({ roomId: room.id });
      setLocalRsvped(result.rsvped);
    } catch {
      setLocalRsvped(wasRsvped);
      toast.show('Failed to update reminder', { type: 'danger' });
    } finally {
      setIsRsvping(false);
    }
  }, [rsvpAudioRoom, room.id, rsvped, toast]);

  return (
    <Pressable
      onPress={open}
      style={[styles.roomRow, { borderColor: c.border }]}
    >
      <Avatar pfpUrl={room.host.pfp?.url} diameter={48} />
      <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
        <View style={styles.roomBadgesRow}>
          {isLive ? (
            <View
              style={[styles.liveBadgeSmall, { backgroundColor: c.danger }]}
            >
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          ) : (
            <View
              style={[
                styles.scheduledBadge,
                { backgroundColor: c.actionPrimary },
              ]}
            >
              <Text style={styles.liveBadgeText}>SOON</Text>
            </View>
          )}
          {isScheduled && room.recordingEnabled && (
            <View style={styles.recordedBadge}>
              <Text numberOfLines={1} style={styles.recordedBadgeText}>
                RECORDING ON
              </Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={isScheduled ? 2 : 1}
          style={[styles.roomTitle, { color: c.fg }]}
        >
          {room.title}
        </Text>
        {!!room.description && (
          <Text
            numberOfLines={1}
            style={[styles.roomDescription, { color: c.fgFaint }]}
          >
            {room.description}
          </Text>
        )}
        <SpaceUserDisplayNameWithProBadge
          user={room.host}
          name={room.host.displayName || `@${room.host.username}`}
          badgeSize={12}
          containerStyle={styles.roomMetaRow}
          textStyle={[
            styles.roomMeta,
            styles.roomMetaInRow,
            { color: c.fgFaint },
          ]}
          suffix={roomMetaSuffix}
          suffixTextStyle={[
            styles.roomMeta,
            styles.roomMetaInRow,
            { color: c.fgFaint },
          ]}
        />
      </View>
      {isScheduled ? (
        isViewerHost ? (
          <Pressable
            onPress={goLive}
            disabled={isStarting}
            style={[
              styles.cardActionButton,
              {
                backgroundColor: c.actionPrimary,
                opacity: isStarting ? 0.6 : 1,
              },
            ]}
          >
            <Text style={styles.cardActionText}>
              {isStarting ? '...' : 'Go live'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleRsvp}
            disabled={isRsvping}
            style={[
              styles.cardActionButton,
              {
                backgroundColor: rsvped ? c.bgSecondary : c.actionPrimary,
                opacity: isRsvping ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.cardActionText,
                { color: rsvped ? c.fg : 'white' },
              ]}
            >
              {rsvped ? 'Reminder set' : 'Notify me'}
            </Text>
          </Pressable>
        )
      ) : (
        <Pressable
          onPress={open}
          style={[styles.cardActionButton, { backgroundColor: c.bgSecondary }]}
        >
          <Text style={[styles.cardActionText, { color: c.fg }]}>Open</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function useScheduledLabel(scheduledAt?: string): string | null {
  if (!scheduledAt) return null;
  const date = new Date(scheduledAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (isToday) return `Today at ${time}`;
  if (isTomorrow) return `Tomorrow at ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
}

function EmptyState({ message }: { message: string }) {
  const c = useColors();
  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: c.fg }]}>No Spaces here</Text>
      <Text style={[styles.emptyBody, { color: c.fgFaint }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 56,
    borderRadius: 2,
  },
  startRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
  },
  startButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  loadingBox: { padding: 24, alignItems: 'center' },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  roomBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  liveBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  scheduledBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  liveBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  recordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(220,52,18,0.12)',
  },
  recordedBadgeText: { color: RED, fontSize: 9, fontWeight: '700' },
  roomTitle: { fontSize: 15, fontWeight: '600' },
  roomDescription: { fontSize: 12, marginTop: 2 },
  roomMeta: { fontSize: 12, marginTop: 2 },
  roomMetaRow: { marginTop: 2 },
  roomMetaInRow: { marginTop: 0 },
  cardActionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 8,
  },
  cardActionText: { color: 'white', fontSize: 13, fontWeight: '700' },
});

export { SpacesScreen };
