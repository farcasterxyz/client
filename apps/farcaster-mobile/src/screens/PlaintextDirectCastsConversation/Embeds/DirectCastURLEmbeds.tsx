import {
  ApiCastUrlEmbed,
  ApiDirectCastUrlEmbedDisplayMode,
} from 'farcaster-client-data';
import { isSnapEmbed } from 'farcaster-client-hooks';
import React from 'react';
import { View, ViewStyle } from 'react-native';

import { FrameEmbedNext } from '~/components/Frames/FrameEmbedNext';
import { SnapEmbedAttachment } from '~/components/Snap/SnapEmbedAttachment';
import { useTheme } from '~/contexts/ThemeProvider';
import { LaunchContext } from '~/hooks/useLaunchFrame';

import { DirectCastsOpenGraphCastAttachment } from './DirectCastURLEmbedRenderer';

type DirectCastURLEmbedsProps = {
  selfDirectCast: boolean;
  urlEmbeds: ApiCastUrlEmbed[];
  embedRoundingStyles: ViewStyle[];
  urlEmbedDisplayMode?: ApiDirectCastUrlEmbedDisplayMode;
};

const frameEmbedContext: LaunchContext = { type: 'launcher' };

const DirectCastURLEmbeds: React.FC<DirectCastURLEmbedsProps> = React.memo(
  ({ selfDirectCast, urlEmbeds, embedRoundingStyles, urlEmbedDisplayMode }) => {
    const t = useTheme();

    const embed = urlEmbeds[0];

    const embedBgStyle = React.useMemo(() => {
      return selfDirectCast
        ? [t.directCasts.bgSelfEmbed]
        : [t.directCasts.bgEmbed];
    }, [selfDirectCast, t.directCasts.bgEmbed, t.directCasts.bgSelfEmbed]);

    if (typeof embed === 'undefined' || embed === null) {
      return null;
    }

    if (embed.openGraph.frameEmbedNext) {
      return (
        <FrameEmbedNext
          frameEmbed={embed.openGraph.frameEmbedNext}
          context={frameEmbedContext}
        />
      );
    }

    if (isSnapEmbed(embed)) {
      return <SnapEmbedAttachment embed={embed} />;
    }

    const layout = urlEmbedDisplayMode === 'large' ? 'large' : 'compact';

    return (
      <View
        key={embed.openGraph.url}
        style={[
          t.flex1,
          embedRoundingStyles,
          t.borderDefault,
          t.borderHairline,
          embedBgStyle,
        ]}
      >
        <DirectCastsOpenGraphCastAttachment
          urlEmbed={embed}
          disabled={false}
          skipWrapperStyles={true}
          layout={layout}
        />
      </View>
    );
  },
);

DirectCastURLEmbeds.displayName = 'DirectCastURLEmbeds';

export { DirectCastURLEmbeds };
