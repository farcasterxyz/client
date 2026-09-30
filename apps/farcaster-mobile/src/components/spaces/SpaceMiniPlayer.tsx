import { Octicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { Avatar } from '~/components/Avatar';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { PulsingDot } from '~/components/spaces/PulsingDot';
import { Text } from '~/components/Text';
import {
  formatElapsed,
  useSpace,
  useSpaceElapsedSec,
} from '~/contexts/SpaceContext';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { navigationRef } from '~/navigation/navigationRef';

const ACTION_PRIMARY = '#7c65c1';
const RED = '#dc3412';

const isDrawerOpenInState = (state: unknown): boolean => {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const typedState = state as {
    type?: string;
    default?: 'open' | 'closed';
    history?: Array<{ type?: string; status?: 'open' | 'closed' }>;
    routes?: Array<{ state?: unknown }>;
  };

  if (typedState.type === 'drawer') {
    let status: 'open' | 'closed' | undefined;
    const history = typedState.history;

    if (history) {
      for (let i = history.length - 1; i >= 0; i -= 1) {
        if (history[i]?.type === 'drawer') {
          status = history[i].status;
          break;
        }
      }
    }

    status = status ?? typedState.default ?? 'closed';

    if (status === 'open') {
      return true;
    }
  }

  return !!typedState.routes?.some((route) => isDrawerOpenInState(route.state));
};

type SpaceMiniPlayerRoute = {
  name: string;
  params?: { roomId?: string };
};

function useSpaceMiniPlayerRouteState(): {
  currentRoute: SpaceMiniPlayerRoute | undefined;
  isDrawerOpen: boolean;
} {
  const [currentRoute, setCurrentRoute] = useState<
    SpaceMiniPlayerRoute | undefined
  >(() => {
    if (!navigationRef.isReady()) return undefined;
    const r = navigationRef.getCurrentRoute();
    return r
      ? { name: r.name, params: r.params as { roomId?: string } | undefined }
      : undefined;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const update = (): void => {
      if (cancelled) return;
      if (!navigationRef.isReady()) {
        retryTimer = setTimeout(update, 100);
        return;
      }
      const r = navigationRef.getCurrentRoute();
      const rootState = navigationRef.getRootState();
      setCurrentRoute(
        r
          ? {
              name: r.name,
              params: r.params as { roomId?: string } | undefined,
            }
          : undefined,
      );
      setIsDrawerOpen(isDrawerOpenInState(rootState));
    };

    update();
    const unsubscribe = navigationRef.addListener('state', update);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe();
    };
  }, []);

  return { currentRoute, isDrawerOpen };
}

/** Whether the docked Space mini-player should occupy tab chrome (and spacers). */
function useShouldShowSpaceMiniPlayer(): boolean {
  const { joined, removedByHostRoomId } = useSpace();
  const { currentRoute, isDrawerOpen } = useSpaceMiniPlayerRouteState();

  if (!joined) {
    return false;
  }
  if (removedByHostRoomId) {
    return false;
  }
  if (isDrawerOpen) {
    return false;
  }
  if (
    currentRoute?.name === 'SpaceRoom' &&
    currentRoute.params?.roomId === joined.room.id
  ) {
    return false;
  }
  return true;
}

/** Visual height of the docked Space mini player row (matches MiniAppBar). */
export const MINI_PLAYER_HEIGHT = 56;

/**
 * Docked mini bar while a Space is joined — rendered in BottomTabBar chrome
 * above the tab icons. Hidden on the matching SpaceRoom and when the drawer
 * is open. Tapping reopens the room.
 */
const SpaceMiniPlayer: React.FC = memo(() => {
  const {
    joined,
    participantCount,
    toggleMute,
    leave,
    endRoom,
    removedByHostRoomId,
  } = useSpace();
  const elapsedSec = useSpaceElapsedSec();
  const push = usePush();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isHostProUser = useUserLevel(joined?.room.host) === 'pro';

  const handleOpen = useCallback(() => {
    if (!joined) return;
    push('SpaceRoom', { roomId: joined.room.id });
  }, [joined, push]);

  const handleDismiss = useCallback(async () => {
    if (joined?.role === 'host') {
      Alert.alert('End Space?', 'This will end the Space for everyone.', [
        { text: 'Keep Space', style: 'cancel' },
        {
          text: 'End Space',
          style: 'destructive',
          onPress: () => {
            void endRoom();
          },
        },
      ]);
      return;
    }
    await leave();
  }, [endRoom, joined?.role, leave]);

  const handleMute = useCallback(async () => {
    await toggleMute();
  }, [toggleMute]);

  if (!joined || removedByHostRoomId) {
    return null;
  }

  const { room, muted, role } = joined;
  const canSpeak = role === 'host' || role === 'cohost' || role === 'speaker';
  const listenerCount =
    participantCount > 0 ? participantCount : room.listenerCount;

  const bg = isDark ? '#1f1f1f' : '#ffffff';
  const fg = isDark ? '#ffffff' : '#121212';
  const fgFaint = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const bgSecondary = isDark ? '#2a2a2a' : '#f2f2f2';

  return (
    <View
      style={[
        styles.dockedOuter,
        Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
      ]}
    >
      <View
        style={[styles.container, { backgroundColor: bg, borderColor: border }]}
      >
        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [
            styles.titleArea,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.avatarWrap}>
            <Avatar pfpUrl={room.host.pfp?.url} diameter={32} />
            {isHostProUser && (
              <FarcasterProBadge size={12} showBorder style={styles.proBadge} />
            )}
            <View style={[styles.liveDotWrap, { borderColor: bg }]}>
              <PulsingDot size={8} color={RED} />
            </View>
          </View>
          <View style={styles.titleTextWrap}>
            <Text numberOfLines={1} style={[styles.title, { color: fg }]}>
              {room.title || 'Space'}
            </Text>
            <Text
              style={[styles.subtitle, { color: fgFaint }]}
              numberOfLines={1}
            >
              Live · {formatElapsed(elapsedSec)} ·{' '}
              {listenerCount.toLocaleString()}
            </Text>
          </View>
        </Pressable>

        {canSpeak && (
          <Pressable
            onPress={handleMute}
            hitSlop={8}
            style={[
              styles.iconButton,
              {
                backgroundColor: muted ? bgSecondary : ACTION_PRIMARY,
              },
            ]}
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
          >
            <Octicons
              name={muted ? 'mute' : 'unmute'}
              size={16}
              color={muted ? fg : 'white'}
            />
          </Pressable>
        )}

        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          style={[styles.iconButton, { backgroundColor: bgSecondary }]}
          accessibilityLabel={role === 'host' ? 'End Space' : 'Leave Space'}
        >
          <Octicons name="x" size={16} color={fg} />
        </Pressable>
      </View>
    </View>
  );
});

SpaceMiniPlayer.displayName = 'SpaceMiniPlayer';

const styles = StyleSheet.create({
  dockedOuter: {
    height: MINI_PLAYER_HEIGHT,
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 12,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  avatarWrap: { position: 'relative' },
  proBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  liveDotWrap: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 11, marginTop: 1 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { SpaceMiniPlayer, useShouldShowSpaceMiniPlayer };
