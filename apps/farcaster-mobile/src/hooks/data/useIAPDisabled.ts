import { useClientConfig } from 'farcaster-client-hooks';
import { useMemo } from 'react';
import { Platform } from 'react-native';

const useIAPDisabled = () => {
  const { data } = useClientConfig();

  const { disabled } = useMemo(() => {
    return Platform.select({
      ios: {
        disabled: data?.result.ios.disableIAP,
      },
      android: {
        disabled: data?.result.android.disableIAP,
      },
      default: {
        disabled: false,
      },
    });
  }, [data?.result.android.disableIAP, data?.result.ios.disableIAP]);

  return { disabled };
};

export { useIAPDisabled };
