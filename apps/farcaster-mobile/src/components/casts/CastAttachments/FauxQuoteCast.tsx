import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React from 'react';
import { Image, Pressable, View } from 'react-native';

import { Text } from '~/components/Text';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

interface FauxQuoteCastProps {
  og: ApiOpenGraphMetadata;
}

const FauxQuoteCast: React.FC<FauxQuoteCastProps> = ({ og }) => {
  const t = useTheme();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();
  const textStyles = useCastBodyTextStyle();
  const trackCastClick = useTrackCastClick();

  const title = React.useMemo(() => {
    return `${
      og.title?.indexOf('Farcaster') !== -1
        ? og.title?.split('on Farcaster')[0]
        : og.title?.split('on Warpcast')[0]
    }`;
  }, [og.title]);

  return (
    <Pressable
      style={[
        t.flex,
        t.rounded,
        t.borderDefault,
        t.borderHairline,
        t.flexRow,
        t.mT2,
        t.wFull,
      ]}
      onPress={() => {
        // This is always an internal link so just emit an event
        trackCastClick({ type: CastClickType.IntLink });

        possiblyNavigateOrOpenUrl({ url: og.url });
      }}
    >
      <View style={[t.flexCol, t.pB3, t.pT2, t.flexShrink, t.flexGrow]}>
        <View style={[t.flexRow, t.itemsCenter]}>
          <Image
            source={require('~/assets/images/open-graph/Farcaster.webp')}
            style={[t.roundedSm, t.w5, t.h5, { marginLeft: 10 }]}
            resizeMode="cover"
          />
          <Text
            style={[t.mL1, t.texts.primary, ...textStyles]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Text style={[t.pT1, t.pX3, t.texts.secondary, t.textSm, t.fontNormal]}>
          {og.description}
        </Text>
      </View>
    </Pressable>
  );
};

export { FauxQuoteCast };
