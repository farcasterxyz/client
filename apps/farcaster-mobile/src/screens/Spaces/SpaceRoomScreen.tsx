import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  ApiAudioRoom,
  ApiAudioRoomParticipant,
  ApiAudioRoomReactionEmoji,
  ApiUser,
} from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  buildSpeakerSegmentIndex,
  canUseAudioRoomFallbackHostControls,
  createAudioSpaceTelemetryId,
  hasActiveSpeakerSegmentAt,
  normalizeAudioSpaceError,
  useAcceptSpeakerAudioRoom,
  useAudioRoom,
  useAudioRoomParticipants,
  useAudioRoomReaction,
  useCancelStageInviteAudioRoom,
  useEndAudioRoom,
  useModerateParticipantRoleAudioRoom,
  useRemoveParticipantAudioRoom,
  useRsvpAudioRoom,
  useStartScheduledAudioRoom,
} from 'farcaster-client-hooks';
import { getStandardizedAvatarUrl } from 'farcaster-expo';
import { ConnectionState } from 'livekit-client';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { ShareIcon } from '~/components/icons/ShareIcon';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { PulsingDot } from '~/components/spaces/PulsingDot';
import { SpaceEndedModal } from '~/components/spaces/SpaceEndedModal';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import {
  formatElapsed,
  useSpace,
  useSpaceElapsedSec,
} from '~/contexts/SpaceContext';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { EditSpaceBottomSheet } from '~/screens/Spaces/EditSpaceBottomSheet';
import { SpaceShareSheet } from '~/screens/Spaces/InviteToSpaceSheet';
import { InviteToStageSheet } from '~/screens/Spaces/InviteToStageSheet';
import { LiveControls } from '~/screens/Spaces/LiveControls';
import {
  SpaceChatComposer,
  SpaceChatPanel,
  SpaceChatProvider,
} from '~/screens/Spaces/SpaceChatPanel';
import { StageInvitePrompt } from '~/screens/Spaces/StageInvitePrompt';
import { TipSpeakersSheet } from '~/screens/Spaces/TipSpeakersSheet';
import { UserProfileSheet } from '~/screens/Spaces/UserProfileSheet';
import { CommonStackParamList } from '~/types/navigation';
import {
  captureMobileAudioSpacePerfMetric,
  trackMobileAudioSpaceEvent,
} from '~/utils/AudioSpaceInstrumentation';

const ACTION_PRIMARY = '#7c65c1';
const RED = '#dc3412';
const LIVE_CONTROLS_TOP_PADDING = 12;
// SpaceRoom sits above the tab bar, which already consumes the home-indicator
// safe area — avoid adding insets.bottom again or a large minimum padding.
const LIVE_CONTROLS_BOTTOM_PADDING = 8;
const LIVE_BOTTOM_BAR_HEIGHT_FALLBACK = 68;
const LIVE_COMPOSER_KEYBOARD_OVERLAP = 85;
const ANDROID_LIVE_COMPOSER_KEYBOARD_OVERLAP = 64;
const SPACE_ROOM_SCROLL_BOTTOM_SPACER_HEIGHT = 24;
const PLAYBACK_TRACK_HIT_HEIGHT = 28;
const PLAYBACK_ACCESSIBILITY_SEEK_STEP_SECONDS = 15;
const INITIAL_LISTENER_LIMIT = 24;
const MAX_RENDERED_LISTENERS = 160;
const LOCAL_REACTION_TTL_MS = 2800;
const MAX_LOCAL_FLOATING_REACTIONS = 120;
const SPACE_ROOM_HORIZONTAL_PADDING = 16;
const SPACE_PARTICIPANT_GRID_GAP = 16;
const SPEAKER_TILE_MIN_WIDTH = 88;
const LISTENER_TILE_MIN_WIDTH = 96;
const SPEAKER_AVATAR_DIAMETER = 64;
const ENDED_PARTICIPANT_AVATAR_DIAMETER = 36;
const SPEAKER_RING_PADDING = 2;
const SPEAKER_RING_BORDER = 3;
const SPEAKER_AVATAR_FRAME_SIZE =
  SPEAKER_AVATAR_DIAMETER + 2 * (SPEAKER_RING_PADDING + SPEAKER_RING_BORDER);
/** Pulse ring extends 4px beyond the avatar frame on each side. */
const SPEAKER_AVATAR_WRAP_SIZE = SPEAKER_AVATAR_FRAME_SIZE + 8;
const ENDED_PARTICIPANT_AVATAR_FRAME_SIZE =
  ENDED_PARTICIPANT_AVATAR_DIAMETER +
  2 * (SPEAKER_RING_PADDING + SPEAKER_RING_BORDER);
const ENDED_PARTICIPANT_AVATAR_WRAP_SIZE =
  ENDED_PARTICIPANT_AVATAR_FRAME_SIZE + 8;
const WRPCDN_IMAGE_PREFIX = 'https://wrpcd.net/cdn-cgi/image/';
const WRPCDN_IMAGE_DELIVERY_PREFIX = 'https://wrpcd.net/cdn-cgi/imagedelivery/';
const CLOUDFLARE_GRAYSCALE_OPTION = 'saturation=0';

const addCloudflareGrayscaleOption = (url: string) => {
  if (url.includes(CLOUDFLARE_GRAYSCALE_OPTION)) {
    return url;
  }

  if (url.startsWith(WRPCDN_IMAGE_PREFIX)) {
    const rest = url.slice(WRPCDN_IMAGE_PREFIX.length);
    const sourceStartIndex = rest.indexOf('/');
    if (sourceStartIndex === -1) {
      return url;
    }

    return `${WRPCDN_IMAGE_PREFIX}${rest.slice(
      0,
      sourceStartIndex,
    )},${CLOUDFLARE_GRAYSCALE_OPTION}${rest.slice(sourceStartIndex)}`;
  }

  if (url.startsWith(WRPCDN_IMAGE_DELIVERY_PREFIX)) {
    const variantStartIndex = url.lastIndexOf('/');
    if (variantStartIndex === -1) {
      return url;
    }

    const variant = url.slice(variantStartIndex + 1);
    if (!variant.includes('=')) {
      return url;
    }

    return `${url.slice(
      0,
      variantStartIndex + 1,
    )}${variant},${CLOUDFLARE_GRAYSCALE_OPTION}`;
  }

  return url;
};

const getIosOfflineAvatarUrl = (pfpUrl?: string) => {
  if (!pfpUrl) {
    return undefined;
  }

  return addCloudflareGrayscaleOption(
    getStandardizedAvatarUrl({ url: pfpUrl, size: 'default' }),
  );
};

function getResponsiveGridItemWidth({
  availableWidth,
  minWidth,
  gap,
}: {
  availableWidth: number;
  minWidth: number;
  gap: number;
}) {
  if (availableWidth <= 0 || availableWidth < minWidth) {
    return minWidth;
  }
  const columnCount = Math.max(
    1,
    Math.floor((availableWidth + gap) / (minWidth + gap)),
  );
  return Math.floor((availableWidth - gap * (columnCount - 1)) / columnCount);
}

function formatSpaceEndedAt(value?: string) {
  if (!value) return 'Ended';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ended';

  return `Ended ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} at ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  return formatElapsed(Math.floor(seconds));
}

function audioRoomRoleLabel(role: ApiAudioRoomParticipant['role']) {
  if (role === 'cohost') return 'Co-host';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

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

type SpaceRoomScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'SpaceRoom'
>;

const SpaceRoomScreen = buildScreen<SpaceRoomScreenProps>(
  { name: 'SpaceRoom', insetTop: true },
  ({
    route: {
      params: { roomId, autoStartScheduled },
    },
  }) => {
    return (
      <RetryableErrorBoundary>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <SpaceRoomInner
            roomId={roomId}
            autoStartScheduled={autoStartScheduled}
          />
        </Suspense>
      </RetryableErrorBoundary>
    );
  },
);

SpaceRoomScreen.displayName = 'SpaceRoomScreen';

function SpaceRoomInner({
  roomId,
  autoStartScheduled,
}: {
  roomId: string;
  autoStartScheduled?: boolean;
}) {
  const c = useColors();
  const goBack = useGoBack();
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
    refetch: refetchRoom,
  } = useAudioRoom({ roomId });

  if (isLoadingRoom && !room) {
    return <FullScreenLoadingIndicator />;
  }

  if (roomError || !room) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: c.bg }]}>
        <Text style={[styles.errorTitle, { color: c.fg }]}>
          Space unavailable
        </Text>
        <Text style={[styles.errorBody, { color: c.fgFaint }]}>
          {roomError instanceof Error
            ? roomError.message
            : 'This Space could not be loaded.'}
        </Text>
        <Pressable
          onPress={() => refetchRoom()}
          style={[styles.retryButton, { backgroundColor: c.actionPrimary }]}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
        <Pressable onPress={goBack} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: c.fgFaint }]}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  if (room.state === 'scheduled') {
    return (
      <ScheduledSpaceRoom
        room={room}
        roomId={roomId}
        autoStartScheduled={autoStartScheduled}
      />
    );
  }

  if (room.state === 'ended') {
    return (
      <EndedSpaceRoom room={room} roomId={roomId} refetchRoom={refetchRoom} />
    );
  }

  return <LiveSpaceRoom room={room} roomId={roomId} />;
}

// Isolated component so only the timer text re-renders on every 1-second tick,
// not the entire LiveSpaceRoom tree.
function SpaceElapsedDisplay({ fgFaint }: { fgFaint: string }) {
  const elapsed = useSpaceElapsedSec();
  return (
    <Text style={[styles.elapsedText, { color: fgFaint }]}>
      {formatElapsed(elapsed)}
    </Text>
  );
}

function EndedSpaceRoom({
  room,
  roomId,
  refetchRoom,
}: {
  room: ApiAudioRoom;
  roomId: string;
  refetchRoom: () => unknown;
}) {
  const c = useColors();
  const goBack = useGoBack();
  const pushToUserProfile = usePushToUserProfile();
  const { leave, endedReason } = useSpace();
  const effectiveEndedReason = room.endedReason ?? endedReason;
  const recording = room.recording;
  const recordingReady =
    recording?.status === 'ready' && Boolean(recording.playbackUrl);
  const recordingPending =
    recording?.status === 'pending' ||
    recording?.status === 'recording' ||
    recording?.status === 'processing';
  const player = useAudioPlayer(recordingReady ? recording.playbackUrl : null, {
    updateInterval: 500,
  });
  const playbackStatus = useAudioPlayerStatus(player);
  const [playbackTrackWidth, setPlaybackTrackWidth] = useState(0);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);
  const [playbackAction, setPlaybackAction] = useState<
    'idle' | 'starting' | 'seeking'
  >('idle');
  const playbackFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const { data: participants, isLoading: isLoadingParticipants } =
    useAudioRoomParticipants({
      roomId,
      includePast: true,
    });

  useEffect(() => {
    leave().catch(() => {});
  }, [leave]);

  useEffect(() => {
    if (!recordingPending) return;

    const interval = setInterval(() => {
      refetchRoom();
    }, 5000);

    return () => clearInterval(interval);
  }, [recordingPending, refetchRoom]);

  useEffect(() => {
    return () => {
      if (playbackFeedbackTimerRef.current) {
        clearTimeout(playbackFeedbackTimerRef.current);
      }
    };
  }, []);

  const clearPlaybackFeedbackSoon = useCallback(() => {
    if (playbackFeedbackTimerRef.current) {
      clearTimeout(playbackFeedbackTimerRef.current);
    }

    playbackFeedbackTimerRef.current = setTimeout(() => {
      setPendingSeekTime(null);
      setPlaybackAction('idle');
      playbackFeedbackTimerRef.current = null;
    }, 650);
  }, []);

  const playbackMessage = useMemo(() => {
    if (recordingReady) {
      return null;
    }

    if (recordingPending) {
      return 'Recording is processing. Playback will appear here when it is ready.';
    }

    if (effectiveEndedReason === 'host_silence') {
      return 'This Space ended automatically before a recording was available.';
    }

    return 'Recording is unavailable for this Space.';
  }, [effectiveEndedReason, recordingPending, recordingReady]);
  const playbackUnavailableTitle = recordingPending
    ? 'Preparing recording'
    : 'Recording unavailable';

  const joinedParticipants = useMemo(() => {
    if (participants && participants.length > 0) return participants;

    return [
      {
        user: room.host,
        role: 'host' as const,
        handRaised: false,
        joinedAt: room.createdAt,
      },
    ];
  }, [participants, room.createdAt, room.host]);

  const displayedPlaybackTime = pendingSeekTime ?? playbackStatus.currentTime;
  const speakerSegmentsByFid = useMemo(
    () => buildSpeakerSegmentIndex(recording?.speakerSegments),
    [recording?.speakerSegments],
  );
  const activeRecordingSpeakerFids = useMemo(() => {
    const playbackMs = Math.floor(displayedPlaybackTime * 1000);
    const fids = new Set<number>();
    for (const [fid, segments] of speakerSegmentsByFid) {
      if (hasActiveSpeakerSegmentAt(segments, playbackMs)) {
        fids.add(fid);
      }
    }
    return fids;
  }, [displayedPlaybackTime, speakerSegmentsByFid]);
  const playbackProgressPercent =
    playbackStatus.duration > 0
      ? Math.min(
          100,
          Math.max(0, (displayedPlaybackTime / playbackStatus.duration) * 100),
        )
      : 0;
  const isPlaybackFinished =
    playbackStatus.didJustFinish ||
    (playbackStatus.duration > 0 &&
      playbackStatus.currentTime >= playbackStatus.duration - 0.25);

  const togglePlayback = useCallback(async () => {
    if (!recordingReady) return;

    if (playbackStatus.playing) {
      player.pause();
      setPlaybackAction('idle');
      return;
    }

    setPlaybackAction('starting');

    if (isPlaybackFinished) {
      await player.seekTo(0).catch(() => {});
      setPendingSeekTime(null);
    }

    player.play();
    clearPlaybackFeedbackSoon();
  }, [
    clearPlaybackFeedbackSoon,
    isPlaybackFinished,
    player,
    playbackStatus.playing,
    recordingReady,
  ]);

  const seekPlaybackToTime = useCallback(
    (seekTime: number) => {
      if (!recordingReady || playbackStatus.duration <= 0) {
        return;
      }

      const clampedSeekTime = Math.max(
        0,
        Math.min(seekTime, playbackStatus.duration),
      );
      setPendingSeekTime(clampedSeekTime);
      setPlaybackAction('seeking');
      void player
        .seekTo(clampedSeekTime)
        .catch(() => {})
        .finally(clearPlaybackFeedbackSoon);
    },
    [
      clearPlaybackFeedbackSoon,
      player,
      playbackStatus.duration,
      recordingReady,
    ],
  );

  const seekPlayback = useCallback(
    (locationX: number) => {
      if (playbackTrackWidth <= 0 || playbackStatus.duration <= 0) {
        return;
      }

      const clampedX = Math.max(0, Math.min(locationX, playbackTrackWidth));
      seekPlaybackToTime(
        (clampedX / playbackTrackWidth) * playbackStatus.duration,
      );
    },
    [playbackStatus.duration, playbackTrackWidth, seekPlaybackToTime],
  );

  const adjustPlaybackSeek = useCallback(
    (direction: 'forward' | 'backward') => {
      const step =
        direction === 'forward'
          ? PLAYBACK_ACCESSIBILITY_SEEK_STEP_SECONDS
          : -PLAYBACK_ACCESSIBILITY_SEEK_STEP_SECONDS;
      seekPlaybackToTime(displayedPlaybackTime + step);
    },
    [displayedPlaybackTime, seekPlaybackToTime],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: c.border, backgroundColor: c.bg },
        ]}
      >
        <Pressable onPress={goBack} style={styles.iconButton}>
          <Octicons name="chevron-left" size={22} color={c.fg} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.endedBadge, { backgroundColor: c.bgSecondary }]}>
            <Octicons name="play" size={11} color={c.fgFaint} />
            <Text style={[styles.endedBadgeText, { color: c.fgFaint }]}>
              Playback
            </Text>
          </View>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.endedScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: c.fg }]}>{room.title}</Text>
        {room.description ? (
          <Text style={[styles.endedDescription, { color: c.fgFaint }]}>
            {room.description}
          </Text>
        ) : null}
        <Text style={[styles.metaText, { color: c.fgFaint }]}>
          {formatSpaceEndedAt(room.endedAt)}
        </Text>

        <Pressable
          onPress={() => pushToUserProfile({ fid: room.host.fid })}
          style={[styles.endedHostRow, { borderColor: c.border }]}
        >
          <Avatar pfpUrl={room.host.pfp?.url} diameter={40} />
          <View style={styles.endedHostText}>
            <Text style={[styles.hostCardLabel, { color: c.fgFaint }]}>
              HOST
            </Text>
            <SpaceUserDisplayNameWithProBadge
              user={room.host}
              badgeSize={13}
              containerStyle={styles.actionsNameRow}
              textStyle={[styles.hostName, { color: c.fg }]}
            />
            <Text
              style={[styles.hostUsername, { color: c.fgFaint }]}
              numberOfLines={1}
            >
              @{room.host.username}
            </Text>
          </View>
          <Octicons name="chevron-right" size={14} color={c.fgFaint} />
        </Pressable>

        <View
          style={[
            styles.playbackPanel,
            { backgroundColor: c.bgSecondary, borderColor: c.border },
          ]}
        >
          {recordingReady ? (
            <>
              <View style={styles.playbackRow}>
                <Pressable
                  onPress={togglePlayback}
                  style={[
                    styles.playbackButton,
                    { backgroundColor: c.actionPrimary },
                  ]}
                  accessibilityLabel={
                    playbackStatus.playing
                      ? 'Pause recording'
                      : isPlaybackFinished
                        ? 'Replay recording'
                        : 'Play recording'
                  }
                >
                  {playbackAction === 'starting' ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Octicons
                      name={playbackStatus.playing ? 'pause' : 'play'}
                      size={22}
                      color="white"
                    />
                  )}
                </Pressable>
                <View style={styles.playbackTimeWrap}>
                  <Text style={[styles.playbackTitle, { color: c.fg }]}>
                    Space recording
                  </Text>
                  <Text style={[styles.playbackTime, { color: c.fgFaint }]}>
                    {formatPlaybackTime(displayedPlaybackTime)} /{' '}
                    {formatPlaybackTime(playbackStatus.duration)}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Seek recording"
                accessibilityRole="adjustable"
                accessibilityActions={[
                  { name: 'increment', label: 'Forward 15 seconds' },
                  { name: 'decrement', label: 'Back 15 seconds' },
                ]}
                accessibilityValue={{
                  min: 0,
                  max: Math.max(0, Math.floor(playbackStatus.duration)),
                  now: Math.max(0, Math.floor(displayedPlaybackTime)),
                  text: `${formatPlaybackTime(
                    displayedPlaybackTime,
                  )} of ${formatPlaybackTime(playbackStatus.duration)}`,
                }}
                onLayout={(event) =>
                  setPlaybackTrackWidth(event.nativeEvent.layout.width)
                }
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === 'increment') {
                    adjustPlaybackSeek('forward');
                    return;
                  }

                  if (event.nativeEvent.actionName === 'decrement') {
                    adjustPlaybackSeek('backward');
                  }
                }}
                onPress={(event) => seekPlayback(event.nativeEvent.locationX)}
                style={styles.playbackSeekArea}
              >
                <View
                  style={[
                    styles.playbackTrack,
                    { backgroundColor: c.border || 'rgba(255,255,255,0.08)' },
                  ]}
                >
                  <View
                    style={[
                      styles.playbackProgress,
                      {
                        backgroundColor: c.actionPrimary,
                        width: `${playbackProgressPercent}%`,
                      },
                    ]}
                  />
                </View>
              </Pressable>
            </>
          ) : (
            <View style={styles.playbackUnavailableRow}>
              {recordingPending ? (
                <ActivityIndicator color={c.actionPrimary} />
              ) : (
                <Octicons name="alert" size={18} color={c.fgFaint} />
              )}
              <View style={styles.playbackUnavailableCopy}>
                <Text
                  style={[styles.playbackUnavailableTitle, { color: c.fg }]}
                >
                  {playbackUnavailableTitle}
                </Text>
                <Text
                  style={[styles.playbackUnavailableText, { color: c.fgFaint }]}
                >
                  {playbackMessage}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.sectionHeader, { color: c.fgFaint }]}>
          JOINED{' '}
          {isLoadingParticipants ? (
            <Text style={styles.sectionHint}>Loading</Text>
          ) : (
            <Text style={styles.sectionHint}>{joinedParticipants.length}</Text>
          )}
        </Text>
        <View style={styles.endedParticipantList}>
          {joinedParticipants.map((participant) => (
            <Pressable
              key={participant.user.fid}
              onPress={() => pushToUserProfile({ fid: participant.user.fid })}
              style={[
                styles.endedParticipantRow,
                { borderColor: c.border, backgroundColor: c.bg },
              ]}
            >
              <RecordingParticipantAvatar
                user={participant.user}
                speaking={activeRecordingSpeakerFids.has(participant.user.fid)}
              />
              <View style={styles.endedParticipantText}>
                <SpaceUserDisplayNameWithProBadge
                  user={participant.user}
                  badgeSize={12}
                  containerStyle={styles.actionsNameRow}
                  textStyle={[styles.actionsName, { color: c.fg }]}
                />
                <Text
                  style={[styles.actionsHandle, { color: c.fgFaint }]}
                  numberOfLines={1}
                >
                  @{participant.user.username}
                </Text>
              </View>
              <Text style={[styles.endedParticipantRole, { color: c.fgFaint }]}>
                {audioRoomRoleLabel(participant.role)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function LiveSpaceRoom({
  room,
  roomId,
}: {
  room: ApiAudioRoom;
  roomId: string;
}) {
  const c = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const goBack = useGoBack();
  const toast = useToast();
  const {
    joined,
    participantCount,
    connectionState,
    activeSpeakerFids,
    unmutedSpeakerFids,
    connectedParticipantFids,
    incomingReactions,
    micPermissionDenied,
    pendingStageInvite,
    removedByHostRoomId,
    endedReason,
    join,
    leave,
    endRoom,
    leaveStage,
    toggleMute,
    toggleHand,
    acceptStageInvite,
    declineStageInvite,
  } = useSpace();
  const sendReaction = useAudioRoomReaction();

  const hasJoinedRef = useRef(false);
  const telemetrySessionIdRef = useRef(
    createAudioSpaceTelemetryId('space_screen'),
  );
  const telemetryDedupeRef = useRef<Map<string, number>>(new Map());
  const renderCountRef = useRef(0);
  const renderSampleStartAtMsRef = useRef(Date.now());
  const lastReactionQueueSampleAtMsRef = useRef(0);
  const [joinFailed, setJoinFailed] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<ApiUser | null>(null);
  const [inviteHandRaised, setInviteHandRaised] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<ApiUser | null>(null);
  const [listenerDisplayLimit, setListenerDisplayLimit] = useState(
    INITIAL_LISTENER_LIMIT,
  );
  // Reset listener pagination when navigating between Spaces without unmount.
  useEffect(() => {
    setListenerDisplayLimit(INITIAL_LISTENER_LIMIT);
  }, [roomId]);
  useEffect(() => {
    renderCountRef.current = 0;
    renderSampleStartAtMsRef.current = Date.now();
    lastReactionQueueSampleAtMsRef.current = 0;
  }, [roomId]);
  const [speakerActionsTarget, setSpeakerActionsTarget] = useState<{
    user: ApiUser;
    role: 'host' | 'cohost' | 'speaker';
  } | null>(null);
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const [localFloatingReactions, setLocalFloatingReactions] = useState<
    { id: number; emoji: string; offset: number }[]
  >([]);
  const localReactionTimersRef = useRef<
    Map<number, ReturnType<typeof setTimeout>>
  >(new Map());

  const acceptSpeaker = useAcceptSpeakerAudioRoom();
  const moderateParticipantRole = useModerateParticipantRoleAudioRoom();
  const removeParticipant = useRemoveParticipantAudioRoom();
  const cancelStageInvite = useCancelStageInviteAudioRoom();
  const [isStageInviteSubmitting, setIsStageInviteSubmitting] = useState(false);
  const [showInactivityEndedModal, setShowInactivityEndedModal] =
    useState(false);
  const effectiveEndedReason = room.endedReason ?? endedReason;

  const clearLocalReactionTimers = useCallback(() => {
    for (const timer of localReactionTimersRef.current.values()) {
      clearTimeout(timer);
    }
    localReactionTimersRef.current.clear();
  }, []);

  const isInThisSpace = joined?.room.id === roomId;
  const isHost = joined?.role === 'host';
  const isHostOrCohost = isHost || joined?.role === 'cohost';
  const joinEntrySource = joined?.entrySource ?? 'spaces_list';

  useEffect(() => {
    if (!isInThisSpace) {
      setTipSheetOpen(false);
    }
  }, [isInThisSpace, roomId]);

  const trackAudioSpaceUiEvent = useCallback(
    (
      eventName: (typeof AUDIO_SPACE_EVENTS)[keyof typeof AUDIO_SPACE_EVENTS],
      properties?: Record<string, string | number | boolean | undefined>,
      dedupeKey?: string,
    ) => {
      trackMobileAudioSpaceEvent({
        eventName,
        context: {
          spaceSessionId:
            joined?.spaceSessionId ?? telemetrySessionIdRef.current,
          joinAttemptId:
            typeof properties?.joinAttemptId === 'string'
              ? properties.joinAttemptId
              : undefined,
          roomId,
          viewerFid: joined?.viewerFid,
          role: joined?.role,
          isHost: joined?.role === 'host',
          platform: 'mobile',
          entrySource: joined?.entrySource ?? 'unknown',
          connectionState,
          participantCount,
          audioPermissionState: micPermissionDenied ? 'denied' : 'unknown',
        },
        properties,
        dedupeMap: telemetryDedupeRef.current,
        dedupeKey,
      });
    },
    [
      connectionState,
      joined?.entrySource,
      joined?.role,
      joined?.spaceSessionId,
      joined?.viewerFid,
      micPermissionDenied,
      participantCount,
      roomId,
    ],
  );

  const { data: participants } = useAudioRoomParticipants({
    roomId,
    enabled: isInThisSpace,
  });
  const canUseFallbackHostControls = canUseAudioRoomFallbackHostControls({
    hostFid: room.hostFid,
    viewerFid: joined?.viewerFid,
    participants,
    connectedParticipantFids,
  });

  const { speakers, listeners, raisedHands } = useMemo(() => {
    if (!participants) {
      return {
        speakers: [
          {
            user: room.host,
            role: 'host' as const,
            handRaised: false,
            joinedAt: room.createdAt,
          },
        ],
        listeners: [],
        raisedHands: [],
      };
    }
    const s = participants.filter(
      (p) => p.role === 'host' || p.role === 'cohost' || p.role === 'speaker',
    );
    const l = participants.filter((p) => p.role === 'listener');
    const r = participants.filter((p) => p.handRaised);
    return { speakers: s, listeners: l, raisedHands: r };
  }, [participants, room]);
  const viewerRole = useMemo(() => {
    if (!joined) {
      return null;
    }
    return (
      participants?.find((p) => p.user.fid === joined.viewerFid)?.role ?? null
    );
  }, [participants, joined]);
  const effectiveIsHost =
    isHost || viewerRole === 'host' || joined?.viewerFid === room.hostFid;
  const effectiveIsHostOrCohost =
    isHostOrCohost || viewerRole === 'cohost' || effectiveIsHost;

  const visibleListeners = useMemo(
    () =>
      listeners.filter(
        (participant) =>
          !isInThisSpace || connectedParticipantFids.has(participant.user.fid),
      ),
    [listeners, isInThisSpace, connectedParticipantFids],
  );

  const displayedListeners = useMemo(
    () => visibleListeners.slice(0, listenerDisplayLimit),
    [listenerDisplayLimit, visibleListeners],
  );
  const maxVisibleListenerLimit = useMemo(
    () => Math.min(visibleListeners.length, MAX_RENDERED_LISTENERS),
    [visibleListeners.length],
  );
  const hasMoreListeners =
    listenerDisplayLimit < maxVisibleListenerLimit &&
    visibleListeners.length > listenerDisplayLimit;
  const isListenerRenderCapped =
    visibleListeners.length > MAX_RENDERED_LISTENERS &&
    listenerDisplayLimit >= MAX_RENDERED_LISTENERS;
  const avatarRenderableFids = useMemo(() => {
    const fids = new Set<number>();
    for (const participant of speakers) {
      fids.add(participant.user.fid);
    }
    for (const participant of visibleListeners) {
      fids.add(participant.user.fid);
    }
    for (const participant of raisedHands) {
      fids.add(participant.user.fid);
    }
    return fids;
  }, [speakers, visibleListeners, raisedHands]);
  const { remoteReactionsByFid, floatingLayerReactions } = useMemo(() => {
    const grouped = new Map<number, { id: number; emoji: string }[]>();
    const floating: typeof incomingReactions = [];
    const viewerFid = joined?.viewerFid;
    for (const reaction of incomingReactions) {
      if (!reaction.fid) {
        floating.push(reaction);
        continue;
      }
      if (reaction.fid === viewerFid) {
        continue;
      }
      if (!avatarRenderableFids.has(reaction.fid)) {
        // Fallback to floating reactions if participant tiles are stale.
        floating.push(reaction);
        continue;
      }
      if (!grouped.has(reaction.fid)) {
        grouped.set(reaction.fid, []);
      }
      grouped
        .get(reaction.fid)
        ?.push({ id: reaction.id, emoji: reaction.emoji });
    }
    return { remoteReactionsByFid: grouped, floatingLayerReactions: floating };
  }, [incomingReactions, joined?.viewerFid, avatarRenderableFids]);
  const pendingInviteInviterUser = useMemo(
    () =>
      pendingStageInvite
        ? participants?.find(
            (p) => p.user.fid === pendingStageInvite.inviterFid,
          )?.user
        : undefined,
    [participants, pendingStageInvite],
  );
  renderCountRef.current += 1;

  useEffect(() => {
    if (renderCountRef.current % 20 !== 0) {
      return;
    }
    captureMobileAudioSpacePerfMetric({
      metricName: 'audio_space_room_render_sample',
      properties: {
        roomId,
        renderCount: renderCountRef.current,
        msSinceSampleStart: Date.now() - renderSampleStartAtMsRef.current,
        speakersCount: speakers.length,
        listenersVisibleCount: visibleListeners.length,
        listenersRenderedCount: displayedListeners.length,
        reactionQueueSize: incomingReactions.length,
      },
    });
  });

  useEffect(() => {
    const now = Date.now();
    if (
      now - lastReactionQueueSampleAtMsRef.current < 2000 &&
      incomingReactions.length !== 0
    ) {
      return;
    }
    lastReactionQueueSampleAtMsRef.current = now;
    captureMobileAudioSpacePerfMetric({
      metricName: 'audio_space_reaction_queue_sample',
      properties: {
        roomId,
        queueSize: incomingReactions.length,
        isInThisSpace,
      },
    });
  }, [incomingReactions.length, isInThisSpace, roomId]);

  useEffect(() => {
    trackAudioSpaceUiEvent(
      AUDIO_SPACE_EVENTS.cardOpened,
      { roomId, openPath: 'space_room_screen' },
      `mobile-room-opened-${roomId}`,
    );
    trackAudioSpaceUiEvent(
      AUDIO_SPACE_EVENTS.openSource,
      { roomId, source: joined?.entrySource ?? 'unknown' },
      `mobile-open-source-${roomId}`,
    );
  }, [joined?.entrySource, roomId, trackAudioSpaceUiEvent]);

  useEffect(
    () => () => {
      clearLocalReactionTimers();
    },
    [clearLocalReactionTimers],
  );

  useEffect(() => {
    clearLocalReactionTimers();
    setLocalFloatingReactions([]);
  }, [clearLocalReactionTimers, roomId]);

  const addLocalFloatingReaction = useCallback(
    (emoji: ApiAudioRoomReactionEmoji) => {
      const id = Date.now() + Math.random();
      const reaction = { id, emoji, offset: Math.random() * 60 - 30 };
      setLocalFloatingReactions((prev) => {
        const next = [...prev, reaction];
        if (next.length <= MAX_LOCAL_FLOATING_REACTIONS) {
          return next;
        }
        const overflowCount = next.length - MAX_LOCAL_FLOATING_REACTIONS;
        const dropped = next.slice(0, overflowCount);
        for (const droppedReaction of dropped) {
          const droppedTimer = localReactionTimersRef.current.get(
            droppedReaction.id,
          );
          if (droppedTimer) {
            clearTimeout(droppedTimer);
            localReactionTimersRef.current.delete(droppedReaction.id);
          }
        }
        return next.slice(overflowCount);
      });
      const timer = setTimeout(() => {
        localReactionTimersRef.current.delete(id);
        setLocalFloatingReactions((prev) =>
          prev.filter((reaction) => reaction.id !== id),
        );
      }, LOCAL_REACTION_TTL_MS);
      localReactionTimersRef.current.set(id, timer);
    },
    [],
  );

  const openInvite = useCallback(
    (user: ApiUser, handRaised: boolean) => {
      if (!effectiveIsHostOrCohost) return;
      setInviteTarget(user);
      setInviteHandRaised(handRaised);
    },
    [effectiveIsHostOrCohost],
  );

  const handlePromoteCohost = useCallback(
    async (targetFid: number) => {
      try {
        await acceptSpeaker({ roomId, fid: targetFid, role: 'cohost' });
        toast.show('Promoted to co-host', { type: 'success' });
      } catch {
        toast.show('Failed to promote', { type: 'danger' });
      }
    },
    [acceptSpeaker, roomId, toast],
  );

  const handleMoveToSpeaker = useCallback(
    async (targetFid: number) => {
      try {
        await moderateParticipantRole({
          roomId,
          fid: targetFid,
          role: 'speaker',
        });
        toast.show('Moved to speaker', { type: 'success' });
      } catch {
        toast.show('Failed to move participant', { type: 'danger' });
      }
    },
    [moderateParticipantRole, roomId, toast],
  );

  const handleMoveToListener = useCallback(
    async (targetFid: number) => {
      try {
        await moderateParticipantRole({
          roomId,
          fid: targetFid,
          role: 'listener',
        });
        toast.show('Moved to listener', { type: 'success' });
      } catch {
        toast.show('Failed to demote', { type: 'danger' });
      }
    },
    [moderateParticipantRole, roomId, toast],
  );

  const handleRemoveParticipant = useCallback(
    async (targetFid: number) => {
      try {
        await removeParticipant({ roomId, fid: targetFid });
        toast.show('Removed from Space', { type: 'success' });
      } catch {
        toast.show('Failed to remove participant', { type: 'danger' });
      }
    },
    [removeParticipant, roomId, toast],
  );

  const handleCancelPendingInvite = useCallback(
    async (targetFid: number) => {
      try {
        await cancelStageInvite({ roomId, fid: targetFid });
        toast.show('Invite cancelled', { type: 'success' });
      } catch {
        toast.show('Failed to cancel invite', { type: 'danger' });
      }
    },
    [cancelStageInvite, roomId, toast],
  );

  const handleAcceptPendingInvite = useCallback(async () => {
    setIsStageInviteSubmitting(true);
    try {
      await acceptStageInvite();
      toast.show('Joined the stage', { type: 'success' });
    } catch {
      toast.show('Failed to accept invite', { type: 'danger' });
    } finally {
      setIsStageInviteSubmitting(false);
    }
  }, [acceptStageInvite, toast]);

  const handleDeclinePendingInvite = useCallback(async () => {
    setIsStageInviteSubmitting(true);
    try {
      await declineStageInvite();
      toast.show('Invite declined', { type: 'generic' });
    } catch {
      toast.show('Failed to decline invite', { type: 'danger' });
    } finally {
      setIsStageInviteSubmitting(false);
    }
  }, [declineStageInvite, toast]);

  const handleSendReaction = useCallback(
    (emoji: ApiAudioRoomReactionEmoji) => {
      addLocalFloatingReaction(emoji);
      sendReaction({ roomId, emoji })
        .then(() => {
          trackAudioSpaceUiEvent(
            AUDIO_SPACE_EVENTS.reactionSent,
            { emoji },
            `mobile-reaction-sent-${roomId}-${emoji}`,
          );
        })
        .catch((err) => {
          trackAudioSpaceUiEvent(AUDIO_SPACE_EVENTS.reactionSendFailed, {
            emoji,
            ...normalizeAudioSpaceError(err),
          });
        });
    },
    [addLocalFloatingReaction, sendReaction, roomId, trackAudioSpaceUiEvent],
  );

  const handleOpenInviteSheet = useCallback(() => {
    trackAudioSpaceUiEvent(
      AUDIO_SPACE_EVENTS.openSource,
      { source: 'space_invite_composer_opened' },
      `mobile-space-invite-open-${roomId}`,
    );
    setInviteSheetOpen(true);
  }, [roomId, trackAudioSpaceUiEvent]);

  const handleInviteSent = useCallback(
    (recipientCount: number) => {
      trackAudioSpaceUiEvent(AUDIO_SPACE_EVENTS.openSource, {
        source: 'space_invite_sent',
        recipientCount,
      });
    },
    [trackAudioSpaceUiEvent],
  );

  const handleCopySpaceLink = useCallback(() => {
    trackAudioSpaceUiEvent(AUDIO_SPACE_EVENTS.openSource, {
      source: 'space_share_copy_link',
    });
  }, [trackAudioSpaceUiEvent]);

  const handleShareSpaceLink = useCallback(() => {
    trackAudioSpaceUiEvent(AUDIO_SPACE_EVENTS.openSource, {
      source: 'space_share_native',
    });
  }, [trackAudioSpaceUiEvent]);

  useEffect(() => {
    hasJoinedRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || room.state === 'ended') return;

    if (removedByHostRoomId === roomId) return;

    if (isInThisSpace) {
      hasJoinedRef.current = true;
      return;
    }

    if (hasJoinedRef.current) return;

    hasJoinedRef.current = true;
    setIsJoining(true);
    setJoinFailed(false);
    join(roomId, joinEntrySource)
      .catch(() => {
        toast.show('Failed to join Space', { type: 'danger' });
        setJoinFailed(true);
      })
      .finally(() => setIsJoining(false));
  }, [
    roomId,
    removedByHostRoomId,
    isInThisSpace,
    room.state,
    join,
    joinEntrySource,
    toast,
  ]);

  useEffect(() => {
    if (room.state === 'ended' && effectiveEndedReason !== 'host_silence') {
      leave().catch(() => {});
      goBack();
    }
  }, [room.state, effectiveEndedReason, leave, goBack]);

  useEffect(() => {
    if (effectiveEndedReason === 'host_silence') {
      setShowInactivityEndedModal(true);
    }
  }, [effectiveEndedReason]);

  const handleManualJoin = useCallback(async () => {
    if (room.state === 'ended') {
      return;
    }
    setIsJoining(true);
    setJoinFailed(false);
    try {
      await join(roomId, joinEntrySource);
    } catch {
      toast.show('Failed to join Space', { type: 'danger' });
      setJoinFailed(true);
    } finally {
      setIsJoining(false);
    }
  }, [join, joinEntrySource, room.state, roomId, toast]);

  const handleLeave = useCallback(async () => {
    await leave();
    goBack();
  }, [leave, goBack]);

  const handleLeaveStage = useCallback(async () => {
    try {
      await leaveStage();
      toast.show('Left the stage', { type: 'success' });
    } catch {
      toast.show('Failed to leave stage', { type: 'danger' });
    }
  }, [leaveStage, toast]);

  const handleEnd = useCallback(async () => {
    await endRoom();
    goBack();
  }, [endRoom, goBack]);

  const listenerCount =
    participantCount > 0 ? participantCount : room.listenerCount;
  const participantGridWidth = useMemo(
    () => Math.max(screenWidth - SPACE_ROOM_HORIZONTAL_PADDING * 2, 0),
    [screenWidth],
  );
  const speakerTileWidth = useMemo(
    () =>
      getResponsiveGridItemWidth({
        availableWidth: participantGridWidth,
        minWidth: SPEAKER_TILE_MIN_WIDTH,
        gap: SPACE_PARTICIPANT_GRID_GAP,
      }),
    [participantGridWidth],
  );
  const listenerTileWidth = useMemo(
    () =>
      getResponsiveGridItemWidth({
        availableWidth: participantGridWidth,
        minWidth: LISTENER_TILE_MIN_WIDTH,
        gap: SPACE_PARTICIPANT_GRID_GAP,
      }),
    [participantGridWidth],
  );

  const [bottomBarHeight, setBottomBarHeight] = useState(
    LIVE_BOTTOM_BAR_HEIGHT_FALLBACK,
  );
  const { isVisible: isKeyboardVisible, keyboardHeight } =
    useKeyboardVisibility();
  const scrollBottomSpacerHeight = isKeyboardVisible
    ? keyboardHeight + SPACE_ROOM_SCROLL_BOTTOM_SPACER_HEIGHT
    : SPACE_ROOM_SCROLL_BOTTOM_SPACER_HEIGHT;
  const liveComposerKeyboardOpenedOffset =
    Platform.OS === 'android'
      ? bottomBarHeight + ANDROID_LIVE_COMPOSER_KEYBOARD_OVERLAP
      : bottomBarHeight + LIVE_COMPOSER_KEYBOARD_OVERLAP;

  return (
    <SpaceChatProvider>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { borderColor: c.border }]}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.iconButton}>
            <Octicons name="chevron-left" size={20} color={c.fg} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.liveBadge, { backgroundColor: c.danger }]}>
              <PulsingDot size={6} color="white" />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            {room.recordingEnabled && (
              <View style={styles.recordingBadge}>
                <View style={styles.recordingBadgeDot} />
                <Text style={styles.recordingBadgeText}>RECORDING</Text>
              </View>
            )}
            {isInThisSpace && <SpaceElapsedDisplay fgFaint={c.fgFaint} />}
          </View>
          <Pressable
            onPress={handleOpenInviteSheet}
            hitSlop={12}
            style={styles.iconButton}
            accessibilityLabel="Share Space"
          >
            <ShareIcon size={18} color={c.fg} />
          </Pressable>
        </View>

        {connectionState === ConnectionState.Reconnecting && (
          <View style={styles.reconnectingBanner}>
            <Text style={styles.reconnectingText}>Reconnecting…</Text>
          </View>
        )}

        {micPermissionDenied && isInThisSpace && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              Microphone access denied. Enable it in settings to speak.
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.flex1}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, styles.titleFlex, { color: c.fg }]}>
              {room.title}
            </Text>
            {effectiveIsHost && (
              <Pressable
                onPress={() => setEditOpen(true)}
                hitSlop={8}
                style={styles.renameButton}
                accessibilityLabel="Edit Space"
              >
                <Octicons name="pencil" size={14} color={c.fgFaint} />
              </Pressable>
            )}
          </View>
          {!!room.description && (
            <Text style={[styles.metaText, { color: c.fgFaint }]}>
              {room.description}
            </Text>
          )}
          <Text style={[styles.metaText, { color: c.fgFaint }]}>
            {listenerCount.toLocaleString()} listening
          </Text>

          {room.state !== 'ended' && !isInThisSpace && !isJoining && (
            <Pressable
              onPress={handleManualJoin}
              style={[styles.joinButton, { backgroundColor: c.actionPrimary }]}
            >
              <Octicons name="unmute" size={14} color="white" />
              <Text style={styles.joinButtonText}>
                {joinFailed ? 'Try joining again' : 'Join this Space'}
              </Text>
            </Pressable>
          )}

          {room.state !== 'ended' && isJoining && !isInThisSpace && (
            <View style={styles.joiningBox}>
              <ActivityIndicator />
            </View>
          )}

          <View style={styles.speakersHeaderRow}>
            <Text style={[styles.sectionHeader, { color: c.fgFaint }]}>
              SPEAKERS · {speakers.length}
            </Text>
            {isInThisSpace && (
              <Pressable
                onPress={() => setTipSheetOpen(true)}
                style={[styles.tipButton, { backgroundColor: c.actionPrimary }]}
              >
                <Octicons name="zap" size={11} color="white" />
                <Text style={styles.tipButtonText}>Tip</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.gridContainer}>
            {speakers.map((p) => {
              const speakerRole = p.role as 'host' | 'cohost' | 'speaker';
              const isSelfSpeaker =
                speakerRole === 'speaker' && p.user.fid === joined?.viewerFid;
              const tappable =
                isSelfSpeaker ||
                (effectiveIsHostOrCohost &&
                  speakerRole !== 'host' &&
                  p.user.fid !== room.hostFid);
              const isOffline =
                isInThisSpace && !connectedParticipantFids.has(p.user.fid);
              return (
                <Pressable
                  key={p.user.fid}
                  style={[
                    styles.gridItemPressable,
                    { width: speakerTileWidth },
                  ]}
                  onPress={() => {
                    if (tappable) {
                      setSpeakerActionsTarget({
                        user: p.user,
                        role: speakerRole,
                      });
                      return;
                    }
                    setProfileTarget(p.user);
                  }}
                >
                  <SpeakerTile
                    user={p.user}
                    role={speakerRole}
                    speaking={!isOffline && activeSpeakerFids.has(p.user.fid)}
                    muted={
                      isInThisSpace && !isOffline
                        ? !unmutedSpeakerFids.has(p.user.fid)
                        : undefined
                    }
                    isOffline={isOffline}
                    reactions={remoteReactionsByFid.get(p.user.fid)}
                  />
                </Pressable>
              );
            })}
          </View>

          {raisedHands.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: c.fgFaint }]}>
                REQUESTED TO SPEAK · {raisedHands.length}
                {effectiveIsHostOrCohost && (
                  <Text style={[styles.sectionHint, { color: c.fgFaint }]}>
                    {'  (tap to bring up)'}
                  </Text>
                )}
              </Text>
              <View style={styles.gridContainer}>
                {raisedHands.map((p) => (
                  <Pressable
                    key={p.user.fid}
                    style={[
                      styles.gridItemPressable,
                      { width: speakerTileWidth },
                    ]}
                    onPress={() => {
                      if (effectiveIsHostOrCohost) {
                        openInvite(p.user, true);
                        return;
                      }
                      setProfileTarget(p.user);
                    }}
                  >
                    <View style={styles.raisedHandTile}>
                      <View style={styles.listenerAvatarWrap}>
                        <Avatar pfpUrl={p.user.pfp?.url} diameter={48} />
                        <AvatarReactionLayer
                          reactions={remoteReactionsByFid.get(p.user.fid)}
                          size="listener"
                        />
                        <View
                          style={[
                            styles.handBadge,
                            { backgroundColor: c.actionPrimary },
                          ]}
                        >
                          <Text style={styles.handBadgeText}>✋</Text>
                        </View>
                      </View>
                      <SpaceUserDisplayNameWithProBadge
                        user={p.user}
                        name={p.user.username}
                        badgeSize={11}
                        containerStyle={styles.tileNameRow}
                        textStyle={[
                          styles.tileName,
                          styles.tileNameInRow,
                          { color: c.fg, fontSize: 11 },
                        ]}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {visibleListeners.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: c.fgFaint }]}>
                LISTENING · {visibleListeners.length}
                {effectiveIsHostOrCohost && (
                  <Text style={[styles.sectionHint, { color: c.fgFaint }]}>
                    {'  (tap to invite)'}
                  </Text>
                )}
              </Text>
              <View style={styles.gridContainer}>
                {displayedListeners.map((p) => (
                  <View
                    key={p.user.fid}
                    style={[
                      styles.listenerTileWrap,
                      { width: listenerTileWidth },
                    ]}
                  >
                    <Pressable
                      style={styles.listenerTilePressable}
                      onPress={() => {
                        if (effectiveIsHostOrCohost) {
                          openInvite(p.user, false);
                          return;
                        }
                        setProfileTarget(p.user);
                      }}
                    >
                      <ListenerTile
                        user={p.user}
                        reactions={remoteReactionsByFid.get(p.user.fid)}
                      />
                    </Pressable>
                    {p.pendingInvite ? (
                      <View style={styles.pendingInviteContainer}>
                        <View
                          style={[
                            styles.pendingInviteBadge,
                            { backgroundColor: 'rgba(124,101,193,0.12)' },
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.pendingInviteBadgeText,
                              { color: c.actionPrimary },
                            ]}
                          >
                            Invite pending
                          </Text>
                        </View>
                        {effectiveIsHostOrCohost && (
                          <Pressable
                            onPress={() =>
                              handleCancelPendingInvite(p.user.fid)
                            }
                            style={styles.pendingInviteCancelButton}
                          >
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.pendingInviteCancelText,
                                { color: c.fgFaint },
                              ]}
                            >
                              Cancel invite
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <View style={styles.pendingInviteSpacer} />
                    )}
                  </View>
                ))}
              </View>
              {(hasMoreListeners ||
                listenerDisplayLimit > INITIAL_LISTENER_LIMIT) && (
                <View style={styles.showMoreButtonWrap}>
                  <Pressable
                    onPress={() => {
                      if (hasMoreListeners) {
                        setListenerDisplayLimit((prev) =>
                          Math.min(
                            prev + INITIAL_LISTENER_LIMIT,
                            maxVisibleListenerLimit,
                          ),
                        );
                        return;
                      }
                      setListenerDisplayLimit(INITIAL_LISTENER_LIMIT);
                    }}
                    style={styles.showMoreButton}
                  >
                    <Text style={[styles.showMoreText, { color: c.fgFaint }]}>
                      {hasMoreListeners
                        ? `Show more (${displayedListeners.length}/${maxVisibleListenerLimit})`
                        : 'Show less'}
                    </Text>
                  </Pressable>
                </View>
              )}
              {isListenerRenderCapped && (
                <View style={styles.showMoreButtonWrap}>
                  <Text style={[styles.showMoreText, { color: c.fgFaint }]}>
                    Showing first {MAX_RENDERED_LISTENERS} listeners for
                    performance
                  </Text>
                </View>
              )}
            </>
          )}

          {isInThisSpace && (
            <>
              <Text style={[styles.sectionHeader, { color: c.fgFaint }]}>
                CHAT
              </Text>
              <SpaceChatPanel room={room} />
            </>
          )}

          <View style={{ height: scrollBottomSpacerHeight }} />
        </ScrollView>

        {/*
         * Composer is rendered outside the outer ScrollView and pinned to the
         * keyboard via KeyboardStickyView. This avoids resizing the scroll
         * viewport when the keyboard opens and lets the chat input glide above
         * the keyboard on both platforms without fighting an outer KAV.
         *
         * The composer sits above the persistent controls bar in closed state.
         * On iOS, when keyboard opens, use the measured bottom bar height as
         * opened offset so the composer lands flush to keyboard instead of
         * over-lifting. Android still needs the bottom bar height because the
         * composer's closed layout position sits above that bar, plus a smaller
         * platform-specific nudge to account for IME/nav-bar spacing without
         * pushing the input under the keyboard.
         */}
        {isInThisSpace && (
          <KeyboardStickyView
            offset={{
              opened: liveComposerKeyboardOpenedOffset,
              closed: 0,
            }}
          >
            <SpaceChatComposer room={room} />
          </KeyboardStickyView>
        )}

        {isInThisSpace && (
          <View
            onLayout={(e) => {
              const next = Math.ceil(e.nativeEvent.layout.height);
              if (next > 0 && next !== bottomBarHeight) {
                setBottomBarHeight(next);
              }
            }}
            style={[
              styles.bottomBar,
              {
                backgroundColor: c.bg,
                borderColor: c.border,
                paddingBottom: LIVE_CONTROLS_BOTTOM_PADDING,
              },
            ]}
          >
            <LiveControls
              muted={joined?.muted ?? true}
              handRaised={joined?.handRaised ?? false}
              role={viewerRole ?? joined?.role ?? 'listener'}
              onMute={toggleMute}
              onHand={toggleHand}
              onLeave={handleLeave}
              onEnd={canUseFallbackHostControls ? handleEnd : undefined}
              onSendReaction={handleSendReaction}
            />
          </View>
        )}

        {/* Floating reactions */}
        <View pointerEvents="none" style={styles.floatingReactionsLayer}>
          {localFloatingReactions.map((r) => (
            <FloatingReaction key={r.id} emoji={r.emoji} offset={r.offset} />
          ))}
          {floatingLayerReactions.map((r) => (
            <FloatingReaction key={r.id} emoji={r.emoji} offset={r.offset} />
          ))}
        </View>
      </View>

      <InviteToStageSheet
        user={inviteTarget}
        roomId={roomId}
        handRaised={inviteHandRaised}
        isHost={effectiveIsHost}
        onRemove={
          canUseFallbackHostControls && inviteTarget
            ? async () => {
                await removeParticipant({ roomId, fid: inviteTarget.fid });
              }
            : undefined
        }
        onClose={() => setInviteTarget(null)}
      />
      <SpaceShareSheet
        open={inviteSheetOpen}
        roomId={roomId}
        roomTitle={room.title}
        onInviteSent={handleInviteSent}
        onCopyLink={handleCopySpaceLink}
        onShareLink={handleShareSpaceLink}
        onClose={() => setInviteSheetOpen(false)}
      />
      <StageInvitePrompt
        pendingInvite={pendingStageInvite}
        inviterUser={pendingInviteInviterUser}
        isSubmitting={isStageInviteSubmitting}
        onAccept={handleAcceptPendingInvite}
        onDecline={handleDeclinePendingInvite}
      />
      <SpaceEndedModal
        open={showInactivityEndedModal}
        onClose={() => {
          setShowInactivityEndedModal(false);
          goBack();
        }}
      />
      <EditSpaceBottomSheet
        open={editOpen}
        liveEdit
        room={room}
        onClose={() => setEditOpen(false)}
      />

      <TipSpeakersSheet
        open={tipSheetOpen}
        speakers={speakers.map((p) => ({
          user: p.user,
          role: p.role as 'host' | 'cohost' | 'speaker',
        }))}
        onClose={() => setTipSheetOpen(false)}
      />

      <SpeakerActionsSheet
        target={speakerActionsTarget}
        canMakeCohost={
          effectiveIsHost && speakerActionsTarget?.role === 'speaker'
        }
        canMoveToSpeaker={
          canUseFallbackHostControls && speakerActionsTarget?.role === 'cohost'
        }
        canMoveToListener={
          canUseFallbackHostControls &&
          speakerActionsTarget?.role !== 'host' &&
          speakerActionsTarget?.user.fid !== joined?.viewerFid
        }
        canRemoveFromSpace={
          canUseFallbackHostControls &&
          speakerActionsTarget?.role !== 'host' &&
          speakerActionsTarget?.user.fid !== joined?.viewerFid
        }
        canLeaveStage={
          speakerActionsTarget?.role === 'speaker' &&
          speakerActionsTarget?.user.fid === joined?.viewerFid
        }
        onMakeCohost={() => {
          if (speakerActionsTarget) {
            handlePromoteCohost(speakerActionsTarget.user.fid);
          }
          setSpeakerActionsTarget(null);
        }}
        onMoveToSpeaker={() => {
          if (speakerActionsTarget) {
            handleMoveToSpeaker(speakerActionsTarget.user.fid);
          }
          setSpeakerActionsTarget(null);
        }}
        onMoveToListener={() => {
          if (speakerActionsTarget) {
            handleMoveToListener(speakerActionsTarget.user.fid);
          }
          setSpeakerActionsTarget(null);
        }}
        onRemoveFromSpace={() => {
          if (speakerActionsTarget) {
            handleRemoveParticipant(speakerActionsTarget.user.fid);
          }
          setSpeakerActionsTarget(null);
        }}
        onLeaveStage={() => {
          handleLeaveStage();
          setSpeakerActionsTarget(null);
        }}
        onClose={() => setSpeakerActionsTarget(null)}
      />
      <UserProfileSheet
        user={profileTarget}
        onClose={() => setProfileTarget(null)}
      />
    </SpaceChatProvider>
  );
}

function ScheduledSpaceRoom({
  room,
  roomId,
  autoStartScheduled,
}: {
  room: ApiAudioRoom;
  roomId: string;
  autoStartScheduled?: boolean;
}) {
  const c = useColors();
  const goBack = useGoBack();
  const toast = useToast();
  const currentUser = useCurrentUser();
  const { join } = useSpace();
  const rsvpAudioRoom = useRsvpAudioRoom();
  const startScheduledRoom = useStartScheduledAudioRoom();
  const endAudioRoom = useEndAudioRoom();
  const [rsvped, setRsvped] = useState(room.viewerContext?.rsvped ?? false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<ApiUser | null>(null);
  const telemetrySessionIdRef = useRef(
    createAudioSpaceTelemetryId('space_screen_scheduled'),
  );
  const autoStartAttemptedRef = useRef(false);

  useEffect(() => {
    telemetrySessionIdRef.current = createAudioSpaceTelemetryId(
      'space_screen_scheduled',
    );
  }, [roomId]);

  const isHost = currentUser?.fid === room.hostFid;

  const trackScheduledInviteEvent = useCallback(
    (
      source:
        | 'space_invite_composer_opened'
        | 'space_invite_sent'
        | 'space_share_copy_link'
        | 'space_share_native',
      properties?: Record<string, string | number | boolean | undefined>,
    ) => {
      trackMobileAudioSpaceEvent({
        eventName: AUDIO_SPACE_EVENTS.openSource,
        context: {
          spaceSessionId: telemetrySessionIdRef.current,
          roomId,
          viewerFid: currentUser?.fid,
          role: isHost ? 'host' : undefined,
          isHost,
          platform: 'mobile',
          entrySource: 'spaces_list',
        },
        properties: { source, ...(properties ?? {}) },
      });
    },
    [currentUser?.fid, isHost, roomId],
  );

  useEffect(() => {
    setRsvped(room.viewerContext?.rsvped ?? false);
  }, [room.id, room.viewerContext?.rsvped]);

  const handleRsvp = useCallback(async () => {
    setIsRsvping(true);
    try {
      const result = await rsvpAudioRoom({ roomId });
      setRsvped(result.rsvped);
    } catch {
      toast.show('Failed to update reminder', { type: 'danger' });
    } finally {
      setIsRsvping(false);
    }
  }, [rsvpAudioRoom, roomId, toast]);

  const handleGoLive = useCallback(async () => {
    setIsStarting(true);
    try {
      const result = await startScheduledRoom({ roomId });
      const didJoin = await join(result.room.id, 'spaces_list');
      if (!didJoin) {
        return;
      }
      // SpaceRoomPage will re-render in 'live' mode once useAudioRoom invalidates
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to start Space', {
        type: 'danger',
      });
    } finally {
      setIsStarting(false);
    }
  }, [startScheduledRoom, roomId, join, toast]);

  useEffect(() => {
    if (
      !autoStartScheduled ||
      autoStartAttemptedRef.current ||
      !isHost ||
      isStarting
    ) {
      return;
    }
    autoStartAttemptedRef.current = true;
    void handleGoLive();
  }, [autoStartScheduled, handleGoLive, isHost, isStarting]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel scheduled Space?',
      'Everyone who set a reminder will not be notified that it went live.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Space',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await endAudioRoom({ roomId });
              toast.show('Space cancelled', { type: 'success' });
              goBack();
            } catch (err) {
              toast.show(
                err instanceof Error ? err.message : 'Failed to cancel Space',
                { type: 'danger' },
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  }, [endAudioRoom, roomId, toast, goBack]);

  const scheduledLabel = useMemo(() => {
    if (!room.scheduledAt) return null;
    const date = new Date(room.scheduledAt);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [room.scheduledAt]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { borderColor: c.border }]}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.iconButton}>
            <Octicons name="chevron-left" size={20} color={c.fg} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.fgFaint }]}>
            Scheduled Space
          </Text>
          <Pressable
            onPress={() => {
              trackScheduledInviteEvent('space_invite_composer_opened');
              setInviteSheetOpen(true);
            }}
            hitSlop={12}
            style={styles.iconButton}
            accessibilityLabel="Share Space"
          >
            <ShareIcon size={18} color={c.fg} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={styles.flex1}
        >
          <Text style={[styles.title, { color: c.fg }]}>{room.title}</Text>
          {!!room.description && (
            <Text style={[styles.metaText, { color: c.fgFaint }]}>
              {room.description}
            </Text>
          )}
          {scheduledLabel && (
            <Text style={[styles.scheduledLabel, { color: c.actionPrimary }]}>
              {scheduledLabel}
            </Text>
          )}
          <Text style={[styles.metaText, { color: c.fgFaint }]}>
            {(room.rsvpCount ?? 0).toLocaleString()} reminders set
          </Text>

          <View style={[styles.hostCard, { borderColor: c.border }]}>
            <Text style={[styles.hostCardLabel, { color: c.fgFaint }]}>
              HOSTED BY
            </Text>
            <Pressable
              onPress={() => setProfileTarget(room.host)}
              style={styles.hostCardRow}
            >
              <Avatar pfpUrl={room.host.pfp?.url} diameter={48} />
              <View style={{ marginLeft: 12 }}>
                <SpaceUserDisplayNameWithProBadge
                  user={room.host}
                  badgeSize={15}
                  textStyle={[styles.hostName, { color: c.fg }]}
                />
                <Text style={[styles.hostUsername, { color: c.fgFaint }]}>
                  @{room.host.username}
                </Text>
              </View>
            </Pressable>
          </View>

          {isHost ? (
            <View style={styles.scheduledHostActions}>
              <Pressable
                onPress={handleGoLive}
                disabled={isStarting || isCancelling}
                style={[
                  styles.rsvpButton,
                  {
                    flex: 2,
                    backgroundColor: c.danger,
                    opacity: isStarting || isCancelling ? 0.5 : 1,
                  },
                ]}
              >
                <Octicons name="unmute" size={14} color="white" />
                <Text style={[styles.rsvpButtonText, { color: 'white' }]}>
                  {isStarting ? 'Starting…' : 'Go live now'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setEditOpen(true)}
                disabled={isStarting || isCancelling}
                style={[
                  styles.cancelScheduledButton,
                  {
                    flex: 1,
                    borderColor: c.border,
                    opacity: isStarting || isCancelling ? 0.5 : 1,
                  },
                ]}
              >
                <Octicons name="pencil" size={14} color={c.fg} />
                <Text style={[styles.rsvpButtonText, { color: c.fg }]}>
                  Edit
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                disabled={isStarting || isCancelling}
                style={[
                  styles.cancelScheduledButton,
                  {
                    flex: 1,
                    borderColor: c.border,
                    opacity: isStarting || isCancelling ? 0.5 : 1,
                  },
                ]}
              >
                <Octicons name="trash" size={14} color={c.danger} />
                <Text style={[styles.rsvpButtonText, { color: c.danger }]}>
                  {isCancelling ? '…' : 'Cancel'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleRsvp}
              disabled={isRsvping}
              style={[
                styles.rsvpButton,
                {
                  marginTop: 16,
                  backgroundColor: rsvped ? c.bgSecondary : c.actionPrimary,
                  opacity: isRsvping ? 0.5 : 1,
                },
              ]}
            >
              <Octicons name="bell" size={14} color={rsvped ? c.fg : 'white'} />
              <Text
                style={[
                  styles.rsvpButtonText,
                  { color: rsvped ? c.fg : 'white' },
                ]}
              >
                {rsvped ? 'Reminder set' : 'Remind me'}
              </Text>
            </Pressable>
          )}

          <View style={{ height: SPACE_ROOM_SCROLL_BOTTOM_SPACER_HEIGHT }} />
        </ScrollView>
      </View>

      <EditSpaceBottomSheet
        open={editOpen}
        room={room}
        onClose={() => setEditOpen(false)}
      />
      <SpaceShareSheet
        open={inviteSheetOpen}
        roomId={roomId}
        roomTitle={room.title}
        onInviteSent={(recipientCount) =>
          trackScheduledInviteEvent('space_invite_sent', { recipientCount })
        }
        onCopyLink={() => trackScheduledInviteEvent('space_share_copy_link')}
        onShareLink={() => trackScheduledInviteEvent('space_share_native')}
        onClose={() => setInviteSheetOpen(false)}
      />
      <UserProfileSheet
        user={profileTarget}
        onClose={() => setProfileTarget(null)}
      />
    </>
  );
}

const SpeakerTile = React.memo(function SpeakerTile({
  user,
  role,
  speaking,
  muted,
  isOffline,
  reactions,
}: {
  user: ApiUser;
  role: 'host' | 'cohost' | 'speaker';
  speaking: boolean;
  muted?: boolean;
  isOffline?: boolean;
  reactions?: { id: number; emoji: string }[];
}) {
  const c = useColors();
  // Pulse drives `transform: scale` and `opacity` on a separate ring layered
  // behind the avatar — both are native-driver-friendly so the animation
  // runs off the JS thread and doesn't drop frames during scroll.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!speaking) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [speaking, pulse]);

  const pfpUrl =
    isOffline && Platform.OS === 'ios'
      ? getIosOfflineAvatarUrl(user.pfp?.url)
      : user.pfp?.url;
  const skipAdditionalCDNWrap = isOffline && Platform.OS === 'ios' && !!pfpUrl;

  const pulseRingStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.25],
        }),
      },
    ],
  };

  return (
    <View style={styles.tile}>
      <View style={styles.tileAvatarWrap}>
        {speaking ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              { borderColor: c.actionPrimary },
              pulseRingStyle,
            ]}
          />
        ) : null}
        <View
          style={[
            styles.avatarRing,
            speaking && {
              borderWidth: SPEAKER_RING_BORDER,
              borderColor: c.actionPrimary,
            },
          ]}
        >
          <View style={isOffline ? styles.offlineAvatarWrap : undefined}>
            <Avatar
              pfpUrl={pfpUrl}
              diameter={SPEAKER_AVATAR_DIAMETER}
              skipAdditionalCDNWrap={skipAdditionalCDNWrap}
            />
          </View>
        </View>

        {/* Host star badge — top-right */}
        {role === 'host' && (
          <View
            style={[styles.hostBadge, { backgroundColor: c.actionPrimary }]}
          >
            <Octicons name="star-fill" size={11} color="white" />
          </View>
        )}

        {/* Mic indicator badge — bottom-right */}
        {!isOffline && muted !== undefined ? (
          <View
            style={[
              styles.micBadge,
              muted
                ? { backgroundColor: c.bg, borderColor: c.border }
                : { backgroundColor: c.actionPrimary },
            ]}
          >
            <MaterialCommunityIcons
              name={muted ? 'microphone-off' : 'microphone'}
              size={12}
              color={muted ? c.fgFaint : 'white'}
            />
          </View>
        ) : null}
        <AvatarReactionLayer reactions={reactions} size="speaker" />
      </View>
      <SpaceUserDisplayNameWithProBadge
        user={user}
        name={user.displayName || user.username}
        badgeSize={12}
        containerStyle={styles.tileNameRow}
        textStyle={[styles.tileName, styles.tileNameInRow, { color: c.fg }]}
      />
      {role !== 'speaker' && (
        <Text style={[styles.tileRole, { color: c.fgFaint }]}>
          {role === 'host' ? 'Host' : 'Co-host'}
        </Text>
      )}
    </View>
  );
});

const ListenerTile = React.memo(function ListenerTile({
  user,
  reactions,
}: {
  user: ApiUser;
  reactions?: { id: number; emoji: string }[];
}) {
  const c = useColors();
  return (
    <View style={styles.tile}>
      <View style={styles.listenerAvatarWrap}>
        <Avatar pfpUrl={user.pfp?.url} diameter={48} />
        <AvatarReactionLayer reactions={reactions} size="listener" />
      </View>
      <SpaceUserDisplayNameWithProBadge
        user={user}
        name={user.username}
        badgeSize={11}
        containerStyle={styles.tileNameRow}
        textStyle={[
          styles.tileName,
          styles.tileNameInRow,
          { color: c.fg, fontSize: 11 },
        ]}
      />
    </View>
  );
});

const RecordingParticipantAvatar = React.memo(
  function RecordingParticipantAvatar({
    user,
    speaking,
  }: {
    user: ApiUser;
    speaking: boolean;
  }) {
    const c = useColors();
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!speaking) {
        pulse.stopAnimation();
        pulse.setValue(0);
        return;
      }
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => {
        loop.stop();
      };
    }, [speaking, pulse]);

    const pulseRingStyle = {
      opacity: pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 0],
      }),
      transform: [
        {
          scale: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.25],
          }),
        },
      ],
    };

    return (
      <View style={styles.endedParticipantAvatarWrap}>
        {speaking ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.endedParticipantPulseRing,
              { borderColor: c.actionPrimary },
              pulseRingStyle,
            ]}
          />
        ) : null}
        <View
          style={[
            styles.endedParticipantAvatarRing,
            speaking && {
              borderWidth: SPEAKER_RING_BORDER,
              borderColor: c.actionPrimary,
            },
          ]}
        >
          <Avatar
            pfpUrl={user.pfp?.url}
            diameter={ENDED_PARTICIPANT_AVATAR_DIAMETER}
          />
        </View>
      </View>
    );
  },
);

const AvatarReactionEmoji = React.memo(function AvatarReactionEmoji({
  emoji,
  horizontalOffset,
  size,
}: {
  emoji: string;
  horizontalOffset: number;
  size: 'speaker' | 'listener';
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const liftDistance = size === 'speaker' ? -140 : -120;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: liftDistance,
        duration: 2200,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2200,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, size, translateY]);

  return (
    <Animated.Text
      style={[
        size === 'speaker'
          ? styles.speakerAvatarReactionEmoji
          : styles.listenerAvatarReactionEmoji,
        {
          opacity,
          transform: [{ translateY }, { translateX: horizontalOffset }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
});

const AvatarReactionLayer = React.memo(function AvatarReactionLayer({
  reactions,
  size,
}: {
  reactions?: { id: number; emoji: string }[];
  size: 'speaker' | 'listener';
}) {
  if (!reactions?.length) {
    return null;
  }

  const spread = size === 'speaker' ? 14 : 10;

  return (
    <>
      {reactions.map((reaction, index) => (
        <AvatarReactionEmoji
          key={reaction.id}
          emoji={reaction.emoji}
          horizontalOffset={spread * (index % 3) - spread}
          size={size}
        />
      ))}
    </>
  );
});

const FloatingReaction = React.memo(function FloatingReaction({
  emoji,
  offset,
}: {
  emoji: string;
  offset: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -260,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  return (
    <Animated.Text
      style={[
        styles.floatingReactionEmoji,
        {
          transform: [{ translateY }, { translateX: offset }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
});

/**
 * Action sheet for host/cohost to make a speaker a co-host or move them to
 * listener. Mirrors the inline menu in web's SpeakerTileWithActions.
 */
function SpeakerActionsSheet({
  target,
  canMakeCohost,
  canMoveToSpeaker,
  canMoveToListener,
  canRemoveFromSpace,
  canLeaveStage,
  onMakeCohost,
  onMoveToSpeaker,
  onMoveToListener,
  onRemoveFromSpace,
  onLeaveStage,
  onClose,
}: {
  target: { user: ApiUser; role: 'host' | 'cohost' | 'speaker' } | null;
  canMakeCohost?: boolean;
  canMoveToSpeaker?: boolean;
  canMoveToListener?: boolean;
  canRemoveFromSpace?: boolean;
  canLeaveStage?: boolean;
  onMakeCohost: () => void;
  onMoveToSpeaker?: () => void;
  onMoveToListener?: () => void;
  onRemoveFromSpace?: () => void;
  onLeaveStage?: () => void;
  onClose: () => void;
}) {
  const c = useColors();
  const pushToUserProfile = usePushToUserProfile();
  if (!target) return null;

  const handleViewProfile = () => {
    pushToUserProfile({ fid: target.user.fid });
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.actionsOverlay}>
        <Pressable style={styles.actionsBackdrop} onPress={onClose} />
        <View
          style={[
            styles.actionsSheet,
            { backgroundColor: c.bg, borderColor: c.border },
          ]}
        >
          <Pressable
            onPress={handleViewProfile}
            style={[styles.actionsHeader, { borderColor: c.border }]}
          >
            <Avatar pfpUrl={target.user.pfp?.url} diameter={36} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <SpaceUserDisplayNameWithProBadge
                user={target.user}
                badgeSize={13}
                containerStyle={styles.actionsNameRow}
                textStyle={[styles.actionsName, { color: c.fg }]}
              />
              <Text
                style={[styles.actionsHandle, { color: c.fgFaint }]}
                numberOfLines={1}
              >
                @{target.user.username} ·{' '}
                {target.role === 'host'
                  ? 'Host'
                  : target.role === 'cohost'
                    ? 'Co-host'
                    : 'Speaker'}
              </Text>
            </View>
            <Octicons name="chevron-right" size={14} color={c.fgFaint} />
          </Pressable>
          <Pressable onPress={handleViewProfile} style={styles.actionsButton}>
            <Octicons name="person" size={16} color={c.fg} />
            <Text style={[styles.actionsButtonText, { color: c.fg }]}>
              View profile
            </Text>
          </Pressable>
          {canLeaveStage && onLeaveStage && (
            <Pressable onPress={onLeaveStage} style={styles.actionsButton}>
              <Octicons name="sign-out" size={16} color="#dc3412" />
              <Text style={[styles.actionsButtonText, { color: '#dc3412' }]}>
                Leave stage
              </Text>
            </Pressable>
          )}
          {canMakeCohost && (
            <Pressable onPress={onMakeCohost} style={styles.actionsButton}>
              <Octicons name="shield-check" size={16} color={c.fg} />
              <Text style={[styles.actionsButtonText, { color: c.fg }]}>
                Make Co-host
              </Text>
            </Pressable>
          )}
          {canMoveToSpeaker && onMoveToSpeaker && (
            <Pressable onPress={onMoveToSpeaker} style={styles.actionsButton}>
              <Octicons name="unmute" size={16} color={c.fg} />
              <Text style={[styles.actionsButtonText, { color: c.fg }]}>
                Move to Speaker
              </Text>
            </Pressable>
          )}
          {canMoveToListener && onMoveToListener && (
            <Pressable onPress={onMoveToListener} style={styles.actionsButton}>
              <Octicons name="mute" size={16} color="#dc3412" />
              <Text style={[styles.actionsButtonText, { color: '#dc3412' }]}>
                Move to Listener
              </Text>
            </Pressable>
          )}
          {canRemoveFromSpace && onRemoveFromSpace && (
            <Pressable onPress={onRemoveFromSpace} style={styles.actionsButton}>
              <Octicons name="trash" size={16} color="#dc3412" />
              <Text style={[styles.actionsButtonText, { color: '#dc3412' }]}>
                Remove from Space
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={[styles.actionsCancel, { borderColor: c.border }]}
          >
            <Text style={[styles.actionsCancelText, { color: c.fgFaint }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 13, fontWeight: '500' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(220,52,18,0.12)',
  },
  recordingBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: RED,
  },
  recordingBadgeText: { color: RED, fontSize: 9, fontWeight: '700' },
  elapsedText: { fontSize: 13 },
  reconnectingBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  reconnectingText: { color: '#a16207', fontSize: 13 },
  errorBanner: {
    backgroundColor: 'rgba(220, 52, 18, 0.1)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  errorBannerText: { color: RED, fontSize: 13 },
  scrollContent: {
    paddingHorizontal: SPACE_ROOM_HORIZONTAL_PADDING,
    paddingTop: 16,
  },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleFlex: { flex: 1 },
  renameButton: {
    marginTop: 2,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  metaText: { fontSize: 13, marginTop: 6 },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    marginTop: 16,
  },
  joinButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  joiningBox: { marginTop: 16, alignItems: 'center' },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE_PARTICIPANT_GRID_GAP,
    marginTop: 12,
  },
  gridItemPressable: { alignItems: 'center' },
  tile: { alignItems: 'center' },
  listenerTileWrap: { alignItems: 'center' },
  listenerTilePressable: { width: '100%', alignItems: 'center' },
  pendingInviteContainer: {
    marginTop: 4,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pendingInviteSpacer: {
    minHeight: 38,
  },
  showMoreButtonWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  showMoreButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingInviteBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingInviteBadgeText: { fontSize: 10, fontWeight: '700' },
  pendingInviteCancelButton: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingInviteCancelText: { fontSize: 10, fontWeight: '500' },
  tileAvatarWrap: {
    position: 'relative',
    width: SPEAKER_AVATAR_WRAP_SIZE,
    height: SPEAKER_AVATAR_WRAP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenerAvatarWrap: { position: 'relative' },
  avatarRing: {
    width: SPEAKER_AVATAR_FRAME_SIZE,
    height: SPEAKER_AVATAR_FRAME_SIZE,
    borderRadius: SPEAKER_AVATAR_FRAME_SIZE / 2,
    padding: SPEAKER_RING_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  offlineAvatarWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: SPEAKER_AVATAR_DIAMETER / 2,
    ...(Platform.OS === 'ios'
      ? {}
      : {
          opacity: 0.6,
          filter: [{ grayscale: 1 }],
        }),
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SPEAKER_AVATAR_WRAP_SIZE,
    height: SPEAKER_AVATAR_WRAP_SIZE,
    borderRadius: SPEAKER_AVATAR_WRAP_SIZE / 2,
    borderWidth: SPEAKER_RING_BORDER,
  },
  micBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  hostBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  tileNameRow: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 6,
  },
  tileNameInRow: {
    marginTop: 0,
  },
  tileRole: { fontSize: 10, marginTop: 2 },
  speakerAvatarReactionEmoji: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -11,
    fontSize: 22,
  },
  listenerAvatarReactionEmoji: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -9,
    fontSize: 18,
  },
  flex1: { flex: 1 },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: LIVE_CONTROLS_TOP_PADDING,
    paddingHorizontal: SPACE_ROOM_HORIZONTAL_PADDING,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  errorBody: { fontSize: 14, textAlign: 'center' },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    marginTop: 8,
  },
  retryButtonText: { color: 'white', fontWeight: '700' },
  backLink: { marginTop: 8 },
  backLinkText: { fontSize: 13 },
  hostCard: {
    marginTop: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  hostCardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  hostCardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  hostName: { fontSize: 15, fontWeight: '600' },
  hostUsername: { fontSize: 13, marginTop: 2 },
  endedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  endedBadgeText: { fontSize: 11, fontWeight: '700' },
  endedScrollContent: {
    paddingHorizontal: SPACE_ROOM_HORIZONTAL_PADDING,
    paddingTop: 18,
    paddingBottom: 40,
  },
  endedDescription: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  endedHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  endedHostText: { flex: 1, marginLeft: 12 },
  playbackPanel: {
    marginTop: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
  },
  playbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playbackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackTimeWrap: { flex: 1 },
  playbackTitle: { fontSize: 15, fontWeight: '700' },
  playbackTime: { fontSize: 12, marginTop: 3 },
  playbackSeekArea: {
    height: PLAYBACK_TRACK_HIT_HEIGHT,
    justifyContent: 'center',
    marginTop: 2,
  },
  playbackTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  playbackProgress: { height: '100%', borderRadius: 2 },
  playbackUnavailableRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playbackUnavailableCopy: { flex: 1 },
  playbackUnavailableTitle: { fontSize: 14, fontWeight: '700' },
  playbackUnavailableText: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  endedParticipantList: { marginTop: 10, gap: 8 },
  endedParticipantAvatarWrap: {
    position: 'relative',
    width: ENDED_PARTICIPANT_AVATAR_WRAP_SIZE,
    height: ENDED_PARTICIPANT_AVATAR_WRAP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endedParticipantAvatarRing: {
    width: ENDED_PARTICIPANT_AVATAR_FRAME_SIZE,
    height: ENDED_PARTICIPANT_AVATAR_FRAME_SIZE,
    borderRadius: ENDED_PARTICIPANT_AVATAR_FRAME_SIZE / 2,
    padding: SPEAKER_RING_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  endedParticipantPulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ENDED_PARTICIPANT_AVATAR_WRAP_SIZE,
    height: ENDED_PARTICIPANT_AVATAR_WRAP_SIZE,
    borderRadius: ENDED_PARTICIPANT_AVATAR_WRAP_SIZE / 2,
    borderWidth: SPEAKER_RING_BORDER,
  },
  endedParticipantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
  },
  endedParticipantText: { flex: 1, marginLeft: 10 },
  endedParticipantRole: { fontSize: 12, fontWeight: '600', marginLeft: 8 },
  scheduledLabel: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  rsvpButtonText: { fontSize: 14, fontWeight: '700' },
  scheduledHostActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelScheduledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  floatingReactionsLayer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  floatingReactionEmoji: {
    fontSize: 36,
    position: 'absolute',
    bottom: 0,
  },
  sectionHint: { fontSize: 10, fontWeight: '400', textTransform: 'none' },
  speakersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tipButtonText: { color: 'white', fontWeight: '700', fontSize: 11 },
  raisedHandTile: { alignItems: 'center', position: 'relative' },
  handBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handBadgeText: { fontSize: 11 },
  actionsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  actionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionsSheet: {
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionsName: { fontSize: 14, fontWeight: '600' },
  actionsNameRow: { flex: 1 },
  actionsHandle: { fontSize: 12, marginTop: 2 },
  actionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionsButtonText: { fontSize: 15, fontWeight: '500' },
  actionsCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsCancelText: { fontSize: 14, fontWeight: '500' },
});

export { LiveControls, SpaceRoomScreen };
