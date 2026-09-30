import { useClientConfig } from 'farcaster-client-hooks';
import { useMemo } from 'react';
import { Platform } from 'react-native';

const useCreateAccountIAPDisabled = () => {
  const { data } = useClientConfig();

  const { disabled } = useMemo(() => {
    return Platform.select({
      ios: {
        disabled: data?.result.ios.disableCreateAccountIAP,
      },
      android: {
        disabled: data?.result.android.disableCreateAccountIAP,
      },
      default: {
        disabled: false,
      },
    });
  }, [
    data?.result.android.disableCreateAccountIAP,
    data?.result.ios.disableCreateAccountIAP,
  ]);

  return { disabled };
};

export { useCreateAccountIAPDisabled };
