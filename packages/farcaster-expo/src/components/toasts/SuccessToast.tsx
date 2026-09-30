import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { AnimatedPressable, Text2 } from '../design-system';

const SuccessToast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatedPressable
      style={{
        backgroundColor: '#24292e',
        borderRadius: 16,
        paddingVertical: 5,
        paddingLeft: 5,
        paddingRight: 12,
      }}
      disabled
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: 32,
            height: 32,
          }}
        >
          <Check size={16} color="white" strokeWidth={2.5} />
        </View>
        <Text2 size="sm" weight="medium" color="light">
          {message}
        </Text2>
      </View>
    </AnimatedPressable>
  );
};

export { SuccessToast };
