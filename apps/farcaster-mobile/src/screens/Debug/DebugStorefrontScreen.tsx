import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text2 } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { getStorefront, type StorefrontInfo } from '~/modules';
import { CommonStackParamList } from '~/types';

type DebugStorefrontScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugStorefront'
>;

const DebugStorefrontScreen = buildScreen<DebugStorefrontScreenProps>(
  { name: 'DebugStorefront', insetBottom: true },
  () => {
    const t = useTheme();

    return (
      <View style={[t.pX4, t.gap10]}>
        <Debug />
      </View>
    );
  },
);

function Debug() {
  const [storefront, setStorefront] = React.useState<
    StorefrontInfo | null | undefined
  >(undefined);

  React.useEffect(() => {
    let isMounted = true;

    void getStorefront()
      .then((result) => {
        if (isMounted) {
          setStorefront(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStorefront(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const payload = React.useMemo(() => {
    if (storefront === undefined) {
      return 'Loading...';
    }

    if (storefront === null) {
      return 'No Storefront found.';
    }

    return JSON.stringify(storefront);
  }, [storefront]);

  return (
    <View>
      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text2 color="secondary" size="xl">
          Storefront
        </Text2>
      </View>
      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text2 size="sm" color="secondary" weight="semibold">
          Payload
        </Text2>
        <Text2 color="primary">{payload}</Text2>
      </View>
    </View>
  );
}

export { DebugStorefrontScreen };
