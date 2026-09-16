import { Octicons } from '@expo/vector-icons';
import { useAudioRoom } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { Avatar } from '~/components/Avatar';
import { PulsingDot } from '~/components/spaces/PulsingDot';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { usePush } from '~/hooks/navigation/usePush';

const ACTION_PRIMARY = '#7c65c1';
const RED = '#dc3412';
// Fits badge row + 1-line title + host footer with p-3 padding.
const SPACE_EMBED_FEED_HEIGHT = 124;

const SPACE_URL_PATTERN =
  'https?:\\/\\/(?:www\\.)?(?:warpcast\\.com|farcaster\\.xyz)\\/~\\/spaces\\/([\\w-]+)\\/?(?:\\?[^#\\s]*)?(?:#[^\\s]*)?';
const SPACE_URL_RE = new RegExp(`^${SPACE_URL_PATTERN}$`);
const SPACE_URL_IN_TEXT_RE = new RegExp(SPACE_URL_PATTERN, 'g');

export function matchSpaceUrl(url: string): { roomId: string } | null {
  const m = url.match(SPACE_URL_RE);
  if (!m) return null;
  return { roomId: m[1] };
}

export function extractSpaceUrl(text: string): string | undefined {
  const matches = [...text.matchAll(SPACE_URL_IN_TEXT_RE)];
  return matches.at(-1)?.[0];
}

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    bgSecondary: isDark ? '#1f1f1f' : '#f6f6f6',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    actionPrimary: ACTION_PRIMARY,
    danger: RED,
  };
}

/**
 * Cast-embed renderer for a Farcaster Space URL — replaces the generic OG
 * card with a "Join Live Space" widget that pulls live state from the API.
 */
const SpaceEmbedAttachment: React.FC<{
  height?: number;
  url: string;
  width?: number;
}> = React.memo(({ height, url, width }) => {
  const c = useColors();
  const push = usePush();
  const match = useMemo(() => matchSpaceUrl(url), [url]);
  const {
    data: room,
    error: roomError,
    isFetching: isFetchingRoom,
    isLoading: isLoadingRoom,
  } = useAudioRoom({
    roomId: match?.roomId ?? '',
    enabled: !!match,
  });

  if (!match) return null;

  const onPress = () => push('SpaceRoom', { roomId: match.roomId });
  const reservedSize = {
    ...(typeof height === 'number'
      ? { height }
      : { height: SPACE_EMBED_FEED_HEIGHT }),
    ...(typeof width === 'number' ? { width } : {}),
  };

  if (!room) {
    const shouldShowLoadingIndicator =
      !roomError && (isLoadingRoom || isFetchingRoom);

    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.skeleton,
          reservedSize,
          { backgroundColor: c.bgSecondary, borderColor: c.border },
        ]}
      >
        <Octicons name="unmute" size={16} color={c.actionPrimary} />
        <View style={styles.skeletonTextContainer}>
          <Text style={[styles.skeletonText, { color: c.fg }]}>
            Farcaster Space
          </Text>
          {!shouldShowLoadingIndicator && (
            <Text style={[styles.unavailableText, { color: c.fgFaint }]}>
              Space unavailable · Tap to open
            </Text>
          )}
        </View>
        {shouldShowLoadingIndicator && (
          <ActivityIndicator testID="space-embed-loading" size="small" />
        )}
      </Pressable>
    );
  }

  const isLive = room.state === 'live';
  const isScheduled = room.state === 'scheduled';
  const isEnded = room.state === 'ended';
  const hasPlayback = Boolean(
    isEnded && room.recording?.status === 'ready' && room.recording.playbackUrl,
  );

  const scheduledLabel = (() => {
    if (!room.scheduledAt) return null;
    const date = new Date(room.scheduledAt);
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
  })();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        reservedSize,
        {
          backgroundColor: isLive ? 'rgba(124, 101, 193, 0.08)' : c.bgSecondary,
          borderColor: isLive ? c.actionPrimary : c.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {isLive ? (
          <View style={[styles.badge, { backgroundColor: c.danger }]}>
            <PulsingDot size={5} color="white" />
            <Text style={styles.badgeTextLight}>LIVE</Text>
          </View>
        ) : isScheduled ? (
          <View style={[styles.badge, { backgroundColor: c.actionPrimary }]}>
            <Text style={styles.badgeTextLight}>SCHEDULED</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: c.bgSecondary }]}>
            <Text style={[styles.badgeText, { color: c.fgFaint }]}>ENDED</Text>
          </View>
        )}
        <Text numberOfLines={1} style={[styles.kicker, { color: c.fgFaint }]}>
          Space
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.title,
          { color: c.fg },
          isEnded ? styles.endedContent : null,
        ]}
      >
        {room.title}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.hostRow, isEnded ? styles.endedContent : null]}>
          <Avatar pfpUrl={room.host.pfp?.url} diameter={28} />
          <View style={styles.hostTextColumn}>
            <SpaceUserDisplayNameWithProBadge
              user={room.host}
              badgeSize={12}
              containerStyle={styles.hostNameRow}
              textStyle={[styles.hostName, { color: c.fg }]}
              suffix=" · hosting"
              suffixTextStyle={[styles.hostSuffix, { color: c.fgFaint }]}
            />
            <Text
              numberOfLines={1}
              style={[styles.hostMeta, { color: c.fgFaint }]}
            >
              {isLive
                ? `${room.listenerCount.toLocaleString()} listening`
                : isScheduled && scheduledLabel
                  ? scheduledLabel
                  : 'Audio Space'}
            </Text>
          </View>
        </View>

        {(!isEnded || hasPlayback) && (
          <View style={[styles.cta, { backgroundColor: c.actionPrimary }]}>
            <Octicons
              name={hasPlayback ? 'play' : 'unmute'}
              size={12}
              color="white"
            />
            <Text style={styles.ctaText}>
              {isLive ? 'Join' : hasPlayback ? 'Play' : 'Open'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

SpaceEmbedAttachment.displayName = 'SpaceEmbedAttachment';

const styles = StyleSheet.create({
  card: {
    maxWidth: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  skeleton: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  skeletonText: { fontSize: 14, fontWeight: '500' },
  skeletonTextContainer: { flex: 1, minWidth: 0 },
  unavailableText: { fontSize: 12, marginTop: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    minWidth: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeTextLight: { color: 'white', fontSize: 10, fontWeight: '700' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  kicker: { flex: 1, minWidth: 0, fontSize: 12 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  hostRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  hostTextColumn: { flex: 1, minWidth: 0, marginLeft: 8 },
  hostNameRow: { maxWidth: '100%' },
  hostName: { fontSize: 13, fontWeight: '500' },
  hostSuffix: { fontSize: 13, fontWeight: '400' },
  hostMeta: { fontSize: 12, marginTop: 1 },
  endedContent: { opacity: 0.55 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 13 },
});

export { SpaceEmbedAttachment };
