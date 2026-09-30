import { ApiWalletEvmScanAction200Response } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { StateChangesView } from '../common';

/**
 * Card component that displays transaction state changes, approvals, or custom content
 */
export function TransactionSummaryCard({
  scanData,
  customContent,
}: {
  scanData?: ApiWalletEvmScanAction200Response['result'];
  customContent?: React.ReactNode; // For UnsupportedScanSection or other direct embeds
}) {
  const t = useTheme();

  return (
    <View style={[t.flexCol, { gap: 12 }, t.mT3]}>
      {customContent}
      <StateChangesView data={scanData} />
    </View>
  );
}
