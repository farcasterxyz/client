import { ApiChain, ApiPaymentMethod } from 'farcaster-client-data';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

export function useOnrampWithCoinbase() {
  const { apiClient } = useFarcasterApiClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateOnramp = useCallback(
    async (
      amountUsd: number,
      network: ApiChain,
      purchaseTokenAddress: string,
      paymentMethod?: ApiPaymentMethod,
    ) => {
      setIsLoading(true);
      setError(null);

      const redirectUrl = `farcaster://~/coinbase-commerce-callback?network=${network}&tokenAddress=${purchaseTokenAddress}`;

      try {
        const response = await apiClient.generateCoinbaseCommerceHostedUiUrl({
          network,
          amountUsd,
          purchaseTokenAddress,
          redirectUrlOverride: redirectUrl,
          paymentMethod,
        });

        await Linking.openURL(response.data.result.url);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to open onramp';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient],
  );

  return {
    initiateOnramp,
    isLoading,
    error,
  };
}
