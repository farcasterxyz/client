import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiChain } from 'farcaster-client-data';
import {
  useInvalidateCoinbaseOnrampLimit,
  useNonSuspenseToken,
} from 'farcaster-client-hooks';
import {
  ButtonV2,
  Text2,
  TokenIcon,
  useSharedNavigationContext,
} from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useTheme } from '~/contexts/ThemeProvider';
import { WalletStackParamList } from '~/types';

type CoinbaseCommerceCallbackScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'CoinbaseCommerceCallback'
>;

const CoinbaseCommerceCallbackSchema = z.object({
  network: z.string().optional(),
  tokenAddress: z.string().optional(),
  onramp_result: z.string().default('success'),
});

const CoinbaseCommerceCallbackScreen: React.FC<
  CoinbaseCommerceCallbackScreenProps
> = ({ route }) => {
  const t = useTheme();
  const { queryParams } = route.params;
  const { top, bottom } = useSafeAreaInsets();

  const { goBack } = useSharedNavigationContext();
  const { invalidateCoinbaseOnrampLimit } = useInvalidateCoinbaseOnrampLimit();

  useEffect(() => {
    invalidateCoinbaseOnrampLimit({});
  }, [invalidateCoinbaseOnrampLimit]);

  const parsedQueryParams = useRef(
    CoinbaseCommerceCallbackSchema.parse(queryParams),
  );
  const { data } = useNonSuspenseToken({
    params: {
      chain: parsedQueryParams.current.network as ApiChain,
      ca: parsedQueryParams.current.tokenAddress ?? '',
    },
    query: {
      enabled:
        parsedQueryParams.current.tokenAddress !== undefined &&
        parsedQueryParams.current.network !== undefined,
    },
  });

  const headerSection = useMemo(() => {
    if (parsedQueryParams.current.onramp_result === 'success') {
      return (
        <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
          <View
            style={[
              t.justifyCenter,
              t.itemsCenter,
              t.backgrounds.brand,
              t.roundedFull,
              { width: 20, height: 20 },
            ]}
          >
            <Check size={10} color={t.colors.text.light} strokeWidth={5} />
          </View>
          <Text2 weight="semibold" size="lg" color="primary">
            Buy succeded
          </Text2>
        </View>
      );
    }
    return (
      <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
        <Text2 weight="semibold" size="lg" color="warning">
          Status: {parsedQueryParams.current.onramp_result}
        </Text2>
      </View>
    );
  }, [t]);

  return (
    <View
      style={[
        t.flexCol,
        t.pX3,
        t.hFull,
        { gap: 12, paddingTop: top + 24, paddingBottom: bottom + 24 },
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, t.justifyCenter]}>
        {headerSection}
      </View>
      {data && (
        <View
          style={[
            t.flexRow,
            t.mT3,
            t.itemsCenter,
            t.justifyCenter,
            { gap: 10 },
          ]}
        >
          <TokenIcon iconUrl={data?.token?.imageUrl} diameter={40} />
          <Text2 weight="medium" color="primary" size="3xl">
            {data?.token?.ticker}
          </Text2>
        </View>
      )}
      <Text2 weight="medium" color="secondary" size="sm" align="center">
        It could take a few minutes before the amount shows up in your wallet.
        We'll notify you.
      </Text2>
      <View style={[t.flex1, t.flexCol, t.hFull]} />
      <ButtonV2
        title="Done"
        onPress={() => {
          goBack();
        }}
      />
    </View>
  );
};

export { CoinbaseCommerceCallbackScreen };
