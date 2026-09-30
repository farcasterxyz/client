import { Octicons } from '@expo/vector-icons';
import { ApiUserCastAction } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface CastActionErrorToastProps extends ToastProps {
  data?: { castAction: ApiUserCastAction; link?: string };
}

const CastActionErrorToast: React.FC<CastActionErrorToastProps> = ({
  message,
  data,
}) => {
  const t = useTheme();

  const icon = data?.castAction.octicon ?? 'apps';

  return (
    <View
      style={[
        t.p4,
        t.bgCastActionError,
        { borderRadius: t.borderRadiuses.$12 },
        t.border,
        t.flex,
        t.flexCol,
        t.mB1,
        { maxWidth: '80%', borderColor: t.colors.red500 },
        t.relative,
      ]}
    >
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter]}>
        <Octicons
          name={icon as keyof typeof Octicons.glyphMap}
          size={18}
          style={[{ color: t.colors.text.danger }, t.mR4]}
        />
        <Text style={[t.texts.primary, t.flexShrink]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  );
};

export { CastActionErrorToast };
