import {
  apiChainToChainId,
  ApiUser,
  ApiWalletActionStateChange,
  ApiWalletActivity,
  getTransactionExplorerUrl,
  isUsdc,
} from 'farcaster-client-data';
import { Fuel } from 'lucide-react-native';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { hitSlop } from '../../../../constants';
import { useTheme } from '../../../../contexts/ThemeContext';
import { formatValue } from '../../../../utils';
import { Avatar } from '../../../Avatar';
import { ChainImage } from '../../../crypto';
import { Text2 } from '../../../design-system';
import { TableRow } from '../../../design-system/Table';
import { MiniAppIcon } from '../../../icons';
import { useActivityBottomSheetContext } from './context';

export function IdentityRow({ user }: { user: ApiUser }) {
  const t = useTheme();
  const { onUserPress } = useActivityBottomSheetContext();
  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Avatar pfpUrl={user.pfp?.url} diameter={16} />
      <TouchableOpacity onPress={() => onUserPress?.(user)}>
        <Text2 color="primary" size="sm" weight="medium">
          {user.username}
        </Text2>
      </TouchableOpacity>
    </View>
  );
}

export const TimeRow = ({ timestamp }: { timestamp: number }) => {
  const [isRelative, setIsRelative] = useState(true);
  const text = useMemo(() => {
    if (isRelative) {
      // Override the global abbreviated format with full text
      const now = moment();
      const time = moment(timestamp);
      const diffSeconds = now.diff(time, 'seconds');
      const diffMinutes = now.diff(time, 'minutes');
      const diffHours = now.diff(time, 'hours');
      const diffDays = now.diff(time, 'days');
      const diffMonths = now.diff(time, 'months');
      const diffYears = now.diff(time, 'years');

      if (diffSeconds < 60) {
        return 'just now';
      } else if (diffMinutes < 60) {
        return diffMinutes === 1
          ? '1 minute ago'
          : `${diffMinutes} minutes ago`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else if (diffDays < 30) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      } else if (diffMonths < 12) {
        return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
      } else {
        return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
      }
    }
    return moment(timestamp).format('h:mm A DD MMM');
  }, [timestamp, isRelative]);

  return (
    <TouchableOpacity
      hitSlop={hitSlop}
      onPress={() => setIsRelative(!isRelative)}
    >
      <Text2 size="sm">{text}</Text2>
    </TouchableOpacity>
  );
};

export function ExchangeRateRow({
  tokenAmount,
  usdValue,
  tokenSymbol,
}: {
  tokenAmount: number;
  usdValue: number | undefined;
  tokenSymbol: string | undefined;
}) {
  const [currencyToShow, setCurrencyToShow] = useState<'base' | 'quote'>(
    'base',
  );

  const toggleCurrency = useCallback(() => {
    setCurrencyToShow(currencyToShow === 'base' ? 'quote' : 'base');
  }, [currencyToShow]);

  const text = useMemo(() => {
    // Skip if no USD price or no token amount or no symbol
    if (!usdValue || !tokenAmount || !tokenSymbol) {
      return null;
    }

    // Skip for stablecoins
    if (
      tokenSymbol === 'USDC' ||
      tokenSymbol === 'USDT' ||
      tokenSymbol === 'DAI'
    ) {
      return null;
    }

    // Calculate unit price: total USD value / token amount
    const unitPriceInUsd = usdValue / tokenAmount;

    if (currencyToShow === 'base') {
      // Show: 1 TOKEN = $X.XX
      // Format price based on magnitude
      let formattedPrice;
      if (unitPriceInUsd < 0.00001) {
        formattedPrice = unitPriceInUsd.toFixed(8);
      } else if (unitPriceInUsd < 0.01) {
        formattedPrice = unitPriceInUsd.toFixed(6);
      } else if (unitPriceInUsd < 1) {
        formattedPrice = unitPriceInUsd.toFixed(4);
      } else {
        formattedPrice = unitPriceInUsd.toFixed(2);
      }

      return `1 ${tokenSymbol} = $${formattedPrice}`;
    } else {
      // Show: $1 = X.XX TOKEN
      const tokensPerDollar = 1 / unitPriceInUsd;

      // Format based on magnitude
      let formattedAmount;
      if (tokensPerDollar < 0.01) {
        formattedAmount = tokensPerDollar.toFixed(6);
      } else if (tokensPerDollar < 1) {
        formattedAmount = tokensPerDollar.toFixed(4);
      } else if (tokensPerDollar < 100) {
        formattedAmount = tokensPerDollar.toFixed(2);
      } else {
        formattedAmount = Math.round(tokensPerDollar).toLocaleString();
      }

      return `$1 = ${formattedAmount} ${tokenSymbol}`;
    }
  }, [tokenAmount, usdValue, tokenSymbol, currencyToShow]);

  if (!text) {
    return null;
  }

  return (
    <TouchableOpacity hitSlop={hitSlop} onPress={toggleCurrency}>
      <Text2 size="sm">{text}</Text2>
    </TouchableOpacity>
  );
}

export function MiniAppRow({ item }: { item: ApiWalletActivity }) {
  const t = useTheme();
  const { onLaunchFrame } = useActivityBottomSheetContext();

  const onPress = useCallback(() => {
    if (!item.frame) {
      return;
    }

    const { author, name, homeUrl, splashImageUrl, splashBackgroundColor } =
      item.frame;
    if (item.frame) {
      onLaunchFrame?.({
        author,
        context: {
          type: 'launcher',
        },
        config: {
          name,
          url: homeUrl,
          splashImageUrl,
          splashBackgroundColor,
        },
      });
    }
  }, [item.frame, onLaunchFrame]);

  if (!item.frame) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
      onPress={onPress}
    >
      <MiniAppIcon imageUrl={item.frame.iconUrl} size={16} />
      <Text2 size="sm">{item.frame.name}</Text2>
    </TouchableOpacity>
  );
}

export function useGetConvertedForGasFeesRow(
  item: ApiWalletActivity,
): TableRow[] {
  const t = useTheme();
  return useMemo(() => {
    if (item.annotation?.type !== 'swap-for-gas') {
      return [];
    }

    return [
      {
        label: 'Note',
        value: (
          <View style={[{ gap: 4 }, t.flexRow, t.itemsCenter]}>
            <Fuel size={12} color={t.colors.text.warning} />
            <Text2 size="sm" color="warning">
              Converted to cover gas fees
            </Text2>
          </View>
        ),
      },
    ];
  }, [item, t.colors.text.warning, t.flexRow, t.itemsCenter]);
}

export function useGetMiniAppRow(item: ApiWalletActivity): TableRow[] {
  return useMemo(() => {
    if (!item.frame) {
      return [];
    }

    return [
      {
        label: 'Via',
        value: <MiniAppRow item={item} />,
      },
    ];
  }, [item]);
}

export function FormattedHashRow({ item }: { item: ApiWalletActivity }) {
  const t = useTheme();
  const { openExplorerUrl } = useActivityBottomSheetContext();
  const formattedHash = useMemo(() => {
    return `${item.transaction.txHash.slice(0, 6)}...${item.transaction.txHash.slice(-4)}`;
  }, [item]);

  const onPress = useCallback(() => {
    const explorerUrl = getTransactionExplorerUrl({
      chainId: apiChainToChainId(item.chain) ?? '1',
      hash: item.transaction.txHash,
      type: 'tx',
    });
    if (explorerUrl) {
      openExplorerUrl?.(explorerUrl);
    }
  }, [item, openExplorerUrl]);

  return (
    <TouchableOpacity
      style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
      onPress={onPress}
      hitSlop={hitSlop}
    >
      <ChainImage chain={item.chain} size={16} />
      <Text2 size="sm">{formattedHash}</Text2>
    </TouchableOpacity>
  );
}

export function useGetPriceText(
  stateChange: ApiWalletActionStateChange | undefined,
) {
  const t = useTheme();
  return useMemo(() => {
    if (!stateChange) {
      return null;
    }

    const isStable = isUsdc(stateChange.assetMetadata.ca);
    if (isStable) {
      return null;
    }

    if (!stateChange.usdPrice) {
      return null;
    }

    const valueInUsd = stateChange.usdPrice;
    const text = valueInUsd < 0.1 ? '<$0.1' : `$${formatValue(valueInUsd, 2)}`;
    return (
      <View
        style={[
          t.bgFaint,
          t.borderFaint,
          t.border,
          {
            paddingVertical: 2,
            paddingHorizontal: 6,
            borderRadius: 100,
          },
        ]}
      >
        <Text2 size="sm" color="secondary" weight="medium">
          {text}
        </Text2>
      </View>
    );
  }, [stateChange, t.bgFaint, t.borderFaint, t.border]);
}

export function FormattedAddressRow({
  address,
  chainId,
}: {
  address: string;
  chainId: string;
}) {
  const t = useTheme();
  const { openExplorerUrl } = useActivityBottomSheetContext();
  const formattedAddress = useMemo(() => {
    return `${address.slice(0, 6)}...${address.slice(-5)}`;
  }, [address]);

  const onPress = useCallback(() => {
    const explorerUrl = getTransactionExplorerUrl({
      chainId,
      address,
      type: 'address',
    });
    if (explorerUrl) {
      openExplorerUrl?.(explorerUrl);
    }
  }, [address, chainId, openExplorerUrl]);

  return (
    <TouchableOpacity
      style={[t.flexRow, t.itemsCenter]}
      onPress={onPress}
      hitSlop={hitSlop}
    >
      <Text2 color="primary" size="sm" weight="medium">
        {formattedAddress}
      </Text2>
    </TouchableOpacity>
  );
}

export function useGetAddressRow(
  item: ApiWalletActivity,
  stateChange: ApiWalletActionStateChange | undefined,
  chain: ApiWalletActivity['chain'],
  direction: 'from' | 'to',
): TableRow[] {
  return useMemo(() => {
    if (!stateChange) {
      return [];
    }
    if (item.annotation?.type === 'swap-for-gas') {
      return [];
    }

    const labelText = direction === 'from' ? 'From' : 'To';
    const label = (
      <Text2 size="base" color="secondary" weight="medium">
        {labelText}
      </Text2>
    );

    // Check identity first (similar to TokenActivityItem logic)
    let identity =
      direction === 'from' ? stateChange.fromIdentity : stateChange.toIdentity;

    // Fallback to transaction user if identity doesn't have user (for ethereum protocol)
    if (
      !identity?.user &&
      item.transaction.protocol === 'ethereum' &&
      ((direction === 'from' && item.transaction.fromUser) ||
        (direction === 'to' && item.transaction.toUser))
    ) {
      const tx = item.transaction;
      identity = {
        address: direction === 'from' ? tx.fromAddress : (tx.toAddress ?? ''),
        user: direction === 'from' ? tx.fromUser : tx.toUser,
      };
    }

    // If we have a user in identity, show the identity row with username
    if (identity?.user) {
      return [
        {
          label,
          value: <IdentityRow user={identity.user} />,
        },
      ];
    }

    // If we have an address, show the address with hyperlink
    const address =
      identity?.address ||
      (direction === 'from' ? stateChange.fromAddress : stateChange.toAddress);

    if (address) {
      return [
        {
          label,
          value: (
            <FormattedAddressRow
              address={address}
              chainId={apiChainToChainId(chain) ?? '1'}
            />
          ),
        },
      ];
    }

    // No address information available
    return [];
  }, [item, stateChange, chain, direction]);
}

// Backward compatibility aliases
export const useGetToRow = (
  item: ApiWalletActivity,
  stateChange: ApiWalletActionStateChange | undefined,
  chain: ApiWalletActivity['chain'],
): TableRow[] => useGetAddressRow(item, stateChange, chain, 'to');

export const useGetFromRow = (
  item: ApiWalletActivity,
  stateChange: ApiWalletActionStateChange | undefined,
  chain: ApiWalletActivity['chain'],
): TableRow[] => useGetAddressRow(item, stateChange, chain, 'from');

export function useNavigateToTransactionExplorer() {
  const { openExplorerUrl } = useActivityBottomSheetContext();
  return useCallback(
    (item: ApiWalletActivity) => {
      const explorerUrl = getTransactionExplorerUrl({
        chainId: apiChainToChainId(item.chain) ?? '1',
        hash: item.transaction.txHash,
        type: 'tx',
      });
      if (explorerUrl) {
        openExplorerUrl?.(explorerUrl);
      }
    },
    [openExplorerUrl],
  );
}

export function GasFeesCoverageHeader() {
  const t = useTheme();
  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Fuel size={12} color={t.colors.text.warning} />
      <Text2 size="xs" weight="medium" color="secondary">
        Gas fees coverage
      </Text2>
    </View>
  );
}
