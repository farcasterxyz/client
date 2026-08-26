import { ApiTokenHolder, ApiTokenLink, ApiUser } from 'farcaster-client-data';
import {
  formatBalance,
  formatPrice,
  resolveUsernameShort,
  tokenQuantityToFloat,
  useGloballyCachedToken,
  useGloballyCachedUser,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { formatAddress } from '../../../utils';
import { Avatar } from '../../Avatar';
import { AnimatedPressable, Text2 } from '../../design-system';
import { RemoteImage } from '../../RemoteImage';

const PLACEHOLDER_AVATARS = [
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/2b4a4dca-ad0a-4c49-2628-3092542fdb00/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/7c8a92d9-981b-4c0e-d404-e0fe36114c00/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/8e311faf-3ba0-451d-76e8-6a6fde407500/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1b700552-49c9-4a2d-b572-0f7be9c7c400/original',
];

function PlaceholderAvatar({ address }: { address: string }) {
  const t = useTheme();
  const image = useMemo(() => {
    // Use address to deterministically select avatar
    const addressNum = parseInt(address.slice(2, 10), 16);
    const index = addressNum % PLACEHOLDER_AVATARS.length;
    return PLACEHOLDER_AVATARS[index];
  }, [address]);

  return (
    <RemoteImage
      uri={image}
      recyclingKey={image}
      style={[t.roundedFull, { width: 38, height: 38 }]}
    />
  );
}

function TokenHolderAvatar({
  user: fallbackUser,
  isPreview,
}: {
  user: ApiUser;
  isPreview?: boolean;
}) {
  const user = useGloballyCachedUser({ fallback: fallbackUser });
  return (
    <Avatar
      pfpUrl={user.pfp?.url}
      allowFollowingUser={!isPreview ? user : undefined}
      diameter={38}
    />
  );
}

export function TokenHolder({
  token: fallbackToken,
  holder,
  onUserPress,
}: {
  token: ApiTokenLink;
  holder: ApiTokenHolder;
  onUserPress?: ({ fid }: { fid: number }) => void;
}) {
  const t = useTheme();

  const token = useGloballyCachedToken({ fallback: fallbackToken });
  const decimals = token.decimals ?? 18;
  const priceUsd = token.priceUsd ? Number(token.priceUsd) : undefined;
  const supply = Number(token.totalSupply);
  const quantity = tokenQuantityToFloat({
    quantity: BigInt(holder.quantity),
    decimals,
  });
  const percentage = supply ? (quantity / supply) * 100 : 0;

  const value = useMemo(() => {
    if (!priceUsd) {
      return '';
    }

    return formatPrice(quantity * priceUsd);
  }, [quantity, priceUsd]);

  const handlePress = useCallback(() => {
    if (!holder.user || !onUserPress) {
      return;
    }

    onUserPress({ ...holder.user });
  }, [onUserPress, holder.user]);

  return (
    <AnimatedPressable
      key={holder.address}
      onPress={handlePress}
      style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.p3, { gap: 4 }]}
    >
      <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        {holder.user ? (
          <TokenHolderAvatar user={holder.user} />
        ) : (
          <PlaceholderAvatar address={holder.address} />
        )}
        <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
          <Text2 weight="semibold" numberOfLines={1}>
            {holder.user
              ? resolveUsernameShort({
                  fid: holder.user.fid,
                  username: holder.user.username,
                })
              : formatAddress(holder.address)}
          </Text2>
          <Text2 size="sm" weight="medium" color="tertiary" numberOfLines={1}>
            {`${formatBalance(quantity, priceUsd)} ${token.ticker}`}
            {percentage > 0.01 ? ` (${percentage.toFixed(2)}%)` : ''}
          </Text2>
        </View>
      </View>
      <View style={[t.flexCol, t.itemsEnd, { gap: 2 }]}>
        <Text2 weight="semibold">{`${value}`}</Text2>
      </View>
    </AnimatedPressable>
  );
}
