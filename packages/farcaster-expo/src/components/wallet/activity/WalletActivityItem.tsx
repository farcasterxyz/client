import {
  ApiFrame,
  ApiWalletActivity,
  isUsdc,
  isWrappedNativeAsset,
} from 'farcaster-client-data';
import {
  formatAmount,
  formatPrice,
  formatTokenSymbol,
  useOnchainMorphoFarcasterVault,
} from 'farcaster-client-hooks';
import {
  ArrowDown,
  Check,
  ImageIcon,
  Loader2,
  Minus,
  Plus,
  Repeat,
  SendHorizonal,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import {
  formatAddress,
  isNativeAsset,
  UNLIMITED_ALLOWANCE,
} from '../../../utils';
import { TokenIcon } from '../../crypto';
import { AnimatedPressable, Text2 } from '../../design-system';
import { MiniAppIcon } from '../../icons';
import { RemoteImage } from '../../RemoteImage';

export const truncateString = (
  str: string | undefined,
  maxLength: number = 24,
) => {
  if (!str) {
    return '';
  }

  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + '...';
};

export const getTypeText = (
  type: string,
  status: string,
  tokenName?: string,
  isSold?: boolean,
  tokenSymbol?: string,
) => {
  if (status === 'failed') {
    return `${type.charAt(0).toUpperCase() + type.split('-')[0].slice(1)} failed`;
  }

  switch (type) {
    case 'swap':
    case 'swap-v2':
      if (status === 'pending') {
        return 'Buying';
      }
      if (isSold) {
        return tokenName ? `${tokenName} Sell` : 'Sell';
      }
      return tokenName ? `${tokenName} Buy` : 'Buy';
    case 'send':
      if (tokenSymbol) {
        return status === 'pending'
          ? `${tokenSymbol} Sending`
          : `${tokenSymbol} Sent`;
      }
      return status === 'pending' ? 'Sending' : 'Sent';
    case 'receive':
      if (tokenSymbol) {
        return status === 'pending'
          ? `${tokenSymbol} Receiving`
          : `${tokenSymbol} Received`;
      }
      return status === 'pending' ? 'Receiving' : 'Received';
    case 'approve':
      return status === 'pending' ? 'Approving' : 'Approved';
    case 'mint':
      return status === 'pending' ? 'Minting' : 'Minted';
    case 'burn':
      return status === 'pending' ? 'Burning' : 'Burned';
    case 'transaction':
      return status === 'pending' ? 'Transaction' : 'Transaction';
    case 'deposit':
      return status === 'pending'
        ? `${tokenSymbol} Depositing`
        : `${tokenSymbol} Deposit`;
    case 'withdraw':
      return status === 'pending'
        ? `${tokenSymbol} Withdrawing`
        : `${tokenSymbol} Withdraw`;
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export const determineSwapBuySell = (
  inChange: { assetMetadata: { ca?: string; symbol?: string } },
  outChange: { assetMetadata: { ca?: string; symbol?: string } },
): { isSell: boolean; tokenToShow: 'IN' | 'OUT' } => {
  const inCa = inChange.assetMetadata.ca;
  const outCa = outChange.assetMetadata.ca;

  const isReceivedUsdc = inCa ? isUsdc(inCa) : false;
  const isSentUsdc = outCa ? isUsdc(outCa) : false;
  const isReceivedNative = inCa
    ? isNativeAsset(inCa) || isWrappedNativeAsset(inCa)
    : false;

  // Priority order matches ActivityTypeStatus:
  // 1. Sent USDC → Buy → IN token
  // 2. Received USDC → Sell → OUT token
  // 3. Received Native → Sell → OUT token
  // 4. Sent Native → Buy → IN token
  // 5. Default → Buy → IN token
  if (isSentUsdc) {
    return { isSell: false, tokenToShow: 'IN' };
  }
  if (isReceivedUsdc || isReceivedNative) {
    return { isSell: true, tokenToShow: 'OUT' };
  }
  // Sent Native or default → Buy → IN token
  return { isSell: false, tokenToShow: 'IN' };
};

export const getNameFromActivity = (item: ApiWalletActivity) => {
  if (item.stateChanges.length === 0) {
    if (item.type === 'approve') {
      return truncateString(
        formatTokenSymbol(item.approvals[0].assetMetadata.symbol),
        8,
      );
    }
    return 'Unknown';
  }

  if (item.type === 'swap') {
    const inChange = item.stateChanges.find(
      (change) => change.direction === 'IN',
    );
    const outChange = item.stateChanges.find(
      (change) => change.direction === 'OUT',
    );

    if (inChange && outChange) {
      const fromSymbol = truncateString(
        formatTokenSymbol(outChange.assetMetadata.symbol),
        8,
      );
      const toSymbol = truncateString(
        formatTokenSymbol(inChange.assetMetadata.symbol),
        8,
      );
      return `${fromSymbol} -> ${toSymbol}`;
    }

    return 'Unknown Swap';
  }

  return truncateString(
    formatTokenSymbol(item.stateChanges[0].assetMetadata.symbol),
    8,
  );
};

const ActivityFrame = ({ frame }: { frame: ApiFrame }) => {
  const t = useTheme();

  return (
    <View style={[t.flexRow, t.flex, t.flexShrink, t.itemsCenter, { gap: 4 }]}>
      <Text2 color="secondary" size="sm" numberOfLines={1}>
        via
      </Text2>
      <View
        style={[t.flexRow, t.flex, t.flexShrink, t.itemsCenter, { gap: 4 }]}
      >
        <MiniAppIcon imageUrl={frame.iconUrl} size={16} />
        <Text2 color="secondary" size="sm" numberOfLines={1}>
          {frame.name}
        </Text2>
      </View>
    </View>
  );
};

function ActivityDescription({
  item,
  frame,
}: {
  item: ApiWalletActivity;
  frame?: ApiFrame;
}) {
  const t = useTheme();
  const { data: vault } = useOnchainMorphoFarcasterVault();

  if (item.stateChanges.length > 0) {
    const toAddress = item.stateChanges[0]?.toAddress;
    let toIdentity = item.stateChanges[0]?.toIdentity;
    if (
      !toIdentity?.user &&
      item.transaction.protocol === 'ethereum' &&
      item.transaction.toUser &&
      item.transaction.toAddress
    ) {
      toIdentity = {
        address: item.transaction.toAddress,
        user: item.transaction.toUser,
      };
    }

    let toDisplayName = 'Unknown';
    if (toAddress?.toLowerCase() === vault?.vault.ca.toLowerCase()) {
      toDisplayName = 'USDC Lending';
    } else if (toIdentity?.user?.username) {
      toDisplayName = toIdentity.user.username;
    } else if (toIdentity?.ensName) {
      toDisplayName = toIdentity.ensName;
    } else if (toIdentity?.baseName) {
      toDisplayName = toIdentity.baseName;
    } else if (toIdentity?.address) {
      toDisplayName = formatAddress(toIdentity.address);
    }

    if (
      item.type === 'send' &&
      item.stateChanges[0].assetMetadata.assetType !== 'NFT'
    ) {
      return (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            to
          </Text2>
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            {toDisplayName}
          </Text2>
        </View>
      );
    }

    const fromAddress = item.stateChanges[0]?.fromAddress;
    let fromIdentity = item.stateChanges[0]?.fromIdentity;
    if (
      !fromIdentity?.user &&
      item.transaction.protocol === 'ethereum' &&
      item.transaction.fromUser
    ) {
      fromIdentity = {
        address: item.transaction.fromAddress,
        user: item.transaction.fromUser,
      };
    }

    let fromDisplayName = 'Unknown';
    if (fromAddress?.toLowerCase() === vault?.vault.ca.toLowerCase()) {
      fromDisplayName = 'USDC Lending';
    } else if (fromIdentity?.user?.username) {
      fromDisplayName = fromIdentity.user.username;
    } else if (fromIdentity?.ensName) {
      fromDisplayName = fromIdentity.ensName;
    } else if (fromIdentity?.baseName) {
      fromDisplayName = fromIdentity.baseName;
    } else if (fromIdentity?.address) {
      fromDisplayName = formatAddress(fromIdentity.address);
    }

    if (
      item.type === 'receive' &&
      item.stateChanges[0].assetMetadata.assetType !== 'NFT'
    ) {
      return (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            from
          </Text2>
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            {fromDisplayName}
          </Text2>
        </View>
      );
    }
  }

  const name = getNameFromActivity(item);
  const showFrame =
    frame &&
    !name?.includes('...') &&
    item.type !== 'send' &&
    item.type !== 'receive' &&
    item.type !== 'approve' &&
    item.type !== 'mint' &&
    item.type !== 'burn' &&
    item.type !== 'swap';

  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Text2 color="secondary" size="sm" numberOfLines={1}>
        {name}
      </Text2>
      {showFrame && <ActivityFrame frame={frame} />}
    </View>
  );
}

export const ActivityTypeStatus = ({
  type,
  status,
  item,
}: {
  type: string;
  status: string;
  item?: ApiWalletActivity;
}) => {
  const t = useTheme();
  const { data: vault } = useOnchainMorphoFarcasterVault();

  const { fromAddress, toAddress } = item?.stateChanges[0] ?? {};
  if (type === 'send' && toAddress === vault?.vault.ca) {
    type = 'deposit';
  }
  if (type === 'receive' && fromAddress === vault?.vault.ca) {
    type = 'withdraw';
  }

  const { tokenName, isSold, tokenSymbol } = useMemo(() => {
    const inChange = item?.stateChanges.find((c) => c.direction === 'IN');
    const outChange = item?.stateChanges.find((c) => c.direction === 'OUT');

    if (type === 'deposit' || type === 'withdraw') {
      const tokenChange = type === 'deposit' ? outChange : inChange;
      return {
        tokenName: undefined,
        isSold: false,
        tokenSymbol: formatTokenSymbol(tokenChange?.assetMetadata?.symbol),
      };
    }

    if (
      (type === 'swap' || type === 'swap-v2') &&
      item &&
      status !== 'pending'
    ) {
      if (!inChange?.assetMetadata || !outChange?.assetMetadata) {
        return { tokenName: undefined, isSold: false, tokenSymbol: undefined };
      }

      const { isSell, tokenToShow } = determineSwapBuySell(inChange, outChange);
      const tokenChange = tokenToShow === 'IN' ? inChange : outChange;

      return {
        tokenName: truncateString(
          formatTokenSymbol(tokenChange.assetMetadata.symbol),
          8,
        ),
        isSold: isSell,
        tokenSymbol: undefined,
      };
    }

    // For send/receive, get the appropriate token symbol
    if (type === 'send' || type === 'receive') {
      if (type === 'send' && outChange?.assetMetadata?.symbol) {
        return {
          tokenName: undefined,
          isSold: false,
          tokenSymbol: truncateString(
            formatTokenSymbol(outChange.assetMetadata.symbol),
            8,
          ),
        };
      }

      if (type === 'receive' && inChange?.assetMetadata?.symbol) {
        return {
          tokenName: undefined,
          isSold: false,
          tokenSymbol: truncateString(
            formatTokenSymbol(inChange.assetMetadata.symbol),
            8,
          ),
        };
      }
    }

    return { tokenName: undefined, isSold: false, tokenSymbol: undefined };
  }, [type, status, item]);

  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Text2 color="primary" size="base" weight="medium">
        {getTypeText(type, status, tokenName, isSold, tokenSymbol)}
      </Text2>
    </View>
  );
};

export const ActivityTypeBadge = ({
  type,
  status,
}: {
  type: string;
  status: string;
}) => {
  const t = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    if (status === 'pending') {
      spinAnimation.start();
    }

    return () => spinAnimation.stop();
  }, [spinValue, status]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const icon = useMemo(() => {
    if (status === 'pending') {
      return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Loader2 size={12} style={t.texts.inverted} />
        </Animated.View>
      );
    }
    if (status === 'failed') {
      return <X size={12} style={t.texts.inverted} />;
    }

    switch (type) {
      case 'receive':
        return <ArrowDown size={12} style={t.texts.inverted} />;
      case 'send':
        return <SendHorizonal size={12} style={t.texts.inverted} />;
      case 'swap':
        return <Repeat size={12} style={t.texts.inverted} />;
      case 'approve':
        return <Check size={12} style={t.texts.inverted} />;
      case 'mint':
        return <Plus size={12} style={t.texts.inverted} />;
      case 'burn':
        return <Minus size={12} style={t.texts.inverted} />;
      default:
        return null;
    }
  }, [type, status, t, spin]);

  if (icon === null) {
    return null;
  }

  return (
    <View
      style={[
        t.bgDefault,
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        { width: 22, height: 22 },
      ]}
    >
      <View
        style={[
          t.roundedFull,
          status === 'failed' ? t.bgDanger : t.bgAction,
          t.justifyCenter,
          t.itemsCenter,
          { width: 18, height: 18 },
        ]}
      >
        {icon}
      </View>
    </View>
  );
};

export const ActivityTokenIcon = ({ item }: { item: ApiWalletActivity }) => {
  const t = useTheme();

  const assetMetadata =
    item.stateChanges[0]?.assetMetadata ?? item.approvals[0]?.assetMetadata;

  if (!assetMetadata) {
    return <View style={[{ width: 36, height: 36 }, t.bgFaint, t.roundedLg]} />;
  }

  if (item.type === 'swap') {
    const inChange = item.stateChanges.find(
      (change) => change.direction === 'IN',
    );
    const outChange = item.stateChanges.find(
      (change) => change.direction === 'OUT',
    );

    if (!inChange?.assetMetadata || !outChange?.assetMetadata) {
      return (
        <View style={[{ width: 36, height: 36 }, t.bgFaint, t.roundedLg]} />
      );
    }

    // Use the same Buy/Sell determination logic
    const { tokenToShow } = determineSwapBuySell(inChange, outChange);
    const tokenChange = tokenToShow === 'IN' ? inChange : outChange;

    return (
      <View style={[t.relative, { width: 36, height: 36 }]}>
        <TokenIcon
          iconUrl={tokenChange.assetMetadata.assetLogoUrl}
          diameter={36}
          symbol={tokenChange.assetMetadata.symbol}
        />
      </View>
    );
  }

  if (item.stateChanges[0]?.assetMetadata.assetType === 'NFT') {
    if (item.stateChanges[0].assetMetadata.assetLogoUrl) {
      return (
        <View style={[t.relative, { width: 36, height: 36 }]}>
          <RemoteImage
            uri={item.stateChanges[0].assetMetadata.assetLogoUrl}
            recyclingKey={item.stateChanges[0].assetMetadata.assetLogoUrl}
            style={[
              { width: 36, height: 36 },
              t.roundedLg,
              t.bgFaint,
              t.justifyCenter,
              t.itemsCenter,
            ]}
            contentFit="contain"
          />
        </View>
      );
    }

    return (
      <View
        style={[
          t.relative,
          t.bgLightPurple,
          t.roundedLg,
          t.justifyCenter,
          t.itemsCenter,
          { width: 36, height: 36 },
        ]}
      >
        <ImageIcon size={20} style={t.texts.brand} />
      </View>
    );
  }

  return (
    <View style={[t.relative, { width: 36, height: 36 }]}>
      <TokenIcon
        iconUrl={assetMetadata.assetLogoUrl}
        diameter={36}
        symbol={assetMetadata.symbol}
      />
    </View>
  );
};

const ActivityValue = ({ item }: { item: ApiWalletActivity }) => {
  const t = useTheme();
  const { data: vault } = useOnchainMorphoFarcasterVault();

  const change = useMemo(() => {
    if (item.stateChanges.length === 0) {
      return null;
    }

    switch (item.type) {
      case 'mint':
      case 'send':
        return (
          item.stateChanges.find((c) => c.direction === 'OUT') ??
          item.stateChanges[0]
        );
      case 'burn':
      case 'receive':
        return (
          item.stateChanges.find((c) => c.direction === 'IN') ??
          item.stateChanges[0]
        );
      case 'approve':
        return null;
      default:
        return item.stateChanges[0];
    }
  }, [item.stateChanges, item.type]);

  if (item.type === 'approve') {
    const approval = item.approvals[0];
    if (!approval) return null;

    const isApprovalUsdc = approval.assetMetadata.ca
      ? isUsdc(approval.assetMetadata.ca)
      : false;

    return (
      <View
        style={[
          t.absolute,
          t.right0,
          { top: 5, gap: 4 },
          t.flexCol,
          t.itemsEnd,
        ]}
      >
        {isApprovalUsdc && approval.usdPrice ? (
          <Text2 color="primary" weight="medium" size="base">
            {formatPrice(approval.usdPrice)}
          </Text2>
        ) : (
          <Text2 color="primary" weight="medium" size="base">
            {`${
              !approval.value || approval.value >= UNLIMITED_ALLOWANCE
                ? 'All'
                : formatAmount(approval.value)
            } ${truncateString(formatTokenSymbol(approval.assetMetadata.symbol), 8)}`}
          </Text2>
        )}
      </View>
    );
  }

  if (!change || change.assetMetadata.assetType === 'NFT') {
    return null;
  }

  if (item.type === 'swap') {
    const outChange = item.stateChanges.find(
      (change) => change.direction === 'OUT',
    );
    const inChange = item.stateChanges.find(
      (change) => change.direction === 'IN',
    );

    if (!inChange?.assetMetadata || !outChange?.assetMetadata) {
      return null;
    }

    // Use the same logic as the icon to determine which token to show for the amount
    const { isSell, tokenToShow } = determineSwapBuySell(inChange, outChange);
    const tokenChange = tokenToShow === 'IN' ? inChange : outChange;

    // For Buy: show outflow value (what you spent)
    // For Sell: show inflow value (what you received)
    // This matches user expectations: Buy shows cost, Sell shows proceeds
    const valueChange = isSell ? inChange : outChange;

    return (
      <View
        style={[
          t.absolute,
          t.right0,
          { top: Platform.OS === 'web' ? 0 : 5, gap: 4 },
          t.flexCol,
          t.itemsEnd,
        ]}
      >
        {!!valueChange?.usdPrice && (
          <Text2 color="primary" weight="medium" size="base">
            {formatPrice(valueChange.usdPrice)}
          </Text2>
        )}
        {!!tokenChange && (
          <Text2
            color="secondary"
            weight="medium"
            size="sm"
            style={{ textAlign: 'right' }}
            numberOfLines={1}
          >
            {`${formatAmount(tokenChange.value)} ${truncateString(formatTokenSymbol(tokenChange.assetMetadata.symbol), 8)}`}
          </Text2>
        )}
      </View>
    );
  }

  // Deposits into the USDC Lending vault are incoming
  const isIncoming =
    change.direction === 'IN' || change.toAddress === vault?.vault.ca;

  const isTokenUsdc = change.assetMetadata.ca
    ? isUsdc(change.assetMetadata.ca)
    : false;

  // Show USD price if available, stacked on top of amount
  if (change.usdPrice) {
    const pricePrefix = isIncoming ? '+' : '-';
    return (
      <View
        style={[
          t.absolute,
          t.right0,
          { top: Platform.OS === 'web' ? 0 : 5, gap: 4 },
          t.flexCol,
          t.itemsEnd,
        ]}
      >
        <Text2
          weight="medium"
          size="base"
          style={isIncoming ? t.texts.success : t.texts.danger}
        >
          {isTokenUsdc
            ? formatPrice(change.usdPrice)
            : `${pricePrefix}${formatPrice(change.usdPrice, { showPositiveSign: false })}`}
        </Text2>
        {!isTokenUsdc && (
          <Text2
            color="secondary"
            weight="medium"
            size="sm"
            style={{ textAlign: 'right' }}
            numberOfLines={1}
          >
            {`${formatAmount(change.value)} ${truncateString(formatTokenSymbol(change.assetMetadata.symbol), 8)}`}
          </Text2>
        )}
      </View>
    );
  }

  return (
    <Text2
      weight="medium"
      size="base"
      style={isIncoming ? t.texts.success : t.texts.danger}
    >
      {`${formatAmount(change.value)} ${truncateString(formatTokenSymbol(change.assetMetadata.symbol), 8)}`}
    </Text2>
  );
};

export const WalletActivityItem = ({
  item,
  onRowPress,
}: {
  item: ApiWalletActivity;
  onRowPress?: (item: ApiWalletActivity) => void;
}) => {
  const t = useTheme();

  return (
    <AnimatedPressable
      key={item.transaction.txHash}
      onPress={() => {
        onRowPress?.(item);
      }}
      style={[
        t.flex1,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.pY3,
        t.pX4,
        { gap: 12 },
      ]}
    >
      <ActivityTokenIcon item={item} />
      <View style={[t.flex1, t.flexCol]}>
        <View style={[t.flexRow, t.flex1, t.justifyBetween, t.itemsCenter]}>
          <ActivityTypeStatus
            type={item.type}
            status={item.status}
            item={item}
          />
          <ActivityValue item={item} />
        </View>
        <ActivityDescription item={item} frame={item.frame} />
      </View>
    </AnimatedPressable>
  );
};

export const ActivityGroupHeader = ({
  title,
  rightIcon,
}: {
  title: string;
  rightIcon?: React.ReactNode;
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        t.pX4,
        t.justifyBetween,
        t.flexRow,
        t.itemsCenter,
        { paddingTop: 12, paddingBottom: 12 },
      ]}
    >
      <Text2 weight="medium" size="base" color="primary">
        {title}
      </Text2>
      {rightIcon}
    </View>
  );
};
