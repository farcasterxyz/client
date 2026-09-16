import { Ionicons } from '@expo/vector-icons';
import {
  ApiWalletSendAddressTarget,
  ApiWalletSendTarget,
  ApiWalletSendUserTarget,
} from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import { Link2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../../contexts';
import { useCurrentUser } from '../../../../hooks';
import { formatAddress } from '../../../../utils';
import { Avatar } from '../../../Avatar';
import {
  AnimatedPressable,
  CircleIconBadge,
  Text2,
} from '../../../design-system';

type SendTokensTargetProps<TTarget = ApiWalletSendTarget> = {
  target: TTarget;
  onPress?: (target: TTarget) => void;
  style?: StyleProp<ViewStyle>;
  expandAddress?: boolean;
};

export function SendTokensTarget({ target, ...rest }: SendTokensTargetProps) {
  const currentUser = useCurrentUser();
  const currentUserFid = currentUser?.fid;

  switch (target.type) {
    case 'user':
      if (currentUserFid === target.user.fid) {
        return <SendTokensVerifiedAddressTarget target={target} {...rest} />;
      }
      return <SendTokensUserTarget target={target} {...rest} />;
    case 'address':
      return <SendTokensAddressTarget target={target} {...rest} />;
  }
}

export function SendTokensUserTarget({
  target,
  onPress,
  style,
}: SendTokensTargetProps<ApiWalletSendUserTarget>) {
  const t = useTheme();
  const { user, address } = target;

  const chipTitle = useMemo(() => {
    const viewerContext = target.user.viewerContext;
    if (!viewerContext) {
      return;
    }
    if (viewerContext.following === true) {
      return 'Following';
    }
  }, [target]);

  const followingWidget = useMemo(() => {
    if (!chipTitle) {
      return;
    }
    return (
      <View
        style={[
          Platform.OS === 'web' ? t.bgMuted : t.bgFaint,
          { borderRadius: 24 },
          t.itemsCenter,
          t.justifyCenter,
        ]}
      >
        <Text2
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          size="xs"
          color="secondary"
        >
          {chipTitle}
        </Text2>
      </View>
    );
  }, [chipTitle, t]);

  return (
    <AnimatedPressable
      style={[
        t.flexRow,
        t.itemsCenter,
        { gap: 8, opacity: target.address ? 1 : 0.6 },
        style,
      ]}
      onPress={onPress && target.address ? () => onPress(target) : undefined}
    >
      <Avatar pfpUrl={user.pfp?.url} diameter={40} />
      <View>
        <View style={[t.flex, t.flexRow, { gap: 6 }, t.itemsCenter]}>
          <Text2 size="base" color="primary" weight="medium">
            {resolveUsernameShort(user)}
          </Text2>
          {followingWidget}
        </View>
        <Text2 size="sm" color="tertiary">
          {address ? formatAddress(address) : 'No address found'}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}

export function SendTokensVerifiedAddressTarget({
  target,
  onPress,
  style,
}: SendTokensTargetProps<ApiWalletSendUserTarget>) {
  const t = useTheme();
  const { user, address } = target;

  return (
    <AnimatedPressable
      style={[
        t.flexRow,
        t.itemsCenter,
        { gap: 8, opacity: target.address ? 1 : 0.6 },
        style,
      ]}
      onPress={onPress && target.address ? () => onPress(target) : undefined}
    >
      <View>
        <Avatar pfpUrl={user.pfp?.url} diameter={40} />
        <CircleIconBadge
          size="18"
          variant="lightPurple"
          Icon={(props) => <Link2 {...props} size={10} />}
          style={[
            {
              position: 'absolute',
              bottom: -4,
              right: -4,
              borderColor: t.colors.bgDefault,
            },
            t.border2,
          ]}
        />
      </View>
      <View>
        <Text2 size="base" color="primary" weight="medium">
          {address ? formatAddress(address) : 'No address found'}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}

export function SendTokensAddressTarget({
  target,
  onPress,
  style,
}: SendTokensTargetProps<ApiWalletSendAddressTarget>) {
  const t = useTheme();
  const { address } = target;

  return (
    <AnimatedPressable
      style={[t.flexRow, t.itemsCenter, { gap: 8 }, style]}
      onPress={onPress ? () => onPress(target) : undefined}
    >
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          t.bgFaint,
          { width: 40, height: 40 },
        ]}
      >
        <Ionicons
          name="wallet-outline"
          size={20}
          color={t.colors.text.secondary}
        />
      </View>
      <View>
        <Text2 size="base" color="primary" weight="medium">
          {formatAddress(address)}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}
