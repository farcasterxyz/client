import React from 'react';
import {
  EdgeInsets,
  initialWindowMetrics,
  SafeAreaInsetsContext,
} from 'react-native-safe-area-context';

const ZERO_INSETS: EdgeInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function useOptionalSafeAreaInsets(): EdgeInsets {
  const insets = React.useContext(SafeAreaInsetsContext);
  return insets ?? initialWindowMetrics?.insets ?? ZERO_INSETS;
}
