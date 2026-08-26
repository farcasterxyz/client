import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';

type DebugNewOnboardingScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugNewOnboarding'
>;

const DebugNewOnboardingScreen = buildScreen<DebugNewOnboardingScreenProps>(
  { name: 'DebugNewOnboarding' },
  () => {
    const t = useTheme();

    const navigate = useNavigate();

    const onStartOnboardingPress = React.useCallback(() => {
      navigate('Onboarding', { error: undefined });
    }, [navigate]);

    return (
      <View style={[t.wFull, t.hFull, t.p4]}>
        <Button
          title="Start onboarding"
          size="sm"
          style={[t.mY4]}
          onPress={onStartOnboardingPress}
        />
      </View>
    );
  },
);

DebugNewOnboardingScreen.displayName = 'DebugNewOnboardingScreen';

export { DebugNewOnboardingScreen };
