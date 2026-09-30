import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  CastClickType,
  formatShorthandNumber,
  resolveUsername,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useMemo } from 'react';
import { Alert, Pressable } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Text2 } from '~/components/Text';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';

const hitSlopValues = {
  left: 15,
  top: 11,
  right: 6,
  bottom: 11,
};

type ReplyIconProps = {
  size?: number;
  color?: string;
};

const ReplyIcon = memo(
  ({ size: baseSize, color: baseColor }: ReplyIconProps) => {
    const t = useTheme();
    const size = baseSize ?? 16;
    const color = baseColor ?? t.colors.text.tertiary;
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          fill={color}
          d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25v-7.5Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.75.75 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25H2.75Z"
        />
      </Svg>
    );
  },
);

const Replies = memo(
  ({
    cast,
    count,
    hideCounts = false,
    includeReason,
  }: {
    cast: ApiCast;
    count: number;
    hideCounts?: boolean;
    includeReason?: ApiCastFeedIncludeReason;
  }) => {
    const t = useTheme();
    const openComposer = useOpenComposer();
    const trackCastClick = useTrackCastClick();

    const onPress = useCallback(() => {
      if (cast.replyDisabled) {
        return;
      }

      if (cast.author.viewerContext?.blockedBy) {
        Alert.alert(
          'Unable to reply',
          `${resolveUsername({
            username: cast.author.username,
            fid: cast.author.fid,
          })} has blocked you. You cannot reply to their casts.`,
        );

        return;
      }

      trackCastClick({ type: CastClickType.Reply });

      const { intent } = createCastParamsWithIntent({
        parentCastHash: cast.hash,
        channelKey: cast.channel?.key,
        includeReason: includeReason?.type,
      });

      openComposer({ intent });
    }, [cast, includeReason?.type, openComposer, trackCastClick]);

    const stylePressable = useMemo(
      () => [t.flexRow, t.itemsCenter],
      [t.flexRow, t.itemsCenter],
    );

    const textStyles = useMemo(
      () => [
        {
          marginLeft: 4,
          width: 35,
        },
      ],
      [],
    );

    return (
      <Pressable
        hitSlop={hitSlopValues}
        style={stylePressable}
        onPress={onPress}
      >
        <ReplyIcon />
        {!hideCounts && (
          <Text2 style={textStyles} color="tertiary" size="sm">
            {count > 0 && formatShorthandNumber(count)}
          </Text2>
        )}
      </Pressable>
    );
  },
);

Replies.displayName = 'Replies';

export { Replies, ReplyIcon };
