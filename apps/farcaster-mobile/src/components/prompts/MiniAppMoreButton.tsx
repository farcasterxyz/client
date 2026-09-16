import { Octicons } from '@expo/vector-icons';
import { sizes, Text } from 'farcaster-expo';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

interface MiniAppMoreButtonProps {
  onPress: () => void;
}

export const MiniAppMoreButton: React.FC<MiniAppMoreButtonProps> = React.memo(
  ({ onPress }) => {
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
        onPress={onPress}
      >
        <View style={[t.wFull, { paddingHorizontal: 6 }]}>
          <View
            style={[
              { borderRadius: 16, width: sizes.s17, height: sizes.s17 },
              t.bgMuted,
              t.itemsCenter,
              t.justifyCenter,
            ]}
          >
            <Octicons
              name="kebab-horizontal"
              size={24}
              color={t.colors.text.primary}
            />
          </View>
        </View>
        <Text style={[t.textXs, t.texts.primary, t.textCenter, t.mT2, t.h8]}>
          More
        </Text>
      </TouchableOpacity>
    );
  },
);

MiniAppMoreButton.displayName = 'MiniAppMoreButton';
