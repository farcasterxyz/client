import React, { FC, ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type SectionProps = {
  children: ReactNode;
};

const Section: FC<SectionProps> = ({ children }) => {
  const t = useTheme();

  return (
    <View style={[t.borderHairline, t.borderDefault, t.roundedLg, t.p4, t.mY2]}>
      {children}
    </View>
  );
};

Section.displayName = 'Section';

export { Section };
