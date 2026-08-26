import { Ionicons } from '@expo/vector-icons';
import { Avatar, Text2 } from 'farcaster-expo';
import React, { memo } from 'react';
import { TouchableHighlight, View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type CollectibleCardProps = {
  card: {
    id: string;
    walletAddress: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
  isSelected: boolean;
  onPress: () => void;
  showCheckbox?: boolean;
};

export const CollectibleCard = memo(function CollectibleCard({
  card,
  isSelected,
  onPress,
  showCheckbox = false,
}: CollectibleCardProps) {
  const t = useTheme();

  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={t.dark ? '#2E2835' : '#F5F5F5'}
      style={[
        t.bgDefault,
        t.borderDefault,
        t.border,
        { borderRadius: 24 },
        t.p4,
        isSelected && showCheckbox && [t.borderActive, t.border2],
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter]}>
        <Avatar pfpUrl={card.avatarUrl} diameter={48} style={[t.mR3]} />

        <View style={[t.flex]}>
          <Text2 style={[t.textBase, t.fontSemibold, t.texts.primary]}>
            {card.displayName}
          </Text2>
          <Text2 style={[t.textSm, t.texts.secondary]}>@{card.username}</Text2>
          <Text2 style={[t.textXs, t.texts.secondary, t.mT1]}>
            {card.walletAddress}
          </Text2>
        </View>

        {showCheckbox && (
          <View style={[t.mL3]}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? t.colors.text.brand : t.colors.text.secondary}
            />
          </View>
        )}
      </View>
    </TouchableHighlight>
  );
});
