import { formatPercent } from 'farcaster-client-hooks';
import { Triangle } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { Text2, TextSize } from './Text';
interface PercentChangePillProps {
  percent: number;
  size: TextSize;
}

export function PercentChangePill({ percent, size }: PercentChangePillProps) {
  const t = useTheme();

  const backgroundColor =
    percent === 0
      ? t.colors.background.tertiary
      : percent > 0
        ? t.colors.background.success
        : t.colors.background.danger;

  const textColor =
    percent === 0
      ? t.colors.text.tertiary
      : percent > 0
        ? t.colors.text.success
        : t.colors.text.danger;

  const triangleIcon =
    percent >= 0 ? (
      <Triangle size={6} fill={textColor} color={textColor} />
    ) : (
      // Wrapping in a View to apply rotation - transforming the Triangle directly causes it to disappear on Web
      <View style={{ transform: [{ rotate: '180deg' }] }}>
        <Triangle size={6} fill={textColor} color={textColor} />
      </View>
    );

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.roundedLg,
        t.pX1,
        { gap: 4, paddingVertical: 2, backgroundColor },
      ]}
    >
      {triangleIcon}
      <Text2 size={size} weight="semibold" style={{ color: textColor }}>
        {formatPercent({ value: percent })}
      </Text2>
    </View>
  );
}
