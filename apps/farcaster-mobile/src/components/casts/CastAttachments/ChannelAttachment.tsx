import { Ionicons } from '@expo/vector-icons';
import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type ChannelAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
  variant?: 'default' | 'direct-cast';
};

const ChannelAttachment: React.FC<ChannelAttachmentProps> = ({
  og,
  disabled,
  variant: _variant = 'default',
}) => {
  const t = useTheme();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  return (
    <Pressable
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexRow,
        t.wFull,
        { height: 64 },
      ]}
      onPress={() => {
        if (disabled) {
          return;
        }

        possiblyNavigateOrOpenUrl({ url: og.url });
      }}
    >
      <RemoteImage
        uri={og.image}
        fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
        style={[
          t.roundedL,
          t.borderRHairline,
          t.borderDefault,
          t.w16,
          t.h16,
          t.flex,
        ]}
        contentFit="cover"
      />
      <View
        style={[t.flex, t.flex1, t.flexGrow, t.flexCol, t.p2, t.justifyCenter]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <Text style={[t.fontMedium, t.texts.primary]} numberOfLines={1}>
            {og.title}{' '}
            {typeof og.channel !== 'undefined' && (
              <Text style={[t.texts.tertiary, t.textSm]}>
                · /{og.channel.key}
              </Text>
            )}
          </Text>
          <View style={[t.flexRow, t.itemsCenter, t.mL2]}>
            <Ionicons
              name={'person-outline'}
              size={10}
              style={[t.texts.tertiary, t.mR1]}
            />
            <Text
              style={[t.texts.tertiary, t.textRight, t.flexShrink0, t.textXs]}
            >
              {formatShorthandNumber(og.channel?.followerCount || 0)}
            </Text>
          </View>
        </View>
        <Text style={[t.texts.tertiary]} numberOfLines={2}>
          {og.description}
        </Text>
      </View>
    </Pressable>
  );
};

export { ChannelAttachment };
