import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type AppAttachmentProps = {
  og: ApiOpenGraphMetadata;
  variant?: 'default' | 'direct-cast';
};

const AppAttachment: React.FC<AppAttachmentProps> = ({
  og,
  variant: _variant,
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexRow,
        t.wFull,
        { height: 64 },
      ]}
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
            {og.title}
          </Text>
        </View>
        <Text style={[t.texts.tertiary]} numberOfLines={2}>
          {og.description}
        </Text>
      </View>
    </View>
  );
};

export { AppAttachment };
