import * as React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type ImagePileProps = {
  images: Array<{
    node: React.ReactNode;
    key: string;
  }>;
};
const ImagePile: React.FC<ImagePileProps> = React.memo(({ images }) => {
  const t = useTheme();
  const children = images.map(({ node, key }, index) => (
    <View
      key={key}
      style={[
        {
          marginLeft: index > 0 ? -12 : 0,
          zIndex: 2 - index,
        },
        t.border,
        t.borderBackground,
        t.roundedFull,
      ]}
    >
      {node}
    </View>
  ));
  return <View style={[t.mR2, t.flexRow]}>{children}</View>;
});

export { ImagePile };
