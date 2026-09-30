import { Octicons } from '@expo/vector-icons';
import { ApiChannel, ApiUserChannelsCategory } from 'farcaster-client-data';
import { useGloballyCachedChannel } from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';

import { Badge } from '~/components/Badge';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useChannelMenu } from '~/contexts/ChannelMenuProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';

import { ChannelRemoteImage } from './ChannelRemoteImage';

type ChannelForCategoryProps = {
  channel: ApiChannel;
  category: ApiUserChannelsCategory;
  skipSeperator?: boolean;
};

const ChannelForCategory: React.FC<ChannelForCategoryProps> = ({
  channel: fallbackChannel,
  skipSeperator = false,
}) => {
  const navigate = useNavigate();
  const t = useTheme();

  const channel = useGloballyCachedChannel({ fallback: fallbackChannel });

  const channelRole = useUserChannelRole(channel);

  const isOwner = channelRole === 'owner';

  const name = React.useMemo(
    () => (
      <View style={[t.flexCol, t.wFull]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <Text
            style={[t.texts.primary, t.fontSemibold]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {channel.name}
          </Text>
          {isOwner && <Badge color="primary" label="Owner" size="xs" />}
        </View>
        <Text
          style={[t.texts.secondary, t.flexShrink]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          /{channel.key}
        </Text>
      </View>
    ),
    [
      channel.key,
      channel.name,
      isOwner,
      t.flex,
      t.flexCol,
      t.flexRow,
      t.flexShrink,
      t.fontSemibold,
      t.itemsCenter,
      t.texts.primary,
      t.texts.secondary,
      t.wFull,
    ],
  );

  const { openMenu } = useChannelMenu();

  const onActionPress = React.useCallback(() => {
    openMenu('relation');
  }, [openMenu]);

  const action = React.useMemo(() => {
    return (
      <Pressable
        onPress={onActionPress}
        hitSlop={hitSlop}
        style={[
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          {
            height: 34,
            width: 34,
          },
        ]}
      >
        <Octicons
          name="kebab-horizontal"
          size={16}
          color={t.colors.text.primary}
        />
      </Pressable>
    );
  }, [
    onActionPress,
    t.colors.text.primary,
    t.itemsCenter,
    t.justifyCenter,
    t.roundedFull,
  ]);

  const row = React.useMemo(() => {
    return (
      <View
        style={[t.borderDefault, t.p3, !skipSeperator && t.borderBHairline]}
      >
        <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <ChannelRemoteImage
              channelImageUrl={channel.imageUrl}
              size="composer-selector-large"
            />
            <View style={[t.flex]}>{name}</View>
          </View>
          {action}
        </View>
      </View>
    );
  }, [
    action,
    channel.imageUrl,
    name,
    skipSeperator,
    t.borderBHairline,
    t.borderDefault,
    t.flex,
    t.flexRow,
    t.itemsCenter,
    t.justifyBetween,
    t.p3,
  ]);

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
};

ChannelForCategory.displayName = 'ChannelForCategory';

export { ChannelForCategory };
