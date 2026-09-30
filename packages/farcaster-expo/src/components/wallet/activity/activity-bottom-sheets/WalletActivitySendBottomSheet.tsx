import {
  apiChainToChainId,
  ApiWalletActivity,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import {
  formatAmount,
  formatPrice,
  formatTokenSymbol,
} from 'farcaster-client-hooks';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { hitSlop } from '../../../../constants';
import { useTheme } from '../../../../contexts';
import { Text2 } from '../../../design-system';
import { Table, TableRow } from '../../../design-system/Table';
import {
  ActivityTokenIcon,
  getTypeText,
  truncateString,
} from '../WalletActivityItem';
import { useActivityBottomSheetContext } from './context';
import {
  GasFeesCoverageHeader,
  useGetAddressRow,
  useGetConvertedForGasFeesRow,
  useGetMiniAppRow,
} from './shared';

export function WalletActivitySendBottomSheet({
  item,
}: {
  item: ApiWalletActivity;
}) {
  const t = useTheme();
  const { openExplorerUrl } = useActivityBottomSheetContext();
  const miniAppRow = useGetMiniAppRow(item);
  const convertedForGasFeesRow = useGetConvertedForGasFeesRow(item);
  const toRow = useGetAddressRow(item, item.stateChanges[0], item.chain, 'to');

  const stateChange = item.stateChanges[0];

  // Use the same logic as ActivityTypeStatus to determine the text
  const activityTypeText = useMemo(() => {
    const tokenName = truncateString(
      formatTokenSymbol(item.stateChanges[0]?.assetMetadata.symbol),
      8,
    );
    return getTypeText(item.type, item.status, tokenName);
  }, [item.type, item.status, item.stateChanges]);

  // Format timestamp as "Dec 1 at 11:34 AM"
  const formattedTimestamp = useMemo(() => {
    return moment(item.timestamp).format('MMM D [at] h:mm A');
  }, [item.timestamp]);

  // Purple hash row component
  const formattedHash = useMemo(() => {
    return `${item.transaction.txHash.slice(0, 6)}...${item.transaction.txHash.slice(-4)}`;
  }, [item]);

  const onHashPress = useCallback(() => {
    const explorerUrl = getTransactionExplorerUrl({
      chainId: apiChainToChainId(item.chain) ?? '1',
      hash: item.transaction.txHash,
      type: 'tx',
    });
    if (explorerUrl) {
      openExplorerUrl?.(explorerUrl);
    }
  }, [item, openExplorerUrl]);

  const PurpleHashRow = useMemo(
    () => (
      <TouchableOpacity onPress={onHashPress} hitSlop={hitSlop}>
        <Text2 size="sm" style={t.texts.brand} weight="medium">
          {formattedHash}
        </Text2>
      </TouchableOpacity>
    ),
    [t, onHashPress, formattedHash],
  );

  const tableRows: TableRow[] = useMemo(() => {
    const rows = [
      ...convertedForGasFeesRow,
      ...toRow,
      ...miniAppRow,
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Value
          </Text2>
        ),
        value: (
          <Text2 size="sm" color="primary" weight="medium">
            {stateChange?.usdPrice ? formatPrice(stateChange.usdPrice) : '—'}
          </Text2>
        ),
      },
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Amount
          </Text2>
        ),
        value: (
          <Text2 size="sm" color="primary" weight="medium">
            {stateChange
              ? `${formatAmount(stateChange.value)} ${formatTokenSymbol(stateChange.assetMetadata.symbol)}`
              : '—'}
          </Text2>
        ),
      },
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Tx Hash
          </Text2>
        ),
        value: PurpleHashRow,
      },
    ];

    return rows;
  }, [convertedForGasFeesRow, toRow, miniAppRow, stateChange, PurpleHashRow]);

  const header = useMemo(() => {
    if (item.annotation?.type === 'swap-for-gas') {
      return <GasFeesCoverageHeader />;
    }
    return null;
  }, [item]);

  return (
    <View style={[t.flex1, t.flexCol, { gap: 16 }]}>
      {/* Header */}
      <View style={[t.flexRow, t.itemsCenter, { gap: 10 }]}>
        <ActivityTokenIcon item={item} />
        <View style={[t.flexCol, { gap: 2, flex: 1 }]}>
          {header}
          {activityTypeText && (
            <Text2 size="base" color="primary" weight="medium">
              {activityTypeText}
            </Text2>
          )}
          <Text2 size="sm" color="secondary" weight="medium">
            {formattedTimestamp}
          </Text2>
        </View>
      </View>

      {/* Body */}
      <Table
        rows={tableRows}
        style={{ paddingVertical: 0 }}
        alternating={false}
      />
    </View>
  );
}
