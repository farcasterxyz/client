import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type SelectOneOption<T> = {
  value: T;
  title: string;
  subtitle?: string;
};

type SelectOneProps<T> = {
  title?: React.ReactNode;
  options: SelectOneOption<T>[];
  value: T;
  onChange: (newValue: T) => void;
  style?: ViewStyle[];
  hideDividers?: boolean;
  hideDividerOnLastOption?: boolean;
};

function SelectOne<T>({
  title,
  options,
  value,
  onChange,
  style,
  hideDividers,
  hideDividerOnLastOption,
}: SelectOneProps<T>) {
  const t = useTheme();

  return (
    <View style={style}>
      {title && (
        <View style={[t.pX4]}>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
            {title}
          </Text>
        </View>
      )}
      <View style={[t.flex, t.flexCol, t.wFull, t.itemsStart]}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
              hideDividers ||
              (hideDividerOnLastOption && index === options.length - 1)
                ? []
                : [t.borderBHairline, t.borderDefault],
              t.pX4,
            ]}
            activeOpacity={0.75}
            onPress={() => onChange(option.value)}
          >
            {option.subtitle ? (
              <View style={[t.flexCol, t.flex1]}>
                <Text style={[t.pT4, t.texts.primary, t.textBase]}>
                  {option.title}
                </Text>
                <Text style={[t.pB4, t.pT1, t.texts.secondary, t.textSm]}>
                  {option.subtitle}
                </Text>
              </View>
            ) : (
              <Text style={[t.flex1, t.pY4, t.texts.primary, t.textBase]}>
                {option.title}
              </Text>
            )}
            {value === option.value ? (
              <View
                style={[
                  t.roundedFull,
                  t.h6,
                  t.w6,
                  t.flex,
                  t.itemsCenter,
                  t.justifyCenter,
                  { backgroundColor: t.colors.actionPrimary },
                ]}
              >
                <Octicons name="check" style={[t.textSm, t.texts.inverted]} />
              </View>
            ) : (
              <View
                style={[
                  t.roundedFull,
                  t.h6,
                  t.w6,
                  t.border,
                  t.borders.tertiary,
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

SelectOne.displayName = 'SelectOne';

export { SelectOne };
