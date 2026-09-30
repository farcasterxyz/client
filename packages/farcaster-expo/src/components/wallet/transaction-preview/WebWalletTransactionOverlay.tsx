import * as React from 'react';
import {
  StyleProp,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../../contexts';
import { convertHexToRGBA } from '../../../theme/utils';

type WebWalletTransactionOverlayProps = {
  cancel: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};
function WebWalletTransactionOverlay({
  cancel,
  children,
  style,
}: WebWalletTransactionOverlayProps) {
  const t = useTheme();
  return (
    <View
      style={[
        t.absolute,
        t.inset0,
        {
          backgroundColor: convertHexToRGBA(t.colors.black, 0.3),
        },
      ]}
    >
      <TouchableWithoutFeedback onPress={cancel}>
        <View style={[t.absolute, t.inset0]} />
      </TouchableWithoutFeedback>
      <View
        style={[
          t.bgDefault,
          t.absolute,
          t.left0,
          t.right0,
          t.bottom0,
          t.pB3,
          t.pX3,
          {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export { WebWalletTransactionOverlay };
