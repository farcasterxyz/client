import { Octicons } from '@expo/vector-icons';
import { ApiChannel } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  useGloballyCachedChannel,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { FeedImage } from '~/components/FeedImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type SearchListChannelProps = {
  channel: ApiChannel;
};

const SearchListChannel: FC<SearchListChannelProps> = memo(
  ({ channel: fallbackChannel }) => {
    const t = useTheme();
    const navigate = useNavigate();

    const channel = useGloballyCachedChannel({ fallback: fallbackChannel });

    const nameKeyFollowers = useMemo(
      () => (
        <View style={[t.flexCol, t.wFull]}>
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Text2 weight="semibold">{channel.name}</Text2>
          </View>
          <View style={[t.flexRow, t.itemsCenter]}>
            <Text2 color="secondary">/{channel.key}</Text2>
          </View>
          <View style={[t.flexRow, t.itemsCenter, t.pY1]}>
            <Octicons
              name={'person-fill'}
              size={15}
              style={[t.texts.secondary, t.mR1]}
            />
            <Text2 color="secondary">
              {`${formatShorthandNumber(channel.followerCount || 0)} ${
                channel.followerCount === 1 ? 'follower' : 'followers'
              }`}
            </Text2>
          </View>
        </View>
      ),
      [
        channel.followerCount,
        channel.key,
        channel.name,
        t.flex,
        t.flexCol,
        t.flexRow,
        t.itemsCenter,
        t.mR1,
        t.pY1,
        t.texts.secondary,
        t.wFull,
      ],
    );

    const row = (
      <View
        style={[
          t.pX4,
          t.borderDefault,
          t.borderBHairline,
          t.pY3,
          t.flexRow,
          t.justifyBetween,
          t.itemsCenter,
        ]}
      >
        <FeedImage size={48} imageUrl={channel.imageUrl} />
        <View style={[t.flex1, t.flexCol, t.pL2]}>{nameKeyFollowers}</View>
      </View>
    );

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          navigate('Channel', {
            channelKey: channel.key,
          });
        }}
      >
        {row}
      </TouchableOpacity>
    );
  },
);

SearchListChannel.displayName = 'SearchListChannel';

export { SearchListChannel };
