import { openBrowserAsync } from 'expo-web-browser';
import {
  ApiFrame,
  ApiUser,
  ApiWalletActivity,
  ApiWalletAssetMetadata,
  getTransactionExplorerUrl,
  RELAY_SOLANA_CHAIN_ID,
} from 'farcaster-client-data';
import { formatTokenName, formatTokenSymbol } from 'farcaster-client-hooks';
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
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';

import { hitSlop } from '../../../constants/Pressable';
import { useSharedNavigationContext } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import { useHaptics } from '../../../hooks';
import { LaunchFrameParams } from '../../../types';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  formatAddress,
  formatValue,
  UNLIMITED_ALLOWANCE,
} from '../../../utils';
import { Avatar } from '../../Avatar';
import { TokenDefaultIcon, TokenIcon } from '../../crypto';
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

const getTypeText = (type: string, status: string) => {
  if (status === 'failed') {
    return `${type.charAt(0).toUpperCase() + type.split('-')[0].slice(1)} failed`;
  }

  switch (type) {
    case 'swap':
    case 'swap-v2':
      return status === 'pending' ? 'Swapping' : 'Swapped';
    case 'send':
      return status === 'pending' ? 'Sending' : 'Sent';
    case 'receive':
      return status === 'pending' ? 'Receiving' : 'Received';
    case 'approve':
      return status === 'pending' ? 'Approving' : 'Approved';
    case 'mint':
      return status === 'pending' ? 'Minting' : 'Minted';
    case 'burn':
      return status === 'pending' ? 'Burning' : 'Burned';
    case 'transaction':
      return status === 'pending' ? 'Transaction' : 'Transaction';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export const getNameFromActivity = (item: ApiWalletActivity) => {
  if (item.stateChanges.length === 0) {
    if (item.type === 'approve') {
      return item.approvals[0].assetMetadata.name;
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
      const fromName = truncateString(
        formatTokenName(outChange.assetMetadata.name),
        16,
      );
      const toName = truncateString(
        formatTokenName(inChange.assetMetadata.name),
        16,
      );
      return `${fromName} -> ${toName}`;
    }

    return 'Unknown Swap';
  }

  return truncateString(
    formatTokenName(item.stateChanges[0].assetMetadata.name),
  );
};

const ActivityFrame = ({
  frame,
  onLaunchFrame,
}: {
  frame: ApiFrame;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
}) => {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const handlePress = useCallback(() => {
    if (onLaunchFrame) {
      triggerImpactAsync();
      onLaunchFrame({
        context: {
          type: 'launcher',
        },
        config: {
          name: frame.name,
          url: frame.homeUrl,
          splashImageUrl: frame.splashImageUrl,
          splashBackgroundColor: frame.splashBackgroundColor,
        },
        author: frame.author,
      });
    }
  }, [onLaunchFrame, triggerImpactAsync, frame]);

  return (
    <View style={[t.flexRow, t.flex, t.flexShrink, t.itemsCenter, { gap: 4 }]}>
      <Text2 color="secondary" size="sm" numberOfLines={1}>
        via
      </Text2>
      <TouchableOpacity
        style={[t.flexRow, t.flex, t.flexShrink, t.itemsCenter, { gap: 4 }]}
        onPress={handlePress}
        hitSlop={hitSlop}
      >
        <MiniAppIcon imageUrl={frame.iconUrl} size={16} />
        <Text2 color="secondary" size="sm" numberOfLines={1}>
          {frame.name}
        </Text2>
      </TouchableOpacity>
    </View>
  );
};

function ActivityDescription({
  item,
  frame,
  onLaunchFrame,
  onUserPress,
}: {
  item: ApiWalletActivity;
  frame?: ApiFrame;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onUserPress?: (user: ApiUser) => void;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  if (item.stateChanges.length > 0) {
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
    if (toIdentity?.user?.username) {
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
            To
          </Text2>
          {toIdentity?.user ? (
            <TouchableOpacity
              style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
              onPress={() => {
                if (toIdentity.user) {
                  triggerImpactAsync();
                  onUserPress?.(toIdentity.user);
                }
              }}
            >
              <Avatar diameter={16} pfpUrl={toIdentity.user.pfp?.url} />
              <Text2 color="secondary" size="sm" numberOfLines={1}>
                {toDisplayName}
              </Text2>
            </TouchableOpacity>
          ) : (
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              {toDisplayName}
            </Text2>
          )}
          {frame && (
            <ActivityFrame frame={frame} onLaunchFrame={onLaunchFrame} />
          )}
        </View>
      );
    }

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
    if (fromIdentity?.user?.username) {
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
            From
          </Text2>
          {fromIdentity?.user ? (
            <TouchableOpacity
              style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
              onPress={() => {
                if (fromIdentity.user) {
                  triggerImpactAsync();
                  onUserPress?.(fromIdentity.user);
                }
              }}
            >
              <Avatar diameter={16} pfpUrl={fromIdentity.user.pfp?.url} />
              <Text2 color="secondary" size="sm" numberOfLines={1}>
                {fromDisplayName}
              </Text2>
            </TouchableOpacity>
          ) : (
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              {fromDisplayName}
            </Text2>
          )}
          {frame && (
            <ActivityFrame frame={frame} onLaunchFrame={onLaunchFrame} />
          )}
        </View>
      );
    }
  }

  const name = getNameFromActivity(item);
  const showFrame = frame && !name?.includes('...');

  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Text2 color="secondary" size="sm" numberOfLines={1}>
        {name}
      </Text2>
      {showFrame && (
        <ActivityFrame frame={frame} onLaunchFrame={onLaunchFrame} />
      )}
    </View>
  );
}

export const ActivityTypeStatus = ({
  type,
  status,
}: {
  type: string;
  status: string;
}) => {
  const t = useTheme();
  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Text2 color="primary" size="sm">
        {getTypeText(type, status)}
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
  const { push } = useSharedNavigationContext();
  const { triggerImpactAsync } = useHaptics();

  const handlePress = useCallback(
    (token?: ApiWalletAssetMetadata) => {
      if (!token) {
        return;
      }

      triggerImpactAsync();
      push({
        path: 'Token',
        params: {
          ca: token.ca || EIP7528_NATIVE_ASSET_ADDRESS,
          chain: token.chain || 'base',
          via: 'token_activity',
        },
      });
    },
    [push, triggerImpactAsync],
  );

  const assetMetadata =
    item.stateChanges[0]?.assetMetadata ?? item.approvals[0]?.assetMetadata;

  if (!assetMetadata) {
    return <View style={[{ width: 48, height: 48 }, t.bgFaint, t.roundedLg]} />;
  }

  if (item.type === 'swap') {
    const outChange = item.stateChanges.find(
      (change) => change.direction === 'OUT',
    );
    const inChange = item.stateChanges.find(
      (change) => change.direction === 'IN',
    );

    return (
      <View style={[t.relative, { width: 48, height: 48 }]}>
        <Pressable
          style={[t.absolute, { left: 0, top: 0 }]}
          hitSlop={hitSlop}
          onPress={() => handlePress(outChange?.assetMetadata)}
        >
          {outChange?.assetMetadata.assetLogoUrl ? (
            <TokenIcon
              iconUrl={outChange?.assetMetadata.assetLogoUrl}
              diameter={28}
              bgMuted
            />
          ) : (
            <TokenDefaultIcon
              symbol={outChange?.assetMetadata.symbol}
              diameter={28}
            />
          )}
        </Pressable>
        <Pressable
          style={[
            t.absolute,
            t.roundedFull,
            {
              right: 0,
              bottom: 0,
              borderWidth: 1.5,
              borderColor: t.colors.bgDefault,
            },
          ]}
          hitSlop={hitSlop}
          onPress={() => handlePress(inChange?.assetMetadata)}
        >
          {inChange?.assetMetadata.assetLogoUrl ? (
            <TokenIcon
              iconUrl={inChange?.assetMetadata.assetLogoUrl}
              diameter={30}
            />
          ) : (
            <TokenDefaultIcon
              symbol={inChange?.assetMetadata.symbol}
              diameter={30}
            />
          )}
        </Pressable>
      </View>
    );
  }

  if (item.stateChanges[0]?.assetMetadata.assetType === 'NFT') {
    if (item.stateChanges[0].assetMetadata.assetLogoUrl) {
      return (
        <View style={[t.relative, { width: 48, height: 48 }]}>
          <RemoteImage
            uri={item.stateChanges[0].assetMetadata.assetLogoUrl}
            recyclingKey={item.stateChanges[0].assetMetadata.assetLogoUrl}
            style={[
              { width: 48, height: 48 },
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
          { width: 48, height: 48 },
        ]}
      >
        <ImageIcon size={20} style={t.texts.brand} />
      </View>
    );
  }

  return (
    <Pressable
      style={[t.relative, { width: 48, height: 48 }]}
      hitSlop={hitSlop}
      onPress={() => handlePress(item.stateChanges[0]?.assetMetadata)}
    >
      {assetMetadata.assetLogoUrl ? (
        <TokenIcon
          iconUrl={assetMetadata.assetLogoUrl}
          diameter={48}
          badge={<ActivityTypeBadge type={item.type} status={item.status} />}
        />
      ) : (
        <View style={[t.relative, { width: 48, height: 48 }]}>
          <TokenDefaultIcon symbol={assetMetadata.symbol} diameter={48} />
          <View style={[t.absolute, { right: 0, bottom: 0 }]}>
            <ActivityTypeBadge type={item.type} status={item.status} />
          </View>
        </View>
      )}
    </Pressable>
  );
};

const ActivityValue = ({ item }: { item: ApiWalletActivity }) => {
  const t = useTheme();

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
    return (
      <View style={[{ gap: 4 }, t.flexCol, t.itemsEnd]}>
        {approval && (
          <Text2 color="primary" weight="medium" size="base">
            {`${
              !approval.value || approval.value >= UNLIMITED_ALLOWANCE
                ? 'All'
                : `-${formatValue(approval.value)}`
            } ${truncateString(formatTokenSymbol(approval.assetMetadata.symbol), 12)}`}
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

    return (
      <View style={[t.flexCol, t.itemsEnd, { gap: 4 }]}>
        {inChange && (
          <Text2>{`+$${formatValue(inChange.usdPrice ?? 0, 2)}`}</Text2>
        )}
        {outChange && (
          <Text2 color="danger" numberOfLines={1}>
            {`-$${formatValue(outChange.usdPrice ?? 0, 2)}`}
          </Text2>
        )}
      </View>
    );
  }

  const isIncoming = change.direction === 'IN';

  const prefix = isIncoming ? '+' : '-';

  return (
    <Text2 color={'primary'} weight="medium" size="base">
      {`${prefix}${formatValue(change.value, 6)} ${truncateString(formatTokenSymbol(change.assetMetadata.symbol))}`}
    </Text2>
  );
};

export const TokenActivityItem = ({
  item,
  onLaunchFrame,
  onUserPress,
  index,
}: {
  item: ApiWalletActivity;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onUserPress?: (user: ApiUser) => void;
  index: number;
}) => {
  const t = useTheme();

  const handlePress = useCallback(() => {
    const chainId =
      item.transaction.protocol === 'solana'
        ? RELAY_SOLANA_CHAIN_ID
        : item.transaction.chainId.toString();

    const explorerUrl = getTransactionExplorerUrl({
      type: 'tx',
      chainId,
      hash: item.transaction.txHash,
    });
    if (explorerUrl) {
      if (Platform.OS === 'web') {
        Linking.openURL(explorerUrl);
      } else {
        openBrowserAsync(explorerUrl);
      }
    }
  }, [item.transaction]);

  return (
    <AnimatedPressable
      key={item.transaction.txHash}
      onPress={handlePress}
      style={[
        t.flex1,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        {
          paddingVertical: 6,
          paddingHorizontal: 12,
          gap: 12,
          backgroundColor:
            index % 2 === 0 ? undefined : t.colors.background.quaternary,
        },
      ]}
    >
      <View
        style={[
          t.flex1,
          t.justifyBetween,
          t.itemsStart,
          {
            gap: 4,
          },
        ]}
      >
        <ActivityTypeStatus type={item.type} status={item.status} />
        <Text2 size="xs" weight="medium" color="secondary">
          {new Date(item.timestamp).toLocaleDateString()}
        </Text2>
      </View>
      <View
        style={[
          t.flex1,
          t.justifyBetween,
          t.itemsCenter,
          { gap: 4, borderWidth: 1, borderColor: 'blue' },
        ]}
      >
        <ActivityValue item={item} />
        <ActivityDescription
          item={item}
          frame={item.frame}
          onLaunchFrame={onLaunchFrame}
          onUserPress={onUserPress}
        />
      </View>
    </AnimatedPressable>
  );
};
