import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';
import { UnauthedStackParamList } from '~/types';

type RecoveryNotFoundScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'RecoveryNotFound'
>;

/**
 * This screen is only accessible via deep link. If the user has a recovery in
 * progress this screen won't get navigated to since the app will be locked in
 * recovery mode. The only time they'll see this screen is if they click the
 * link on a different device than the one they started the recovery on.
 */
function RecoveryNotFoundScreenContent() {
  const t = useTheme();
  const popToTop = usePopToTop();

  return (
    <View style={[t.hFull, t.p4, t.pB8]}>
      <View style={[t.flexGrow, t.justifyCenter, t.mB20]}>
        <Text style={[t.texts.primary, t.textXl, t.textCenter, t.fontBold]}>
          No recovery in progress
        </Text>
        <Text style={[t.texts.primary, t.textBase, t.textCenter, t.mT3]}>
          Open this link on the device you started the recovery on
        </Text>
      </View>
      <View style={[t.flexNone]}>
        <AtomsButton size="l" hierarchy="primary" onPress={popToTop}>
          Go back
        </AtomsButton>
      </View>
    </View>
  );
}

export const RecoveryNotFoundScreen = buildScreen<RecoveryNotFoundScreenProps>(
  {
    name: 'RecoveryNotFound',
  },
  RecoveryNotFoundScreenContent,
);
