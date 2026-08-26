import React, { FC, memo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { FeedImage } from '~/components/FeedImage';
import { Warp } from '~/components/Warp';
import { useTheme } from '~/contexts/ThemeProvider';

type FeedImageWithWarpLogoProps = {
  imageUrl?: string;
  style?: StyleProp<ViewStyle>;
};

const FeedImageWithWarpLogo: FC<FeedImageWithWarpLogoProps> = memo(
  ({ imageUrl, style }) => {
    const t = useTheme();

    return (
      <View style={style}>
        <FeedImage size={48} imageUrl={imageUrl} />
        <View
          style={[
            t.flexCol,
            t.itemsCenter,
            t.justifyCenter,
            t.roundedFull,
            t.borderBackground,
            t.overflowHidden,
            {
              borderWidth: 1.5,
              position: 'absolute',
              top: 29,
              left: 29,
            },
          ]}
        >
          <View
            style={[
              t.flex,
              t.justifyCenter,
              t.itemsCenter,
              t.bgAction,
              { width: 21, height: 21 },
            ]}
          >
            <Warp size="base" fill={t.colors.text.light} />
          </View>
        </View>
      </View>
    );
  },
);

FeedImageWithWarpLogo.displayName = 'FeedImageWithWarpLogo';

export { FeedImageWithWarpLogo };
