import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { ApiFrame } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { Text } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

type ChunkedShareMiniAppTargetsProps = {
  row: number;
  miniApp: ApiFrame;
  onMiniAppPress: (miniApp: ApiFrame, row: number) => void;
};

const ChunkedShareMiniAppTargets: React.FC<ChunkedShareMiniAppTargetsProps> =
  React.memo(({ miniApp, onMiniAppPress, row }) => {
    const t = useTheme();
    return (
      <TouchableOpacity
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          { width: 80 },
          { marginHorizontal: 6 },
        ]}
        activeOpacity={0.75}
        onPress={() => onMiniAppPress(miniApp, row)}
      >
        <View style={[t.wFull, { paddingHorizontal: 6 }]}>
          <SimplerRemoteImage
            uri={miniApp.iconUrl}
            width={sizes.s17}
            height={sizes.s17}
            style={[{ borderRadius: 16 }]}
          />
        </View>
        <Text
          style={[t.textXs, t.texts.primary, t.textCenter, t.mT2, t.h8]}
          numberOfLines={1}
        >
          {miniApp.name}
        </Text>
      </TouchableOpacity>
    );
  });

ChunkedShareMiniAppTargets.displayName = 'ChunkedShareMiniAppTargets';

export { ChunkedShareMiniAppTargets };
