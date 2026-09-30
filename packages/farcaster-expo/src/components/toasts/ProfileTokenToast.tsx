import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { AnimatedPressable, Text2 } from '../design-system';

interface ProfileTokenToastProps extends ToastProps {
  data?: {
    isRemoving?: boolean;
  };
}

const ProfileTokenToast: React.FC<ProfileTokenToastProps> = ({ data }) => {
  const message = data?.isRemoving
    ? 'Removed as profile token'
    : 'Set as profile token';

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: 32,
            height: 32,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              backgroundColor: '#009951',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Check size={16} color="white" />
          </View>
        </View>
        <Text2 size="sm" color="light">
          {message}
        </Text2>
      </View>
    </AnimatedPressable>
  );
};

export { ProfileTokenToast };
