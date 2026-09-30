import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import formatDistanceToNowStrict from 'date-fns/formatDistanceToNowStrict';
import { useCalendars } from 'expo-localization';
import { AnalyticsEvent } from 'farcaster-analytics';
import { sleep, useActiveChannelStreak } from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { aboutChannelStreakPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';

import { Prompt } from './Prompt';

const AboutChannelStreakPrompt: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const t = useTheme();

  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

  const shouldPresent = React.useCallback(() => {
    return activePromptKey === aboutChannelStreakPromptKey;
  }, [activePromptKey]);

  React.useEffect(() => {
    if (activePromptKey === aboutChannelStreakPromptKey) {
      trackEvent(AnalyticsEvent.ShowAboutChannelStreakPrompt, undefined);
    }
  }, [activePromptKey, trackEvent]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={1000}
      storageKey={aboutChannelStreakPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      enableDynamicSizing={true}
      withExtraShadow={true}
    >
      <React.Suspense
        fallback={
          <View style={[t.wFull, t.itemsCenter, t.justifyCenter]}>
            <LoadingIndicator />
          </View>
        }
      >
        <AboutChannelStreakPromptContent fid={currentUserFid} />
      </React.Suspense>
    </Prompt>
  );
});

AboutChannelStreakPrompt.displayName = 'AboutChannelStreakPrompt';

export const AboutChannelStreakPromptContent: React.FC<{ fid: number }> = ({
  fid,
}: {
  fid: number;
}) => {
  const calendars = useCalendars();

  const t = useTheme();

  const { data } = useActiveChannelStreak({ fid });

  const streakLength = React.useMemo(() => {
    if (
      typeof data === 'undefined' ||
      typeof data.result.streak === 'undefined'
    ) {
      return 0;
    }

    return data.result.streak.streakCount;
  }, [data]);

  const metadata = React.useMemo(() => {
    if (
      typeof data === 'undefined' ||
      typeof data.result.streak === 'undefined' ||
      typeof data.result.streak.metadata === 'undefined'
    ) {
      return undefined;
    }

    return data.result.streak.metadata;
  }, [data]);

  const push = usePush();

  const { bottom } = useSafeAreaInsets();

  const { forceClose } = useBottomSheet();
  const { hideGlobalPrompt } = useGlobalPrompts();

  const startedFormattedDateString = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return;
    }

    const timeZone = calendars?.[0]?.timeZone || undefined;
    const date = new Date(metadata.startedAtTimestamp);

    // Format as "h:mma z" (e.g., "3:00pm PST")
    return date
      .toLocaleTimeString('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      .toLowerCase();
  }, [calendars, metadata]);

  const expiresFormattedDateString = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return;
    }

    const timeZone = calendars?.[0]?.timeZone || undefined;
    const date = new Date(metadata.expiresAtTimestamp);

    // Format as "h:mma z" (e.g., "3:00pm PST")
    return date
      .toLocaleTimeString('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      .toLowerCase();

    // const today = moment().startOf('day');
    // const tomorrow = moment().add(1, 'day').startOf('day');

    // const expires =
    //   calendars.length !== 0 && calendars[0].timeZone
    //     ? // @ts-expect-error TZ package types are acting up on mobile package
    //       moment(metadata.expiresAtTimestamp).tz(calendars[0].timeZone)
    //     : moment(metadata.expiresAtTimestamp);

    // let dayText;
    // if (expires.isSame(today, 'day')) {
    //   dayText = 'Today';
    // } else if (expires.isSame(tomorrow, 'day')) {
    //   dayText = 'Tomorrow';
    // } else {
    //   dayText = expires.format('dddd');
    // }

    // return `${dayText} at ${expires.format('h:mma z')}`;
  }, [calendars, metadata]);

  const expiresInHours = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return;
    }

    // Use date-fns for relative time formatting
    return formatDistanceToNowStrict(new Date(metadata.expiresAtTimestamp));
  }, [metadata]);

  const userAlreadyCasted = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return false;
    }

    return metadata.alreadyCastedToday;
  }, [metadata]);

  const closePrompt = React.useCallback(async () => {
    const transitionDuration = 200;

    forceClose({ duration: transitionDuration });
    hideGlobalPrompt();

    await sleep(transitionDuration);
  }, [forceClose, hideGlobalPrompt]);

  if (typeof metadata === 'undefined') {
    return (
      <View style={[t.hFull, t.justifyBetween, t.p4]}>
        <Text style={[t.texts.primary, t.textBase, t.mT1]}>
          No active channel steak.
        </Text>
      </View>
    );
  }

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.wFull,
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.wFull,
              t.itemsCenter,
              t.flex,
              t.flexRow,
              t.justifyBetween,
            ]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.texts.primary,
                t.fontBold,
                t.textLg,
              ]}
            >
              About your streak
            </Text>
          </View>
          <View
            style={[
              t.flexGrow,
              t.flex,
              t.flexCol,
              t.itemsStart,
              t.mY4,
              { gap: 16 },
            ]}
          >
            <View style={[t.flex, t.flexCol]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Streak length
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <Text style={[t.texts.primary, t.textBase, t.mT1]}>
                  {streakLength}
                </Text>
              </View>
            </View>
            <View style={[t.flex, t.flexCol]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Your streak window
              </Text>
              <View style={[t.flex, t.flexCol, t.itemsCenter]}>
                <Text style={[t.texts.primary, t.textBase, t.mT1]}>
                  {startedFormattedDateString} to {expiresFormattedDateString}
                </Text>
              </View>
            </View>
            <View style={[t.flex, t.flexCol]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Current streak window
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text style={[t.texts.primary, t.textBase, t.mT1]}>
                  {metadata.latestWindowCastCount === 0
                    ? 'No casts'
                    : metadata.latestWindowCastCount === 1
                      ? '1 cast'
                      : `${metadata.latestWindowCastCount} casts`}
                </Text>
                {userAlreadyCasted ? (
                  <Octicons
                    name="check-circle-fill"
                    style={[{ marginTop: 5.5, color: '#22c55e' }]}
                  />
                ) : (
                  <Octicons
                    name="alert"
                    style={[{ marginTop: 5.5 }, t.texts.secondary]}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
        {userAlreadyCasted ? (
          <View
            style={[
              t.wFull,
              t.mR2,
              t.pX3,
              t.pY4,
              t.rounded,
              t.borderDefault,
              t.borderHairline,
              t.flexGrow,
              t.flex,
              t.flexCol,
              t.itemsCenter,
              t.justifyCenter,
              t.mB4,
              { backgroundColor: '#bbf7d0' },
            ]}
          >
            <Text style={[t.textBase, t.fontSemibold, { color: '#22c55e' }]}>
              Your next window starts in {expiresInHours}
            </Text>
          </View>
        ) : (
          <View
            style={[
              t.wFull,
              t.mR2,
              t.pX3,
              t.pY4,
              t.rounded,
              t.borderDefault,
              t.borderHairline,
              t.flexGrow,
              t.flex,
              t.flexCol,
              t.itemsCenter,
              t.justifyCenter,
              t.mB4,
              t.bgDefault,
            ]}
          >
            <Text style={[t.textBase, t.fontSemibold, t.texts.secondary]}>
              You have {expiresInHours} left to cast
            </Text>
          </View>
        )}
        <View
          style={[
            t.wFull,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            { marginBottom: Math.max(bottom, sizes.s2) },
          ]}
        >
          <Pressable
            style={[
              t.flex,
              { width: '48%', minWidth: '48%' },
              t.flexShrink0,
              t.itemsCenter,
              t.justifyCenter,
              t.textCenter,
              t.bgTransparent,
              t.roundedLg,
              t.pX3,
              t.pY4,
              t.borderDefault,
              t.borderHairline,
            ]}
            onPress={async () => {
              await closePrompt();
            }}
          >
            <Text
              style={[
                t.wFull,
                t.texts.tertiary,
                t.textBase,
                t.textCenter,
                t.fontSemibold,
              ]}
            >
              Close
            </Text>
          </Pressable>
          <Pressable
            style={[
              t.flex,
              { width: '48%', minWidth: '48%' },
              t.flexShrink0,
              t.itemsCenter,
              t.justifyCenter,
              t.textCenter,
              t.roundedLg,
              t.bgActionFrameTx,
              t.pX3,
              t.pY4,
            ]}
            onPress={async () => {
              await closePrompt();

              if (typeof data !== 'undefined' && data.result.streak) {
                push('Channel', {
                  channelKey: data.result.streak?.channel.key,
                });
              }
            }}
          >
            <Text
              style={[t.textBase, t.fontSemibold, t.texts.light, t.textCenter]}
            >
              Go to channel
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetView>
  );
};

export const AboutChannelStreakPromptContentV2: React.FC<{ fid: number }> = ({
  fid,
}: {
  fid: number;
}) => {
  const calendars = useCalendars();

  const t = useTheme();

  const { data } = useActiveChannelStreak({ fid });

  const streakLength = React.useMemo(() => {
    if (
      typeof data === 'undefined' ||
      typeof data.result.streak === 'undefined'
    ) {
      return 0;
    }

    return data.result.streak.streakCount;
  }, [data]);

  const metadata = React.useMemo(() => {
    if (
      typeof data === 'undefined' ||
      typeof data.result.streak === 'undefined' ||
      typeof data.result.streak.metadata === 'undefined'
    ) {
      return undefined;
    }

    return data.result.streak.metadata;
  }, [data]);

  const push = usePush();

  const { bottom } = useSafeAreaInsets();

  const { forceClose } = useBottomSheet();
  const { hideGlobalPrompt } = useGlobalPrompts();

  const startedFormattedDateString = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return;
    }

    const timeZone = calendars?.[0]?.timeZone || undefined;
    const date = new Date(metadata.startedAtTimestamp);

    // Format as "h:mma z" (e.g., "3:00pm PST")
    return date
      .toLocaleTimeString('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      .toLowerCase();
  }, [calendars, metadata]);

  const expiresFormattedDateString = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return;
    }

    const timeZone = calendars?.[0]?.timeZone || undefined;
    const date = new Date(metadata.expiresAtTimestamp);

    // Format as "h:mma z" (e.g., "3:00pm PST")
    return date
      .toLocaleTimeString('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      .toLowerCase();

    // const today = moment().startOf('day');
    // const tomorrow = moment().add(1, 'day').startOf('day');

    // const expires =
    //   calendars.length !== 0 && calendars[0].timeZone
    //     ? // @ts-expect-error TZ package types are acting up on mobile package
    //       moment(metadata.expiresAtTimestamp).tz(calendars[0].timeZone)
    //     : moment(metadata.expiresAtTimestamp);

    // let dayText;
    // if (expires.isSame(today, 'day')) {
    //   dayText = 'Today';
    // } else if (expires.isSame(tomorrow, 'day')) {
    //   dayText = 'Tomorrow';
    // } else {
    //   dayText = expires.format('dddd');
    // }

    // return `${dayText} at ${expires.format('h:mma z')}`;
  }, [calendars, metadata]);

  const expiresInHours = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return;
    }

    // Use date-fns for relative time formatting
    return formatDistanceToNowStrict(new Date(metadata.expiresAtTimestamp));
  }, [metadata]);

  const userAlreadyCasted = React.useMemo(() => {
    if (typeof metadata === 'undefined') {
      return false;
    }

    return metadata.alreadyCastedToday;
  }, [metadata]);

  const closePrompt = React.useCallback(async () => {
    const transitionDuration = 200;

    forceClose({ duration: transitionDuration });
    hideGlobalPrompt();

    await sleep(transitionDuration);
  }, [forceClose, hideGlobalPrompt]);

  if (typeof metadata === 'undefined') {
    return (
      <View style={[t.hFull, t.justifyBetween, t.p4]}>
        <Text style={[t.texts.primary, t.textBase, t.mT1]}>
          No active channel steak.
        </Text>
      </View>
    );
  }

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.wFull,
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.wFull,
              t.itemsCenter,
              t.flex,
              t.flexRow,
              t.justifyBetween,
            ]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.texts.primary,
                t.fontBold,
                t.textLg,
              ]}
            >
              About your streak
            </Text>
          </View>
          <View
            style={[
              t.flexGrow,
              t.flex,
              t.flexCol,
              t.itemsStart,
              t.mY4,
              { gap: 16 },
            ]}
          >
            <View style={[t.flex, t.flexCol]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Streak length
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <Text style={[t.texts.primary, t.textBase, t.mT1]}>
                  {streakLength}
                </Text>
              </View>
            </View>
            <View style={[t.flex, t.flexCol]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Your streak window
              </Text>
              <View style={[t.flex, t.flexCol, t.itemsCenter]}>
                <Text style={[t.texts.primary, t.textBase, t.mT1]}>
                  {startedFormattedDateString} to {expiresFormattedDateString}
                </Text>
              </View>
            </View>
            <View style={[t.flex, t.flexCol]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Current streak window
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text style={[t.texts.primary, t.textBase, t.mT1]}>
                  {metadata.latestWindowCastCount === 0
                    ? 'No casts'
                    : metadata.latestWindowCastCount === 1
                      ? '1 cast'
                      : `${metadata.latestWindowCastCount} casts`}
                </Text>
                {userAlreadyCasted ? (
                  <Octicons
                    name="check-circle-fill"
                    style={[{ marginTop: 5.5, color: '#22c55e' }]}
                  />
                ) : (
                  <Octicons
                    name="alert"
                    style={[{ marginTop: 5.5 }, t.texts.secondary]}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
        {userAlreadyCasted ? (
          <View
            style={[
              t.wFull,
              t.mR2,
              t.pX3,
              t.pY4,
              t.rounded,
              t.borderDefault,
              t.borderHairline,
              t.flexGrow,
              t.flex,
              t.flexCol,
              t.itemsCenter,
              t.justifyCenter,
              t.mB4,
              { backgroundColor: '#bbf7d0' },
            ]}
          >
            <Text style={[t.textBase, t.fontSemibold, { color: '#22c55e' }]}>
              Your next window starts in {expiresInHours}
            </Text>
          </View>
        ) : (
          <View
            style={[
              t.wFull,
              t.mR2,
              t.pX3,
              t.pY4,
              t.rounded,
              t.borderDefault,
              t.borderHairline,
              t.flexGrow,
              t.flex,
              t.flexCol,
              t.itemsCenter,
              t.justifyCenter,
              t.mB4,
              t.bgDefault,
            ]}
          >
            <Text style={[t.textBase, t.fontSemibold, t.texts.secondary]}>
              You have {expiresInHours} left to cast
            </Text>
          </View>
        )}
        <View
          style={[
            t.wFull,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            { marginBottom: Math.max(bottom, sizes.s2) },
          ]}
        >
          <Pressable
            style={[
              t.flex,
              { width: '48%', minWidth: '48%' },
              t.flexShrink0,
              t.itemsCenter,
              t.justifyCenter,
              t.textCenter,
              t.bgTransparent,
              t.roundedLg,
              t.pX3,
              t.pY4,
              t.borderDefault,
              t.borderHairline,
            ]}
            onPress={async () => {
              await closePrompt();
            }}
          >
            <Text
              style={[
                t.wFull,
                t.texts.tertiary,
                t.textBase,
                t.textCenter,
                t.fontSemibold,
              ]}
            >
              Close
            </Text>
          </Pressable>
          <Pressable
            style={[
              t.flex,
              { width: '48%', minWidth: '48%' },
              t.flexShrink0,
              t.itemsCenter,
              t.justifyCenter,
              t.textCenter,
              t.roundedLg,
              t.bgActionFrameTx,
              t.pX3,
              t.pY4,
            ]}
            onPress={async () => {
              await closePrompt();

              if (typeof data !== 'undefined' && data.result.streak) {
                push('Channel', {
                  channelKey: data.result.streak?.channel.key,
                });
              }
            }}
          >
            <Text
              style={[t.textBase, t.fontSemibold, t.texts.light, t.textCenter]}
            >
              Go to channel
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetView>
  );
};

export { AboutChannelStreakPrompt };
