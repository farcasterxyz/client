import { formatShorthandNumber } from 'farcaster-client-hooks';
import { Text2, useTheme } from 'farcaster-expo';
import { EyeIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export function ArticleViewCount({
  articleViewCount,
}: {
  articleViewCount: number;
}) {
  const t = useTheme();

  const iconColor = t.dark ? t.colors.text.secondary : t.colors.text.quaternary;
  const color = t.dark ? 'secondary' : 'quaternary';

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.pX2,
        t.rounded,
        {
          backgroundColor: t.colors.background.secondary,
        },
      ]}
    >
      <EyeIcon size={10} color={iconColor} style={[t.mR1]} />
      <Text2 weight="medium" size="xs" color={color}>
        {formatShorthandNumber(articleViewCount)}
      </Text2>
    </View>
  );
}
