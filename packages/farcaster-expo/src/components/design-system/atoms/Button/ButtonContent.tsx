import { View } from 'react-native';

import { useTheme } from '../../../../contexts/ThemeContext';
import { LoadingIndicator } from '../LoadingIndicator';
import { buttonHierarchyToTypographyColor } from './constants';
import { ButtonHierarchy } from './types';

export type ButtonContentProps = {
  children: React.ReactNode;
  loading?: boolean;
  hierarchy: ButtonHierarchy;
};

const ButtonContent = ({
  children,
  loading,
  hierarchy,
}: ButtonContentProps) => {
  const t = useTheme();
  const loaderColor = buttonHierarchyToTypographyColor[hierarchy];
  return (
    <View style={[t.gap1, t.justifyCenter, t.itemsCenter, t.flex1, t.flexRow]}>
      {loading ? <LoadingIndicator color={loaderColor} /> : children}
    </View>
  );
};

ButtonContent.displayName = 'ButtonContent';

export { ButtonContent };
