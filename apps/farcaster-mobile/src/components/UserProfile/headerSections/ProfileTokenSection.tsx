import { ApiProfileToken, ApiUser } from 'farcaster-client-data';
import { formatAddress, useUpdateUser } from 'farcaster-client-hooks';
import { Text2, TokenIcon, useTheme } from 'farcaster-expo';
import React from 'react';
import { Pressable } from 'react-native';

import { TokenCircleIcon } from '~/components/icons';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

type ProfileTokenSectionProps = {
  user: ApiUser;
};

export const ProfileTokenSection: React.FC<ProfileTokenSectionProps> = ({
  user,
}) => {
  const push = usePush();
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const updateUser = useUpdateUser();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const isOwnProfile = user.fid === currentUserFid;
  const profileToken = user.profile?.profileToken;
  const token = profileToken?.token;

  if (!checkUserAppContextGate('profile-tokens').value) {
    return null;
  }

  if (!profileToken?.tokenUri || !token) {
    if (!isOwnProfile) {
      return null;
    }

    const handleSetProfileToken = async () => {
      triggerImpactAsync();

      const onTokenSelected = async (token: ApiProfileToken) => {
        await updateUser({ profileToken: token.tokenUri });
      };

      push('EditProfileToken', { onTokenSelected });
    };

    return (
      <Pressable
        style={[
          t.flexRow,
          t.itemsCenter,
          t.backgrounds.secondary,
          t.border,
          t.borders.secondary,
          t.roundedFull,
          t.pX1,
          t.pY0,
          t.selfStart,
          { gap: 4, paddingVertical: 2 },
        ]}
        onPress={handleSetProfileToken}
      >
        <TokenCircleIcon size={14} color={t.colors.text.secondary} />
        <Text2 size="sm" weight="regular" color="secondary">
          Set a profile token
        </Text2>
      </Pressable>
    );
  }

  const handlePress = () => {
    if (token.chain && token.ca) {
      push('Token', {
        chain: token.chain,
        ca: token.ca,
        via: 'profile_token',
      });
    }
  };

  const displayText = token.symbol
    ? `$${token.symbol}`
    : formatAddress(token.ca);

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 20,
        gap: 4,
      }}
      onPress={handlePress}
    >
      <TokenIcon iconUrl={token.imageUrl} diameter={16} symbol={token.symbol} />
      <Text2
        size="sm"
        weight="regular"
        color="secondary"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayText}
      </Text2>
    </Pressable>
  );
};
