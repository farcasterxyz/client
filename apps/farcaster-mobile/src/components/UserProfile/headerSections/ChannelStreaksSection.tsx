import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useActiveChannelStreak,
  useStopActiveChannelStreak,
} from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';

import { ChannelRemoteImage } from '~/components/ChannelsV3/ChannelRemoteImage';
import { Text2 } from '~/components/Text';
import {
  aboutChannelStreakPromptKey,
  startChannelStreakPromptKey,
} from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

type ChannelStreaksSectionProps = {
  user: ApiUser;
};

const ChannelStreaksSection: React.FC<ChannelStreaksSectionProps> = ({
  user,
}) => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const { optedOutChannelStreaks } = useUserAppContext();

  if (optedOutChannelStreaks) {
    return null;
  }

  return (
    <React.Suspense fallback={<View style={[{ height: sizes.s12 }]} />}>
      {currentUserFid === user.fid ? (
        <ChannelStreaksSelf user={user} />
      ) : (
        <ChannelStreaks user={user} />
      )}
    </React.Suspense>
  );
};

ChannelStreaksSection.displayName = 'ChannelStreaksSection';

const ChannelStreaks: React.FC<ChannelStreaksSectionProps> = ({ user }) => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const isAdmin = useIsAdmin();

  const { showGlobalPrompt } = useGlobalPrompts();

  const t = useTheme();
  const push = usePush();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();

  const streak = React.useMemo(() => {
    return user.streak;
  }, [user.streak]);

  const scale = useSharedValue(1);

  // Animated style that uses the shared scale value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const stopActiveChannelStreak = useStopActiveChannelStreak();

  if (typeof streak === 'undefined' && user.fid !== currentUserFid) {
    return null;
  }

  if (typeof streak === 'undefined') {
    return (
      <Animated.View
        style={[
          t.bgElevated,
          t.flex,
          t.flexCol,
          t.relative,
          t.borderDefault,
          t.borderHairline,
          {
            borderRadius: 20,
          },
          animatedStyle,
        ]}
        onTouchStart={() => {
          scale.value = withSpring(0.9);
        }}
        onTouchEnd={() => {
          scale.value = withSpring(1);
        }}
      >
        <Pressable
          style={[
            t.inset0,
            t.pX2,
            t.pY1,
            t.wFull,
            t.itemsCenter,
            t.justifyCenter,
          ]}
          onPress={async () => {
            trackEvent(AnalyticsEvent.ClickProfileChannelStreak, {});

            showGlobalPrompt({ key: startChannelStreakPromptKey });
          }}
        >
          <View style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}>
            <Octicons
              name="star-fill"
              color={t.colors.text.secondary}
              size={14}
              style={[{ marginTop: 0.5 }]}
            />
            <Text2 color="secondary" size="sm" weight="semibold">
              Start a streak
            </Text2>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        t.dark
          ? [t.bgDefault, t.borderHairline, { borderColor: '#ECA220' }]
          : [{ backgroundColor: '#EAB30526' }],
        t.flex,
        t.flexCol,
        t.relative,
        animatedStyle,
        { borderRadius: 20 },
      ]}
      onTouchStart={() => {
        scale.value = withSpring(0.9);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
    >
      <Pressable
        style={[
          t.inset0,
          t.pX2,
          t.pY1,
          t.wFull,
          t.itemsCenter,
          t.justifyCenter,
        ]}
        onPress={async () => {
          trackEvent(
            AnalyticsEvent.ClickProfileChannelStreakNavigateToChannel,
            {},
          );

          if (user.fid === currentUserFid) {
            showGlobalPrompt({ key: aboutChannelStreakPromptKey });
          } else {
            push('Channel', { channelKey: streak.channel.key });
          }
        }}
        onLongPress={async () => {
          if (isAdmin) {
            triggerImpactAsync();

            await stopActiveChannelStreak({ fid: currentUserFid });
          }
        }}
      >
        <View style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}>
          <View style={[t.relative]}>
            <ChannelRemoteImage
              channelImageUrl={streak.channel.imageUrl}
              size="feed"
            />
            <Svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              style={[
                t.absolute,
                t.bottom0,
                t.right0,
                { marginBottom: -2, marginRight: -4 },
              ]}
            >
              <Path
                d="M5.77443 0.98137L5.32607 1.20268L5.77443 0.981369C5.62893 0.686608 5.32872 0.5 5 0.5C4.67128 0.5 4.37107 0.686608 4.22557 0.981369L3.30269 2.85103L1.23874 3.15271C0.913529 3.20024 0.643488 3.42825 0.542116 3.74089L1.01774 3.89511L0.542116 3.74089C0.440745 4.05353 0.525617 4.39662 0.761059 4.62594L2.25383 6.07989L1.90153 8.13399C1.84595 8.45801 1.97916 8.78549 2.24515 8.97871C2.51113 9.17193 2.86374 9.19738 3.15471 9.04436L5 8.07394L6.84529 9.04436C7.13626 9.19738 7.48887 9.17193 7.75485 8.97871C8.02083 8.78549 8.15405 8.45801 8.09847 8.13399L7.74617 6.07989L9.23894 4.62594C9.47438 4.39662 9.55926 4.05354 9.45788 3.74089L8.98226 3.89511L9.45788 3.74089C9.35651 3.42825 9.08647 3.20024 8.76126 3.15271L6.69731 2.85103L5.77443 0.98137Z"
                fill="#EAB305"
                stroke="#FCF4DA"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text2
            color="secondary"
            size="sm"
            weight="semibold"
            style={[{ color: '#ECA220' }]}
          >
            {`${Math.max(1, streak.streakCount)}d`}
          </Text2>
        </View>
      </Pressable>
    </Animated.View>
  );
};

ChannelStreaks.displayName = 'ChannelStreaks';

const ChannelStreaksSelf: React.FC<ChannelStreaksSectionProps> = React.memo(
  ({ user }) => {
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const isAdmin = useIsAdmin();

    const { showGlobalPrompt } = useGlobalPrompts();

    const t = useTheme();
    const push = usePush();
    const { triggerImpactAsync } = useHaptics();
    const { trackEvent } = useAnalytics();

    const { data } = useActiveChannelStreak({ fid: user.fid });

    const streak = React.useMemo(() => {
      return data!.result.streak;
    }, [data]);

    const scale = useSharedValue(1);

    // Animated style that uses the shared scale value
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const stopActiveChannelStreak = useStopActiveChannelStreak();

    if (typeof streak === 'undefined' && user.fid !== currentUserFid) {
      return null;
    }

    if (typeof streak === 'undefined') {
      return (
        <Animated.View
          style={[
            t.bgElevated,
            t.flex,
            t.flexCol,
            t.relative,
            t.borderDefault,
            t.borderHairline,
            {
              borderRadius: 20,
            },
            animatedStyle,
          ]}
          onTouchStart={() => {
            scale.value = withSpring(0.9);
          }}
          onTouchEnd={() => {
            scale.value = withSpring(1);
          }}
        >
          <Pressable
            style={[
              t.inset0,
              t.pX2,
              t.pY1,
              t.wFull,
              t.itemsCenter,
              t.justifyCenter,
            ]}
            onPress={async () => {
              trackEvent(AnalyticsEvent.ClickProfileChannelStreak, {});

              showGlobalPrompt({ key: startChannelStreakPromptKey });
            }}
          >
            <View
              style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}
            >
              <Octicons
                name="star-fill"
                color={t.colors.text.secondary}
                size={14}
                style={[{ marginTop: 0.5 }]}
              />
              <Text2 color="secondary" size="sm" weight="semibold">
                Start a streak
              </Text2>
            </View>
          </Pressable>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          t.dark
            ? [t.bgDefault, t.borderHairline, { borderColor: '#ECA220' }]
            : [{ backgroundColor: '#EAB30526' }],
          t.flex,
          t.flexCol,
          t.relative,
          animatedStyle,
          { borderRadius: 20 },
        ]}
        onTouchStart={() => {
          scale.value = withSpring(0.9);
        }}
        onTouchEnd={() => {
          scale.value = withSpring(1);
        }}
      >
        <Pressable
          style={[
            t.inset0,
            t.pX2,
            t.pY1,
            t.wFull,
            t.itemsCenter,
            t.justifyCenter,
          ]}
          onPress={async () => {
            trackEvent(
              AnalyticsEvent.ClickProfileChannelStreakNavigateToChannel,
              {},
            );

            if (user.fid === currentUserFid) {
              showGlobalPrompt({ key: aboutChannelStreakPromptKey });
            } else {
              push('Channel', { channelKey: streak.channel.key });
            }
          }}
          onLongPress={async () => {
            if (isAdmin) {
              triggerImpactAsync();

              await stopActiveChannelStreak({ fid: currentUserFid });
            }
          }}
        >
          <View style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}>
            <View style={[t.relative]}>
              <ChannelRemoteImage
                channelImageUrl={streak.channel.imageUrl}
                size="feed"
              />
              <Svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={[
                  t.absolute,
                  t.bottom0,
                  t.right0,
                  { marginBottom: -2, marginRight: -4 },
                ]}
              >
                <Path
                  d="M5.77443 0.98137L5.32607 1.20268L5.77443 0.981369C5.62893 0.686608 5.32872 0.5 5 0.5C4.67128 0.5 4.37107 0.686608 4.22557 0.981369L3.30269 2.85103L1.23874 3.15271C0.913529 3.20024 0.643488 3.42825 0.542116 3.74089L1.01774 3.89511L0.542116 3.74089C0.440745 4.05353 0.525617 4.39662 0.761059 4.62594L2.25383 6.07989L1.90153 8.13399C1.84595 8.45801 1.97916 8.78549 2.24515 8.97871C2.51113 9.17193 2.86374 9.19738 3.15471 9.04436L5 8.07394L6.84529 9.04436C7.13626 9.19738 7.48887 9.17193 7.75485 8.97871C8.02083 8.78549 8.15405 8.45801 8.09847 8.13399L7.74617 6.07989L9.23894 4.62594C9.47438 4.39662 9.55926 4.05354 9.45788 3.74089L8.98226 3.89511L9.45788 3.74089C9.35651 3.42825 9.08647 3.20024 8.76126 3.15271L6.69731 2.85103L5.77443 0.98137Z"
                  fill="#EAB305"
                  stroke="#FCF4DA"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text2
              color="secondary"
              size="sm"
              weight="semibold"
              style={[{ color: '#ECA220' }]}
            >
              {`${Math.max(1, streak.streakCount)}d`}
            </Text2>
          </View>
        </Pressable>
      </Animated.View>
    );
  },
);

ChannelStreaksSelf.displayName = 'ChannelStreaksSelf';

export { ChannelStreaksSection };
