import { Octicons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type OctIconName = ComponentProps<typeof Octicons>['name'];

type ScreenActionPressableProps = {
  variant: 'default' | 'danger';
  onPress: () => void;
  loading: boolean;
  title: string;
  iconName?: OctIconName;
  iconElement?: React.ReactNode;
};

const ScreenActionPressable: React.FC<ScreenActionPressableProps> = ({
  variant,
  onPress,
  loading,
  title,
  iconName,
  iconElement,
}) => {
  const t = useTheme();

  return (
    <TouchableOpacity
      style={[
        t.flex1,
        t.p2,
        t.pY3,
        t.bgDefault,
        t.borderDefault,
        t.borderHairline,
        t.m1,
        t.roundedLg,
        t.flex,
        t.itemsCenter,
        t.justifyCenter,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[t.flex, t.itemsCenter, t.justifyCenter, t.flexRow]}>
        {loading ? (
          <LoadingIndicator />
        ) : iconElement ? (
          iconElement
        ) : (
          <Octicons
            name={iconName}
            size={18}
            style={[
              variant === 'default' ? t.texts.primary : t.texts.danger,
              { fontWeight: 600 },
            ]}
          />
        )}
      </View>
      <Text
        style={[
          t.pT2,
          variant === 'default' ? t.texts.primary : t.texts.danger,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

ScreenActionPressable.displayName = 'ScreenActionPressable';

export { ScreenActionPressable };
