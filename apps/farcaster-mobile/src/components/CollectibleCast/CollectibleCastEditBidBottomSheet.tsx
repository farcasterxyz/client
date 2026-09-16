import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCastCollectibleAuctionBid } from 'farcaster-client-data';
import { BottomSheetContentContainer, NumPad, Text2 } from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import type { BidError } from './useCollectibleCastBid';

export type CollectibleCastBidFn = (result: {
  walletTransactionId: string;
  bid: ApiCastCollectibleAuctionBid;
}) => void;

export function CollectibleCastEditBidBottomSheet({
  setBidAmount,
  calculateBidError,
  onClose,
  balance,
}: {
  setBidAmount: (amount: string) => void;
  calculateBidError: (bidAmount: string) => BidError | null;
  onClose: () => void;
  balance: number;
}) {
  return (
    <BottomSheetContentContainer>
      <CollectibleCastBidBottomSheetContent
        setBidAmount={setBidAmount}
        calculateBidError={calculateBidError}
        onClose={onClose}
        balance={balance}
      />
    </BottomSheetContentContainer>
  );
}

function CollectibleCastBidBottomSheetContent({
  setBidAmount,
  calculateBidError,
  onClose,
  balance,
}: {
  setBidAmount: (amount: string) => void;
  calculateBidError: (bidAmount: string) => BidError | null;
  onClose: () => void;
  balance: number;
}) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const [inputValue, setInputValue] = useState('0');

  const handleInputChange = useCallback((val: string) => {
    setInputValue(val);
  }, []);

  const handleSubmit = useCallback(() => {
    setBidAmount(inputValue);
    onClose();
  }, [inputValue, setBidAmount, onClose]);

  const bidError = calculateBidError(inputValue);

  useEffect(() => {
    if (
      bidError &&
      (bidError.key === 'insufficient_balance' ||
        bidError.key === 'insufficient_eth_for_gas')
    ) {
      trackEvent(AnalyticsEvent.CollectCastBidInputError, {
        bidAmount: parseFloat(inputValue),
        error: bidError.message,
        errorKey: bidError.key,
      });
    }
  }, [inputValue, bidError, trackEvent]);

  return (
    <View>
      <View style={[t.itemsCenter, { paddingVertical: 70, gap: 16 }]}>
        <Text2 size="6xl" weight="semibold" numberOfLines={1}>
          <Text2 size="6xl" weight="semibold">
            $
          </Text2>
          <Text2
            size="6xl"
            weight="semibold"
            color={
              inputValue === '' || parseInt(inputValue) === 0
                ? 'tertiary'
                : 'primary'
            }
          >
            {inputValue
              ? parseInt(inputValue).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : 0}
          </Text2>
        </Text2>
        <Text2
          color="tertiary"
          weight="medium"
          size="sm"
        >{`Available: $${Math.floor(balance).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`}</Text2>
      </View>

      <NumPad
        value={inputValue}
        onChange={handleInputChange}
        maxDecimals={0}
        noPadding
      />

      <View style={{ paddingTop: 24 }}>
        <ButtonV2
          title={bidError?.message || 'Update bid amount'}
          textSize="lg"
          onPress={handleSubmit}
          disabled={!!bidError}
        />
      </View>
    </View>
  );
}
