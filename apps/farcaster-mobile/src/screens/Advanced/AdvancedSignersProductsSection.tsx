import React, { FC } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { canAccessAdvancedSignerProducts } from '~/utils/IAPUtils';

const AdvancedSignersProductsSection: FC = () => {
  const t = useTheme();
  const push = usePush();

  const { fid } = useCurrentUser_UNSAFE();

  const showAdvancedSigners = canAccessAdvancedSignerProducts({ fid });

  if (!showAdvancedSigners) {
    return null;
  }

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          Advanced Signers
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        Puchasing signers will allow onchain transactions.
      </Text>
      <View>
        <Button
          title="Purchase advanced signers"
          onPress={() => {
            push('AdvancedSigners', {});
          }}
          variant="normal"
          style={[t.mT6]}
        />
      </View>
    </View>
  );
};

export { AdvancedSignersProductsSection };
