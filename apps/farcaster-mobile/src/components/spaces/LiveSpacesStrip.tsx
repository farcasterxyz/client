import { Octicons } from '@expo/vector-icons';
import { ApiAudioRoom } from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  useAudioRoomsList,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { Avatar } from '~/components/Avatar';
import { PulsingDot } from '~/components/spaces/PulsingDot';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { useSpace } from '~/contexts/SpaceContext';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { trackMobileAudioSpaceEvent } from '~/utils/AudioSpaceInstrumentation';
import { rankLiveSpacesForFeedStrip } from '~/utils/audioSpaceRoomOrdering';

const RED = '#dc3412';
const ACTION_PRIMARY = '#7c65c1';
const AUTO_EXPAND_LISTENER_THRESHOLD = 50;

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#101010' : '#ffffff',
    bgSecondary: isDark ? '#1f1f1f' : '#f6f6f6',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    actionPrimary: ACTION_PRIMARY,
    danger: RED,
  };
}

/**
 * Horizontal strip of live Spaces above the home feed. Mirrors web's
 * `LiveSpacesStrip`. Hidden when no Spaces are live.
 *
 * Followed hosts are prioritized first and blocked hosts are filtered out.
 */
const LiveSpacesStrip: React.FC = React.memo(() => {
  const c = useColors();
  const { data: rooms } = useAudioRoomsList();

  const sorted = useMemo(() => {
    return rankLiveSpacesForFeedStrip(rooms);
  }, [rooms]);
  const shouldAutoExpand = useMemo(() => {
    return sorted.some(
      (room) =>
        room.host.viewerContext?.following ||
        room.listenerCount >= AUTO_EXPAND_LISTENER_THRESHOLD,
    );
  }, [sorted]);
  const [expanded, setExpanded] = useState(() => shouldAutoExpand);
  useEffect(() => {
    setExpanded(shouldAutoExpand);
  }, [shouldAutoExpand]);

  if (sorted.length === 0) return null;
  const headerText =
    sorted.length === 1 ? sorted[0].title : `${sorted.length} SPACES LIVE NOW`;

  return (
    <View style={[styles.stripWrap, { borderColor: c.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? 'Collapse live spaces' : 'Expand live spaces'
        }
        onPress={() => setExpanded((value) => !value)}
        style={styles.stripHeaderButton}
      >
        <View style={styles.stripHeader}>
          <View style={[styles.liveDot, { backgroundColor: c.danger }]} />
          <Text
            numberOfLines={1}
            style={[
              sorted.length === 1
                ? styles.stripHeaderTitle
                : styles.stripHeaderText,
              { color: c.fgFaint },
            ]}
          >
            {headerText}
          </Text>
        </View>
        <Octicons
          color={c.fgFaint}
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
        />
      </Pressable>
      {expanded &&
        (sorted.length === 1 ? (
          <SingleSpaceFeedCard room={sorted[0]} showBottomBorder={false} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {sorted.map((room) => (
              <CarouselCard key={room.id} room={room} />
            ))}
          </ScrollView>
        ))}
    </View>
  );
});

LiveSpacesStrip.displayName = 'LiveSpacesStrip';

/**
 * Visually prominent feed card for the single-live-Space case. Mirrors web's
 * `LiveSpaceFeedCard`: gradient background, "LIVE · Space" header, host
 * info, listener count, and a prominent Join CTA.
 */
function SingleSpaceFeedCard({
  room,
  showBottomBorder = true,
}: {
  room: ApiAudioRoom;
  showBottomBorder?: boolean;
}) {
  const c = useColors();
  const push = usePush();
  const { joined, participantCount } = useSpace();
  const currentUser = useCurrentUser();
  const isJoined = joined?.room.id === room.id;
  const listenerCount =
    isJoined && participantCount > 0 ? participantCount : room.listenerCount;

  return (
    <View
      style={[
        styles.singleWrap,
        { borderColor: c.border },
        !showBottomBorder && styles.singleWrapBorderless,
      ]}
    >
      <Pressable
        onPress={() => {
          const spaceSessionId = createAudioSpaceTelemetryId('space_open');
          trackMobileAudioSpaceEvent({
            eventName: AUDIO_SPACE_EVENTS.cardOpened,
            context: {
              spaceSessionId,
              roomId: room.id,
              viewerFid: currentUser?.fid,
              platform: 'mobile',
              entrySource: 'live_strip',
            },
            properties: {
              source: 'live_strip_single',
            },
          });
          trackMobileAudioSpaceEvent({
            eventName: AUDIO_SPACE_EVENTS.openSource,
            context: {
              spaceSessionId,
              roomId: room.id,
              viewerFid: currentUser?.fid,
              platform: 'mobile',
              entrySource: 'live_strip',
            },
            properties: { source: 'live_strip' },
          });
          push('SpaceRoom', { roomId: room.id });
        }}
        style={({ pressed }) => [
          styles.singleCardV2,
          { borderColor: c.actionPrimary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.singleGradientLayer} />
        <View style={styles.singleHeaderRow}>
          <View style={[styles.liveBadge, { backgroundColor: c.danger }]}>
            <PulsingDot size={5} color="white" />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <Text style={[styles.singleSubtype, { color: c.fgFaint }]}>
            Space
          </Text>
        </View>

        <Text numberOfLines={2} style={[styles.singleTitle, { color: c.fg }]}>
          {room.title}
        </Text>

        <View style={styles.singleFooter}>
          <View style={styles.singleHostRow}>
            <Avatar pfpUrl={room.host.pfp?.url} diameter={28} />
            <View style={{ marginLeft: 8, flexShrink: 1 }}>
              <SpaceUserDisplayNameWithProBadge
                user={room.host}
                badgeSize={12}
                textStyle={[styles.singleHostName, { color: c.fg }]}
                suffix=" · hosting"
                suffixTextStyle={[
                  styles.singleHostSuffix,
                  { color: c.fgFaint },
                ]}
              />
              <Text
                numberOfLines={1}
                style={[styles.singleListening, { color: c.fgFaint }]}
              >
                {listenerCount.toLocaleString()} listening
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.singleJoinPill,
              {
                backgroundColor: isJoined ? c.bgSecondary : c.actionPrimary,
              },
            ]}
          >
            {!isJoined && <Octicons name="unmute" size={12} color="white" />}
            <Text
              style={[
                styles.singleJoinText,
                { color: isJoined ? c.fgFaint : 'white' },
              ]}
            >
              {isJoined ? 'Joined' : 'Join'}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function CarouselCard({ room }: { room: ApiAudioRoom }) {
  const c = useColors();
  const push = usePush();
  const { joined, participantCount } = useSpace();
  const currentUser = useCurrentUser();
  const isJoined = joined?.room.id === room.id;
  const listenerCount =
    isJoined && participantCount > 0 ? participantCount : room.listenerCount;
  return (
    <Pressable
      onPress={() => {
        const spaceSessionId = createAudioSpaceTelemetryId('space_open');
        trackMobileAudioSpaceEvent({
          eventName: AUDIO_SPACE_EVENTS.cardOpened,
          context: {
            spaceSessionId,
            roomId: room.id,
            viewerFid: currentUser?.fid,
            platform: 'mobile',
            entrySource: 'live_strip',
          },
          properties: { source: 'live_strip_carousel' },
        });
        trackMobileAudioSpaceEvent({
          eventName: AUDIO_SPACE_EVENTS.openSource,
          context: {
            spaceSessionId,
            roomId: room.id,
            viewerFid: currentUser?.fid,
            platform: 'mobile',
            entrySource: 'live_strip',
          },
          properties: { source: 'live_strip' },
        });
        push('SpaceRoom', { roomId: room.id });
      }}
      style={[
        styles.carouselCard,
        { backgroundColor: c.bgSecondary, borderColor: c.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <Avatar pfpUrl={room.host.pfp?.url} diameter={28} />
        <View style={[styles.liveBadge, { backgroundColor: c.danger }]}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={[styles.cardTitle, { color: c.fg }]}>
        {room.title}
      </Text>
      <SpaceUserDisplayNameWithProBadge
        user={room.host}
        badgeSize={12}
        containerStyle={styles.cardMetaRow}
        textStyle={[
          styles.cardMeta,
          styles.cardMetaInRow,
          { color: c.fgFaint },
        ]}
      />
      <Text
        style={[styles.cardListeners, { color: c.fgFaint }]}
        numberOfLines={1}
      >
        {listenerCount.toLocaleString()} listening
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  singleWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  singleCardV2: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  singleGradientLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124, 101, 193, 0.08)',
  },
  singleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  singleSubtype: { fontSize: 12 },
  singleTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  singleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  singleHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  singleHostName: { fontSize: 13, fontWeight: '500' },
  singleHostSuffix: { fontSize: 13, fontWeight: '400' },
  singleListening: { fontSize: 12, marginTop: 1 },
  singleJoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  singleJoinText: { color: 'white', fontWeight: '700', fontSize: 13 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  stripWrap: {
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stripHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  stripHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  stripHeaderTitle: { fontSize: 12, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 12, gap: 8 },
  singleWrapBorderless: { borderBottomWidth: 0, paddingBottom: 0 },
  carouselCard: {
    width: 200,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', minHeight: 36 },
  cardMeta: { fontSize: 12, marginTop: 6 },
  cardMetaRow: { marginTop: 6 },
  cardMetaInRow: { marginTop: 0 },
  cardListeners: { fontSize: 11, marginTop: 2 },
});

export { LiveSpacesStrip };
