import { ApiFrame } from 'farcaster-client-data';
import { Text2 } from 'farcaster-expo';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { useTheme } from '~/contexts/ThemeProvider';

interface MiniAppShareExtensionRowProps {
  item: ApiFrame;
  index: number;
  numItems: number;
  onPress: (item: ApiFrame, index: number) => void;
}

export const MiniAppShareExtensionRow: React.FC<MiniAppShareExtensionRowProps> =
  React.memo(({ item, index, onPress, numItems }) => {
    const t = useTheme();

    return (
      <TouchableOpacity
        style={[
          // Top rounded corners
          index === 0
            ? { borderTopLeftRadius: 12, borderTopRightRadius: 12 }
            : undefined,
          // Bottom rounded corners
          index === numItems - 1
            ? { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }
            : undefined,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.p3,
          t.bgLightGray,
          { gap: 6 },
        ]}
        activeOpacity={0.75}
        onPress={() => {
          onPress(item, index);
        }}
      >
        <SimplerRemoteImage
          uri={item.iconUrl}
          width={32}
          height={32}
          style={[{ borderRadius: 16 }]}
        />
        <Text2 numberOfLines={1}>{item.name}</Text2>
      </TouchableOpacity>
    );
  });

MiniAppShareExtensionRow.displayName = 'MiniAppShareExtensionRow';
