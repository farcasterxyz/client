import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { View } from 'react-native';

import { hitSlop } from '../../constants';
import { useTheme } from '../../contexts';
import { AnimatedPressable } from './AnimatedPressable';
import { Text2 } from './Text';

export function ExpandToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();

  return (
    <View style={[t.p3, t.flexRow]}>
      <AnimatedPressable
        style={[
          t.p2,
          t.pL3,
          t.roundedFull,
          { gap: 2 },
          t.flexRow,
          t.itemsCenter,
          t.backgrounds.secondary,
        ]}
        hitSlop={hitSlop}
        onPress={onToggle}
      >
        {expanded ? (
          <>
            <Text2 color="secondary" size="sm" weight="medium">
              Show less
            </Text2>
            <ChevronUp color={t.colors.text.secondary} size={20} />
          </>
        ) : (
          <>
            <Text2 color="secondary" size="sm" weight="medium">
              Show all
            </Text2>
            <ChevronDown color={t.colors.text.secondary} size={20} />
          </>
        )}
      </AnimatedPressable>
    </View>
  );
}
