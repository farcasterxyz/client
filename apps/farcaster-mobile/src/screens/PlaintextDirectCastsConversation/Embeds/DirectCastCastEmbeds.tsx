import { ApiQuoteCastEmbed } from 'farcaster-client-data';
import React from 'react';
import { View, ViewStyle } from 'react-native';

import { QuoteCast } from '~/components/casts/CastAttachments/QuoteCast';
import { useTheme } from '~/contexts/ThemeProvider';

type DirectCastCastEmbedsProps = {
  selfDirectCast: boolean;
  castEmbeds: ApiQuoteCastEmbed[];
  embedRoundingStyles: ViewStyle[];
};

const DirectCastCastEmbeds: React.FC<DirectCastCastEmbedsProps> = React.memo(
  ({ selfDirectCast, castEmbeds, embedRoundingStyles }) => {
    const t = useTheme();

    const embedBgStyle = React.useMemo(() => {
      return selfDirectCast
        ? [t.directCasts.bgSelfEmbed]
        : [t.directCasts.bgEmbed];
    }, [selfDirectCast, t.directCasts.bgEmbed, t.directCasts.bgSelfEmbed]);

    return (
      <>
        {castEmbeds.map((cast) => (
          <View
            key={cast.hash}
            style={[
              t.flex1,
              embedRoundingStyles,
              t.borderDefault,
              t.borderHairline,
              embedBgStyle,
            ]}
          >
            <QuoteCast cast={cast} inversedTextColors={false} />
          </View>
        ))}
      </>
    );
  },
);

DirectCastCastEmbeds.displayName = 'DirectCastCastEmbeds';

export { DirectCastCastEmbeds };
