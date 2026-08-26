import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Platform } from 'react-native';

const useScreenFreezeOptions = (): NativeStackNavigationOptions => {
  return useMemo(
    () => ({
      freezeOnBlur: Platform.OS !== 'ios',
    }),
    [],
  );
};

export { useScreenFreezeOptions };
