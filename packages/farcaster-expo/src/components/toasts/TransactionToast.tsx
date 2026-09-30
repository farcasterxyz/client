import { openBrowserAsync } from 'expo-web-browser';
import {
  ApiChain,
  apiChainToChainIdOrThrow,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import {
  SubmitTransactionMetadata,
  useWalletTransaction,
} from '../../contexts/WalletTransactionsProvider';
import { AnimatedPressable, Text2 } from '../design-system';
import { HorizontalLoadingIndicator, Result } from './Components';

interface TransactionToastProps extends ToastProps {
  data?: {
    metadata: SubmitTransactionMetadata;
    chain: ApiChain;
    message?: string;
  };
}

const TransactionToast: React.FC<TransactionToastProps> = ({ id, data }) => {
  const { data: tx } = useWalletTransaction(id);

  const status = useMemo(() => {
    if (!tx) {
      return 'reverted';
    }

    return tx.status;
  }, [tx]);

  const label = useMemo(() => {
    if (data?.message) {
      return data.message;
    }

    switch (data?.metadata.type) {
      case 'decompress':
        if (status === 'confirmed') {
          return 'Claim successful';
        } else if (status === 'reverted') {
          return 'Claim failed';
        } else {
          return 'Claiming...';
        }
      case 'send':
        if (status === 'confirmed') {
          return 'Send complete!';
        } else if (status === 'reverted') {
          return 'Send failed';
        } else {
          return `Sending ${data?.metadata.token.symbol ?? 'token'}`;
        }
      case 'swap':
        if (status === 'confirmed') {
          return 'Swap complete!';
        } else if (status === 'reverted') {
          return 'Swap failed';
        } else {
          return `Swapping ${data?.metadata.quote.price.sell.token.symbol} → ${data?.metadata.quote.price.buy.token.symbol}`;
        }
      case 'swap-v2':
        if (status === 'confirmed') {
          return 'Swap complete!';
        } else if (status === 'reverted') {
          return 'Swap failed';
        } else {
          return `Swapping ${data?.metadata.sellToken.symbol} → ${data?.metadata.buyToken.symbol}`;
        }
      case 'bid':
        if (status === 'confirmed') {
          return 'Bid placed';
        } else if (status === 'reverted') {
          return 'Bid failed';
        } else {
          return `Confirming bid`;
        }
      default:
        if (status === 'confirmed') {
          return 'Succeeded';
        } else if (status === 'reverted') {
          return 'Failed';
        } else {
          return 'Processing';
        }
    }
  }, [status, data?.metadata, data?.message]);

  const onPress = useCallback(() => {
    if (!tx || tx.status === 'pending' || !data || !tx.txHash) {
      return;
    }

    const exploreUrl = getTransactionExplorerUrl({
      type: 'tx',
      hash: tx.txHash,
      chainId: apiChainToChainIdOrThrow(data.chain),
    });

    if (exploreUrl) {
      openBrowserAsync(exploreUrl);
    }
  }, [tx, data]);

  return (
    <AnimatedPressable
      style={{
        backgroundColor: '#24292e',
        borderRadius: 16,
        paddingVertical: 5,
        paddingLeft: 5,
        paddingRight: 12,
        marginTop: data?.metadata.type === 'bid' ? -8 : undefined,
      }}
      onPress={onPress}
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
          {status === 'processing' || status === 'pending' ? (
            <HorizontalLoadingIndicator />
          ) : (
            <Result success={status === 'confirmed'} />
          )}
        </View>
        <Text2 size="sm" color="light">
          {label}
        </Text2>
      </View>
    </AnimatedPressable>
  );
};

export { TransactionToast };
