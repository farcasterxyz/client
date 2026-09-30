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
import { useTheme } from '../../../../contexts/ThemeContext';
import { Text2 } from '../../../design-system';
import { Table, TableRow } from '../../../design-system/Table';
import {
  ActivityTokenIcon,
  determineSwapBuySell,
  getTypeText,
  truncateString,
} from '../WalletActivityItem';
import { useActivityBottomSheetContext } from './context';
import { GasFeesCoverageHeader } from './shared';

export function WalletActivitySwapBottomSheet({
  item,
}: {
  item: ApiWalletActivity;
}) {
  const t = useTheme();
  const { openExplorerUrl } = useActivityBottomSheetContext();
  const inflow = item.stateChanges.find((change) => change.direction === 'IN');
  const outflow = item.stateChanges.find(
    (change) => change.direction === 'OUT',
  );

  // Use the same logic as ActivityTypeStatus to determine the text
  const { isSell, tokenToShow } = useMemo(() => {
    if (!inflow?.assetMetadata || !outflow?.assetMetadata) {
      return { isSell: false, tokenToShow: 'IN' as const };
    }
    return determineSwapBuySell(inflow, outflow);
  }, [inflow, outflow]);

  const activityTypeText = useMemo(() => {
    if (!inflow?.assetMetadata || !outflow?.assetMetadata) {
      return null;
    }

    const tokenChange = tokenToShow === 'IN' ? inflow : outflow;
    const tokenName = truncateString(
      formatTokenSymbol(tokenChange.assetMetadata.symbol),
      8,
    );

    return getTypeText(item.type, item.status, tokenName, isSell);
  }, [item.type, item.status, inflow, outflow, tokenToShow, isSell]);

  // Format timestamp as "Dec 1 at 11:34 AM"
  const formattedTimestamp = useMemo(() => {
    return moment(item.timestamp).format('MMM D [at] h:mm A');
  }, [item.timestamp]);

  const header = useMemo(() => {
    if (item.annotation?.type === 'swap-for-gas') {
      return <GasFeesCoverageHeader />;
    }
    return null;
  }, [item]);

  // Format bought/spent text
  const boughtSpentText = useMemo(() => {
    if (isSell) {
      // For Sell: "Bought <value> <IN token>" (what you received)
      if (!inflow?.assetMetadata) {
        return null;
      }
      const tokenSymbol = formatTokenSymbol(inflow.assetMetadata.symbol);
      const amount = formatAmount(inflow.value);
      return `${amount} ${tokenSymbol}`;
    } else {
      // For Buy: "Spent <value> <OUT token>" (what you sent)
      if (!outflow?.assetMetadata) {
        return null;
      }
      const tokenSymbol = formatTokenSymbol(outflow.assetMetadata.symbol);
      const amount = formatAmount(outflow.value);
      return `${amount} ${tokenSymbol}`;
    }
  }, [inflow, outflow, isSell]);

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
    if (!inflow || !outflow) {
      return [];
    }
    // For Buy: show outflow value (what you spent)
    // For Sell: show inflow value (what you received)
    // This matches the list item behavior and user expectations
    const valueChange = isSell ? inflow : outflow;

    return [
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Value
          </Text2>
        ),
        value: (
          <Text2 size="sm" color="primary" weight="medium">
            {valueChange.usdPrice ? formatPrice(valueChange.usdPrice) : '—'}
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
            {isSell
              ? `${formatAmount(outflow.value)} ${formatTokenSymbol(outflow.assetMetadata.symbol)}`
              : `${formatAmount(inflow.value)} ${formatTokenSymbol(inflow.assetMetadata.symbol)}`}
          </Text2>
        ),
      },
      ...(boughtSpentText
        ? [
            {
              label: (
                <Text2 size="base" color="secondary" weight="medium">
                  {isSell ? 'Bought' : 'Spent'}
                </Text2>
              ),
              value: (
                <Text2 size="sm" color="primary" weight="medium">
                  {boughtSpentText}
                </Text2>
              ),
            },
          ]
        : []),
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Tx Hash
          </Text2>
        ),
        value: PurpleHashRow,
      },
    ];
  }, [inflow, outflow, boughtSpentText, isSell, PurpleHashRow]);

  if (!inflow || !outflow) {
    return null;
  }

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

      {/* {Platform.OS !== 'web' && (
        <AnimatedPressable
          onPress={handleCastPress}
          style={{ flex: 1, height: 48 }}
        >
          <View
            style={[
              t.flex1,
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Cast
            </Text2>
          </View>
        </AnimatedPressable>
      )} */}
    </View>
  );
}
