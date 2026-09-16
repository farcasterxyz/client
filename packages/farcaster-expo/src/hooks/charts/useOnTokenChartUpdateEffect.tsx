import {
  ApiChain,
  ApiWebSocketTokenChartUpdateData,
} from 'farcaster-client-data';
import { useTokenStore, useWebSockets } from 'farcaster-client-hooks';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

function getOnTokenChartUpdateCallbackReferenceId(chain: ApiChain, ca: string) {
  return `onTokenChartUpdate-${chain}-${ca}`;
}

export function useOnTokenChartUpdateEffect({
  chain,
  ca,
  onUpdate,
}: {
  chain: ApiChain;
  ca: string;
  onUpdate: ({
    chain,
    ca,
    data,
  }: {
    chain: ApiChain;
    ca: string;
    data: ApiWebSocketTokenChartUpdateData[];
  }) => void;
}) {
  const { registerOnMessageCallback, unregisterOnMessageCallback } =
    useWebSockets();
  const previousUpdateTime = useRef<number>(0);

  useEffect(() => {
    const cbReferenceId = getOnTokenChartUpdateCallbackReferenceId(chain, ca);
    registerOnMessageCallback({
      messageType: 'token_chart_update',
      cbReferenceId,
      cb: ({ message }) => {
        if (AppState.currentState !== 'active') {
          return;
        }
        if (message.messageType !== 'token_chart_update') {
          return;
        }
        if (message.payload.chain !== chain || message.payload.ca !== ca) {
          return;
        }
        const newUpdateTime = message.payload.timestamp;
        if (newUpdateTime > previousUpdateTime.current) {
          previousUpdateTime.current = newUpdateTime;
          onUpdate({ chain, ca, data: message.payload.data });
        }
        const last = message.payload.data[message.payload.data.length - 1];
        useTokenStore.getState().upsertPrice({
          ca,
          chain,
          priceUsd: last.bars[last.bars.length - 1].close,
          // Seconds to milliseconds
          timestamp: newUpdateTime * 1000,
        });
      },
    });
    return () => {
      unregisterOnMessageCallback({
        messageType: 'token_chart_update',
        cbReferenceId,
      });
    };
  }, [
    registerOnMessageCallback,
    unregisterOnMessageCallback,
    chain,
    ca,
    onUpdate,
  ]);
}
