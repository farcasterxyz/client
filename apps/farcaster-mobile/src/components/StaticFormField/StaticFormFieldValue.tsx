import React, { FC, memo } from 'react';
import { Pressable } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type StaticFormFieldValueProps = {
  numberOfLines?: number;
  onPress: () => void;
  placeholder: string;
  value: string | undefined;
};

const StaticFormFieldValue: FC<StaticFormFieldValueProps> = memo(
  ({ numberOfLines, onPress, placeholder, value }) => {
    const t = useTheme();

    const renderingPlaceholder = React.useMemo(() => {
      return typeof value === 'undefined' || value === '';
    }, [value]);

    return (
      <Pressable
        onPress={onPress}
        style={[t.pY2, t.borderDefault, t.borderBHairline, t.flex1]}
      >
        <Text
          style={[
            t.textBase,
            t.borderDefault,
            t.borderB,
            renderingPlaceholder ? t.texts.secondary : t.texts.primary,
          ]}
          numberOfLines={numberOfLines}
        >
          {value || placeholder}
        </Text>
      </Pressable>
    );
  },
);

StaticFormFieldValue.displayName = 'StaticFormFieldValue';

export { StaticFormFieldValue };
