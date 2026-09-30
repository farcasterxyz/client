import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { RemoteImage } from '~/components/RemoteImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type RichWarpcastAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
  skipWrapperStyles: boolean;
};

const RichWarpcastAttachment: React.FC<RichWarpcastAttachmentProps> = ({
  og,
  disabled,
}) => {
  const t = useTheme();

  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  return (
    <TouchableOpacity
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexCol,
        t.wFull,
        t.shadow,
        t.overflowHidden,
        t.relative,
      ]}
      onPress={() => {
        if (disabled) {
          return;
        }

        possiblyNavigateOrOpenUrl({ url: og.url });
      }}
      activeOpacity={0.95}
    >
      <RemoteImage
        uri={og.image}
        style={[
          t.roundedT,
          t.borderBHairline,
          t.borderDefault,
          t.wFull,
          { aspectRatio: 1.91 },
        ]}
        cachePolicy="memory-disk"
        recyclingKey={og.image}
        contentFit="cover"
        contentPosition={'top left'}
      />
      <View
        style={[
          t.flex,
          t.flexCol,
          t.justifyCenter,
          t.p2,
          t.borderTHairline,
          t.borderDefault,
          t.bgDefault,
          t.wFull,
          t.roundedBLg,
        ]}
      >
        <Text2 weight="regular" color="primary">
          {og.title}
        </Text2>
        <Text2 weight="regular" size={'sm'} color="tertiary">
          {og.description}
        </Text2>
      </View>
    </TouchableOpacity>
  );
};

export { RichWarpcastAttachment };
