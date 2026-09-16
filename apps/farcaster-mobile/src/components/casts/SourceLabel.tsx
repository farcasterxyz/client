import { Octicons } from '@expo/vector-icons';
import {
  ApiCastFeedIncludeReason,
  ApiChannelMinimal,
} from 'farcaster-client-data';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface SourceLabelProps {
  includeReason: ApiCastFeedIncludeReason;
  channel?: ApiChannelMinimal;
}

const SourceLabel: FC<SourceLabelProps> = memo(({ includeReason, channel }) => {
  const t = useTheme();

  const channelName = channel?.name;
  const includeReasonType =
    includeReason.type as ApiCastFeedIncludeReason['type'];
  const icon = useMemo(
    () =>
      includeReasonType === 'pinned-in-channel' && channelName
        ? 'pin'
        : (includeReasonType === 'popular-in-channel' && channelName) ||
            includeReasonType === 'high-quality-unfollowed' ||
            includeReasonType === 'snap-promoted' ||
            includeReasonType === 'popular'
          ? 'north-star'
          : 'people',
    [channelName, includeReasonType],
  );

  const text = useMemo(() => {
    switch (includeReasonType) {
      case 'pinned-in-channel':
        return channelName ? `Pinned in ${channelName}` : undefined;
      case 'popular-in-channel':
        return channelName ? `Recommended in ${channelName}` : undefined;
      case 'high-quality-unfollowed':
        return 'This cast is similar to casts you engaged with.';
      case 'popular':
        return 'Trending';
      case 'snap-promoted':
        return 'Recommended because it includes a Snap';
      case 'follow-of-follow':
        return 'Liked by people you follow';
      case 'has-reply-by-followed':
        return 'Has replies by people you follow';
      case 'recasted-by-following':
        return 'Recasted by people you follow';
      default:
        return undefined;
    }
  }, [channelName, includeReasonType]);

  if (!text) {
    return null;
  }

  return (
    <View style={[t.flex, t.flexRow, t.flexShrink, t.flexGrow, t.itemsCenter]}>
      <View
        style={[
          t.flex,
          t.itemsCenter,
          t.justifyCenter,
          t.bgMuted,
          t.roundedFull,
          t.w9,
          t.h9,
        ]}
      >
        <Octicons name={icon} size={18} style={[t.texts.tertiary]} />
      </View>
      <Text style={[t.mL2, t.texts.secondary, t.textBase]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
});

export { SourceLabel };
