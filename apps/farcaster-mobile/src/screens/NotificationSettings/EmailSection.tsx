import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useOnboardingState } from '~/hooks/data/useOnboardingState';
import { usePush } from '~/hooks/navigation/usePush';

const EmailSection: React.FC = () => {
  const t = useTheme();

  const {
    result: {
      state: { email },
    },
  } = useOnboardingState();

  const push = usePush();
  const onPress = React.useCallback(() => {
    push('EditEmail', {});
  }, [push]);

  let emailValue;
  if (email) {
    emailValue = <Text style={[t.texts.primary, t.textBase]}>{email}</Text>;
  } else {
    emailValue = (
      <Text style={[t.texts.tertiary, t.textBase]}>
        You haven't provided an email yet
      </Text>
    );
  }

  return (
    <TouchableOpacity
      style={[t.flexRow, t.pX3, t.justifyBetween]}
      onPress={onPress}
    >
      <View>
        <Text style={[t.texts.primary, t.textBase, t.fontBold, t.mB1]}>
          Email address
        </Text>
        <Text style={[t.texts.tertiary, t.textBase]}>
          Used for account recovery and notifications.
        </Text>
        <View style={[t.flexRow, t.mY3, { gap: 15 }]}>
          <Text style={[t.texts.secondary, t.textBase]}>Email</Text>
          {emailValue}
        </View>
      </View>
      <Ionicons
        name="chevron-forward-outline"
        size={24}
        style={[t.selfCenter, t.texts.primary]}
      />
    </TouchableOpacity>
  );
};

export { EmailSection };
