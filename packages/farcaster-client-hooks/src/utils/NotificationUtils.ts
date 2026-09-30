import {
  ApiFrame,
  ApiLimitOrderKind,
  ApiOnchainTokenMinimal,
  isNativeAsset,
  isUsdc,
  isWrappedNativeAsset,
} from 'farcaster-client-data';

import { tokenQuantityToFloat } from './CryptoUtils';

export function getMiniAppNotificationPreferenceSummary({
  inAppNotificationsEnabled,
  pushNotificationsEnabled,
}: {
  inAppNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}): 'Both' | 'In-app' | 'Push' | 'Off' {
  if (inAppNotificationsEnabled && pushNotificationsEnabled) {
    return 'Both';
  }
  if (inAppNotificationsEnabled) {
    return 'In-app';
  }
  if (pushNotificationsEnabled) {
    return 'Push';
  }
  return 'Off';
}

export function canDisableMiniAppPushNotifications({
  featureEnabled,
  miniApp,
  locallyDisabled = false,
}: {
  featureEnabled: boolean;
  miniApp?: Pick<ApiFrame, 'supportsPushNotifications' | 'viewerContext'>;
  locallyDisabled?: boolean;
}): boolean {
  return (
    featureEnabled &&
    !locallyDisabled &&
    miniApp?.supportsPushNotifications === true &&
    miniApp.viewerContext?.pushNotificationsEnabled === true
  );
}

// Extract the notification tab from the group id which should have the format
// tab:type:notificationId, e.g
// priority!cast-reaction:0x3ca76f85044994b0ff851e8e9cc419b6fea269aa92e3cc8fd64a215e4f061723
export function extractNotificationTabFromGroupId(groupId: string | undefined) {
  if (!groupId) {
    return undefined;
  }

  const idParts = groupId.split(':');
  if (idParts.length >= 3) {
    return idParts[0];
  }
  return undefined;
}

export function inferLimitOrderKindFromTokens({
  sellToken,
  buyToken,
}: {
  sellToken: Pick<ApiOnchainTokenMinimal, 'ca'>;
  buyToken: Pick<ApiOnchainTokenMinimal, 'ca'>;
}): ApiLimitOrderKind {
  const isSellUsdc = isUsdc(sellToken.ca);
  const isBuyUsdc = isUsdc(buyToken.ca);
  const isSellNative =
    isNativeAsset(sellToken.ca) || isWrappedNativeAsset(sellToken.ca);
  const isBuyNative =
    isNativeAsset(buyToken.ca) || isWrappedNativeAsset(buyToken.ca);

  if (isSellUsdc) {
    return 'buy';
  }
  if (isBuyUsdc) {
    return 'sell';
  }
  if (isSellNative && !isBuyNative) {
    return 'buy';
  }
  if (isBuyNative && !isSellNative) {
    return 'sell';
  }

  return 'sell';
}

export function resolveLimitOrderKind({
  kind,
  sellToken,
  buyToken,
}: {
  kind: ApiLimitOrderKind | undefined;
  sellToken: Pick<ApiOnchainTokenMinimal, 'ca'>;
  buyToken: Pick<ApiOnchainTokenMinimal, 'ca'>;
}): ApiLimitOrderKind {
  if (kind) {
    return kind;
  }

  return inferLimitOrderKindFromTokens({ sellToken, buyToken });
}

export function formatLimitOrderTokenDisplayAmount(
  amount: string | bigint,
  decimals: number,
  symbol: string,
): string {
  let value: number | undefined;
  try {
    value = tokenQuantityToFloat({
      quantity: BigInt(String(amount)),
      decimals,
    });
  } catch {
    value = undefined;
  }
  if (value === undefined) {
    return symbol || 'tokens';
  }

  const formatted =
    value >= 1
      ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
      : value.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return `${formatted} ${symbol}`;
}

export function formatLimitOrderMatchedNotificationCopy({
  kind,
  sellToken,
  buyToken,
  sellAmount,
  buyAmount,
  isPartialFill,
}: {
  kind: ApiLimitOrderKind;
  sellToken: Pick<ApiOnchainTokenMinimal, 'symbol' | 'decimals'>;
  buyToken: Pick<ApiOnchainTokenMinimal, 'symbol' | 'decimals'>;
  sellAmount: string;
  buyAmount: string;
  isPartialFill: boolean;
}): { title: string; body: string } {
  const title = isPartialFill
    ? 'Limit order partially filled'
    : 'Limit order filled';
  const sellDisplay = formatLimitOrderTokenDisplayAmount(
    sellAmount,
    sellToken.decimals,
    sellToken.symbol,
  );
  const buyDisplay = formatLimitOrderTokenDisplayAmount(
    buyAmount,
    buyToken.decimals,
    buyToken.symbol,
  );
  const body =
    kind === 'buy'
      ? `Bought ${buyDisplay} for ${sellDisplay}`
      : `Sold ${sellDisplay} for ${buyDisplay}`;

  return { title, body };
}

export function getLimitOrderMatchedNotificationToken({
  kind,
  sellToken,
  buyToken,
}: {
  kind: ApiLimitOrderKind;
  sellToken: ApiOnchainTokenMinimal;
  buyToken: ApiOnchainTokenMinimal;
}): ApiOnchainTokenMinimal {
  return kind === 'buy' ? buyToken : sellToken;
}
