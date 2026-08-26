import React, { FC } from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

import { LoadingIndicator } from './LoadingIndicator';

type HeaderRightSubmitProps = {
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  actionTextOverload?: string;
};

const HeaderRightSubmit: FC<HeaderRightSubmitProps> = ({
  style,
  disabled,
  loading,
  onPress,
  actionTextOverload,
}) => {
  const t = useTheme();

  const actionText = React.useMemo(() => {
    return actionTextOverload || 'Done';
  }, [actionTextOverload]);

  if (loading) {
    return <LoadingIndicator style={[t.mR3]} />;
  }

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[disabled ? { opacity: 0.3 } : null, style]}
    >
      <Text style={[t.texts.brand, t.textBase, t.fontSemibold]}>
        {actionText}
      </Text>
    </TouchableOpacity>
  );
};

HeaderRightSubmit.displayName = 'HeaderRightSubmit';

export { HeaderRightSubmit };
