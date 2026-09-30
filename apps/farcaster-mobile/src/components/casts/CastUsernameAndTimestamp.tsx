import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCastFeedIncludeReason,
  ApiChannelMinimal,
} from 'farcaster-client-data';
import {
  CastClickType,
  formatTimeAgo,
  resolveUsernameShort,
  useTrackCastClick,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Badge, IconBadge } from '~/components/Badge';
import {
  ChannelTagPressable,
  channelTagTextColorGenerator,
} from '~/components/ChannelsV3/ChannelTagPressable';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { TwoPeopleIcon } from '~/components/icons/TwoPeopleIcon';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useNavigateToFeed } from '~/hooks/navigation/useNavigateToFeed';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

type CastUsernameAndTimestampProps = {
  fid: number;
  username: string | undefined;
  isProUser?: boolean;
  timestamp: number;
  // This is used in direct casts and renders on a bright purple background,
  // so not just dark mode but it's own scheme
  inversedTextColors?: boolean;
  isFocusedCast?: boolean;
  showMemberBadge?: boolean;
  channel: ApiChannelMinimal | undefined;
  variant?: 'direct-cast' | 'default';
  hideTimestamp?: boolean;
  onPress?: () => void;
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
};

const channelOnCastHitSlop = {
  left: sizes.s1,
  top: sizes.s1,
  right: sizes.s1,
  bottom: sizes.s1,
};

const CastUsernameAndTimestamp = memo(
  ({
    fid,
    timestamp,
    username,
    isProUser = false,
    inversedTextColors = false,
    showMemberBadge = false,
    isFocusedCast,
    channel,
    variant = 'default',
    hideTimestamp = false,
    onPress: onPressProp,
    profileOpenIncludeReason,
  }: CastUsernameAndTimestampProps) => {
    const t = useTheme();
    const { shouldLinkToUser } = useUserLinkHelpers();
    const trackCastClick = useTrackCastClick();
    const { trackEvent } = useAnalytics();
    const navigateToFeed = useNavigateToFeed();
    const bodyTextStyles = useCastBodyTextStyle(isFocusedCast);
    const pushToUserProfile = usePushToUserProfile();

    const usernameToDisplay = useMemo(
      () =>
        resolveUsernameShort({
          username,
          fid,
        }),
      [fid, username],
    );

    const onPress = useCallback(() => {
      if (shouldLinkToUser({ fid })) {
        trackCastClick({ type: CastClickType.Author });
        if (onPressProp) {
          onPressProp();
          return;
        }
        pushToUserProfile({
          fid,
          ...(profileOpenIncludeReason
            ? { profileOpenIncludeReason: profileOpenIncludeReason }
            : {}),
        });
      }
    }, [
      fid,
      onPressProp,
      profileOpenIncludeReason,
      pushToUserProfile,
      shouldLinkToUser,
      trackCastClick,
    ]);

    const timeStringChannelsV3 = useMemo(() => {
      if (hideTimestamp) {
        return null;
      } else {
        return formatTimeAgo(timestamp, 'floor');
      }
    }, [timestamp, hideTimestamp]);

    const faintColor = React.useMemo(
      () => (inversedTextColors ? '#ffffff' : t.colors.text.tertiary),
      [inversedTextColors, t.colors.text.tertiary],
    );

    // Badges are sibling views that must sit between the username and the
    // rest of the row, so the single-Text merge below only applies without
    // them.
    const hasInlineBadges = isProUser || showMemberBadge;

    return useMemo(
      () =>
        isFocusedCast ? (
          <View style={[t.flexGrow]}>
            <View
              style={[
                t.maxWFull,
                t.flexGrow,
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.overflowHidden,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[...bodyTextStyles, t.texts.tertiary]}
                ellipsizeMode="middle"
              >
                <TextWithPress
                  onPress={onPress}
                  style={[t.texts.primary, t.fontSemibold]}
                >
                  {resolveUsernameShort({ username, fid })}
                </TextWithPress>
              </Text>
              {isProUser && <FarcasterProBadge size={18} style={[t.mL1]} />}
              <Text> {timeStringChannelsV3}</Text>
            </View>
            {showMemberBadge && (
              <View style={[t.mT1, t.selfStart]}>
                <Badge
                  size="xs"
                  color="secondary"
                  Icon={({ color }) => (
                    <TwoPeopleIcon color={color} size={11} />
                  )}
                  label="Member"
                />
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              t.maxWFull,
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.overflowHidden,
              { marginBottom: 2, gap: 4 },
              isFocusedCast
                ? undefined
                : {
                    // matches the height of the pill
                    height: 22,
                  },
            ]}
          >
            <Text>
              <TextWithPress
                onPress={onPress}
                style={[
                  ...bodyTextStyles,
                  t.fontSemibold,
                  {
                    color: t.dark || inversedTextColors ? '#ffffff' : '#000000',
                  },
                ]}
              >
                {usernameToDisplay}
              </TextWithPress>
              {!hasInlineBadges && channel && (
                <Text
                  style={[
                    t.fontNormal,
                    ...bodyTextStyles,
                    {
                      color: channelTagTextColorGenerator({
                        inversed: inversedTextColors,
                        dark: t.dark,
                      }),
                    },
                  ]}
                >
                  {' in'}
                </Text>
              )}
              {!hasInlineBadges &&
                !channel &&
                timeStringChannelsV3 !== null && (
                  <Text
                    style={[
                      ...bodyTextStyles,
                      t.fontNormal,
                      { color: faintColor },
                    ]}
                  >
                    {` ${timeStringChannelsV3}`}
                  </Text>
                )}
            </Text>
            {isProUser && <FarcasterProBadge size={18} />}
            {showMemberBadge && (
              <IconBadge size="xs" color="secondary" Icon={TwoPeopleIcon} />
            )}
            {hasInlineBadges && channel && (
              <Text
                style={[
                  t.fontNormal,
                  ...bodyTextStyles,
                  {
                    color: channelTagTextColorGenerator({
                      inversed: inversedTextColors,
                      dark: t.dark,
                    }),
                  },
                ]}
              >
                in
              </Text>
            )}
            {channel && (
              <View style={[t.flexShrink]}>
                <ChannelTagPressable
                  channel={channel}
                  inversedTextColors={inversedTextColors}
                  hitSlop={channelOnCastHitSlop}
                  onPress={() => {
                    trackEvent(AnalyticsEvent.PressChannelNavCastTag, {
                      feedKey: channel.key,
                    });
                    navigateToFeed(channel.key);
                  }}
                  size="feed"
                  variant={variant}
                />
              </View>
            )}
            {(hasInlineBadges || channel) && timeStringChannelsV3 !== null && (
              <Text
                style={[...bodyTextStyles, t.fontNormal, { color: faintColor }]}
              >
                {timeStringChannelsV3}
              </Text>
            )}
          </View>
        ),
      [
        bodyTextStyles,
        channel,
        faintColor,
        fid,
        hasInlineBadges,
        inversedTextColors,
        isFocusedCast,
        isProUser,
        navigateToFeed,
        onPress,
        showMemberBadge,
        t.dark,
        t.flex,
        t.flexGrow,
        t.flexRow,
        t.flexShrink,
        t.fontNormal,
        t.fontSemibold,
        t.itemsCenter,
        t.mL1,
        t.mT1,
        t.maxWFull,
        t.overflowHidden,
        t.selfStart,
        t.texts.primary,
        t.texts.tertiary,
        timeStringChannelsV3,
        trackEvent,
        username,
        usernameToDisplay,
        variant,
      ],
    );
  },
);

CastUsernameAndTimestamp.displayName = 'CastUsernameAndTimestamp';

export { CastUsernameAndTimestamp };
