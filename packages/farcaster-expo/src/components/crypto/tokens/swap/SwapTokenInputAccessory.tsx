import React from 'react';

import {} from '../../../../utils/SwapWarnings';
import { useBottomSheetModalRef } from '../../../bottom-sheet';
import {
  TOKEN_ACCESSORY_STRINGS,
  TokenInputAccessory,
  TokenInputAccessoryBottomSheet,
  TokenInputAccessoryColorMap,
  TokenInputAccessoryIcon,
} from '../TokenInputAccessory';
import { useSwapTokens } from './SwapTokensProvider';
import { useSwapWarnings } from './useSwapWarnings';

export function SwapTokenInputAccessory() {
  const warning = useSwapWarnings();
  const bottomSheetModalRef = useBottomSheetModalRef();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);
  const { setShowDetailsSheet } = useSwapTokens();

  const displayAccessoryBottomSheet = React.useCallback(() => {
    setIsBottomSheetOpen(true);
  }, [setIsBottomSheetOpen]);

  const displayDetailsSheet = React.useCallback(() => {
    setShowDetailsSheet(true);
  }, [setShowDetailsSheet]);

  const iconDisplay = React.useMemo(() => {
    if (!warning) {
      return null;
    }
    if (warning?.type === 'high_price_impact_danger') {
      return null;
    }
    if (warning?.type === 'high_price_impact_warning') {
      return null;
    }
    if (warning?.type === 'market_rate_unfavorable_warning') {
      return null;
    }
    if (warning?.type === 'market_rate_unfavorable_blocked') {
      return null;
    }
    if (warning?.type === 'needs_gas') {
      return (
        <TokenInputAccessory
          text={`Not enough ${warning?.data?.nativeAssetSymbol} to cover for chain fees`}
          icon={<TokenInputAccessoryIcon type="gas_conversion" />}
          color={TokenInputAccessoryColorMap['gas_conversion']}
          onPress={displayAccessoryBottomSheet}
        />
      );
    }
    if (warning?.type === 'gas_conversion') {
      return (
        <TokenInputAccessory
          text={TOKEN_ACCESSORY_STRINGS.gas_conversion}
          icon={<TokenInputAccessoryIcon type="gas_conversion" />}
          color={TokenInputAccessoryColorMap['gas_conversion']}
          onPress={displayDetailsSheet}
        />
      );
    }
    if (warning?.type === 'quote_unavailable') {
      return (
        <TokenInputAccessory
          text={TOKEN_ACCESSORY_STRINGS.quote_unavailable}
          icon={<TokenInputAccessoryIcon type="quote_unavailable" />}
          color={TokenInputAccessoryColorMap['quote_unavailable']}
          onPress={displayAccessoryBottomSheet}
        />
      );
    }
    return null;
  }, [displayAccessoryBottomSheet, displayDetailsSheet, warning]);

  if (!iconDisplay) {
    return null;
  }
  return (
    <>
      {iconDisplay}
      {isBottomSheetOpen && (
        <TokenInputAccessoryBottomSheet
          warning={warning ?? null}
          onDismiss={() => setIsBottomSheetOpen(false)}
          bottomSheetModalRef={bottomSheetModalRef}
        />
      )}
    </>
  );
}
