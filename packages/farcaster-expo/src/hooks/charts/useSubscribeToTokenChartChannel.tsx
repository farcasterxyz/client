import { ApiChain } from 'farcaster-client-data';
import { useWebSockets } from 'farcaster-client-hooks';
import { useCallback } from 'react';

export function useSubscribeToTokenChartChannel() {
  const { send } = useWebSockets();

  const callback = useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      try {
        send({
          message: {
            messageType: 'wallet_token_chart_subscribe',
            data: {
              chain,
              ca,
            },
          },
        });
      } catch {
        // Statsig error reporting removed
      }
    },
    [send],
  );

  return {
    subscribeToTokenChartChannel: callback,
  };
}
