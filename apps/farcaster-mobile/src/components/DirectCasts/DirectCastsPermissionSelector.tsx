import { Octicons } from '@expo/vector-icons';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type DirectCastsPermissionSelectorPermission<T> = {
  value: T;
  title: string;
};

type Props<T> = {
  options: DirectCastsPermissionSelectorPermission<T>[];
  value: T;
  onChange: (newValue: T) => void;
};

function DirectCastsPermissionSelector<T>({
  options,
  value,
  onChange,
}: Props<T>) {
  const t = useTheme();

  const rows = options.map((option, i) => (
    <View
      style={[
        t.flexRow,
        i !== 0 && t.borderTHairline,
        i !== 0 && t.borderDefault,
      ]}
      key={option.title}
    >
      <TouchableOpacity
        style={[
          t.flex1,
          t.flexRow,
          t.itemsEnd,
          t.itemsCenter,
          t.justifyBetween,
          t.p3,
        ]}
        activeOpacity={0.75}
        onPress={() => onChange(option.value)}
      >
        <Text style={[t.textBase, t.texts.primary]}>{option.title}</Text>
        {value === option.value ? (
          <View
            style={[
              t.roundedFull,
              t.h6,
              t.w6,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.bgActionPrimary,
            ]}
          >
            <Octicons name="check" size={18} style={[t.texts.light]} />
          </View>
        ) : (
          <View style={[t.roundedFull, t.h6, t.w6, t.bgElevated]} />
        )}
      </TouchableOpacity>
    </View>
  ));

  return (
    <View
      style={[
        t.mY1,
        t.mX3,
        t.borderHairline,
        t.borderDefault,
        t.roundedLg,
        t.justifyBetween,
      ]}
    >
      {rows}
    </View>
  );
}

export { DirectCastsPermissionSelector };
