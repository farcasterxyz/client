import { Typography } from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

export type RadioOption<T> = {
  value: T;
  title: string;
};

type RadioProps<T> = {
  options: RadioOption<T>[];
  value: T;
  onChange: (newValue: T) => void;
};

function Radio<T>({ options, value, onChange }: RadioProps<T>) {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex,
        t.flexCol,
        t.wFull,
        t.backgrounds.secondary,
        { borderRadius: 16 },
      ]}
    >
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.p3,
            options.length - 1 !== index && [t.borderB, t.borders.background],
          ]}
          activeOpacity={0.75}
          onPress={() => onChange(option.value)}
        >
          <View style={[t.flexCol]}>
            <Typography label="Body/Large">{option.title}</Typography>
          </View>
          {value === option.value && (
            <Check
              size={20}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              color={t.colors.text.brand}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

Radio.displayName = 'Radio';

export { Radio };
