import { Octicons } from '@expo/vector-icons';
import React, { FC } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

const AdvancedRecoveryOptionsRow: FC = () => {
  const t = useTheme();
  const push = usePush();

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => push('ListRecoveryOptions', {})}
        style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween, t.pY1]}
      >
        <Text style={[t.texts.primary, t.textBase]}>
          Advanced recovery options
        </Text>
        <Octicons name="chevron-right" size={18} style={[t.texts.tertiary]} />
      </TouchableOpacity>
    </View>
  );
};

export { AdvancedRecoveryOptionsRow };
