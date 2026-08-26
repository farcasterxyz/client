import { ImageStyle } from 'expo-image';
import React, { FC, memo, useState } from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import { RemoteImage } from './RemoteImage';

type AutosizedRemoteImageProps = {
  height: number;
  imageUrl: string;
  style?: (ImageStyle & ViewStyle)[];
  shouldFadeIn?: boolean;
};

const AutosizedRemoteImage: FC<AutosizedRemoteImageProps> = memo(
  ({ height, imageUrl, shouldFadeIn = true, style }) => {
    const t = useTheme();

    const [width, setWidth] = useState<number>();

    return (
      <View
        style={[style, t.bgDefault, { height }]}
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
        }}
      >
        {width !== undefined && (
          <RemoteImage
            uri={imageUrl}
            recyclingKey={imageUrl}
            cachePolicy="memory-disk"
            contentFit="contain"
            height={height}
            shouldFadeIn={shouldFadeIn}
          />
        )}
      </View>
    );
  },
);

AutosizedRemoteImage.displayName = 'AutosizedRemoteImage';

export { AutosizedRemoteImage };
