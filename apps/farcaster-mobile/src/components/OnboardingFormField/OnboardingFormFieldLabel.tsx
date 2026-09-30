import React, { FC, memo } from 'react';
import { ViewStyle } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type OnboardingFormFieldLabelProps = {
  label: string;
  labelStyle?: ViewStyle[];
};

const OnboardingFormFieldLabel: FC<OnboardingFormFieldLabelProps> = memo(
  ({ label, labelStyle }) => {
    const t = useTheme();

    return (
      <Text style={[t.texts.primary, t.textBase, labelStyle, t.pB3]}>
        {label}
      </Text>
    );
  },
);

OnboardingFormFieldLabel.displayName = 'OnboardingFormFieldLabel';

export { OnboardingFormFieldLabel };
