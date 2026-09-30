import { ApiWalletSendTarget } from 'farcaster-client-data';
import { Check, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';

import { useSharedNavigationContext, useTheme } from '../../../../contexts';
import { useOptionalSafeAreaInsets } from '../../../../hooks/useOptionalSafeAreaInsets';
import { formatAddress } from '../../../../utils';
import { ButtonV2, CircleIconBadge, Text2 } from '../../../design-system';
import { AlertIcon } from '../../../icons';
import { ActivitySpinner } from '../../../wallet/ActivitySpinner';
import { TransactionState } from './SendTokensProvider';

export function SendTokensMonitor({
  tokenLabel,
  target,
  txState,
  popCount = 1,
  isReceiving = false,
  onClose,
}: {
  tokenLabel: string;
  target: ApiWalletSendTarget;
  txState: TransactionState;
  popCount?: number;
  isReceiving?: boolean;
  onClose?: () => void;
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const { pop } = useSharedNavigationContext();

  const icon = useMemo(() => {
    switch (txState) {
      case 'pending':
        return (
          <View style={[t.justifyCenter, { height: 80 }]}>
            <ActivitySpinner />
          </View>
        );
      case 'succeeded':
        return (
          <CircleIconBadge
            variant="success"
            size="80"
            Icon={(props) => <Check {...props} />}
          />
        );
      case 'reverted':
        return (
          <CircleIconBadge
            variant="danger"
            size="80"
            Icon={(props) => <X {...props} />}
          />
        );
      case 'error-monitoring':
        return (
          <CircleIconBadge
            variant="warn"
            size="80"
            Icon={(props) => <AlertIcon {...props} />}
          />
        );
      case 'error-sending':
        return (
          <CircleIconBadge
            variant="warn"
            size="80"
            Icon={(props) => <AlertIcon {...props} />}
          />
        );
    }
  }, [txState, t.justifyCenter]);

  const title = useMemo(() => {
    switch (txState) {
      case 'pending':
        return isReceiving ? 'Receiving' : 'Sending';
      case 'succeeded':
        return isReceiving ? 'Received!' : 'Sent!';
      case 'reverted':
        return isReceiving ? 'Receive failed' : 'Send failed';
      case 'error-sending':
        return isReceiving ? 'Unable to receive' : 'Unable to send';
      case 'error-monitoring':
        return 'Error tracking transaction';
    }
  }, [isReceiving, txState]);

  const description = useMemo(() => {
    switch (txState) {
      case 'pending':
        return (
          <Text2 align="center">
            <Text2 size="lg" weight="medium" align="center">
              {tokenLabel}{' '}
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              {isReceiving ? 'from' : 'to'}{' '}
            </Text2>
            <Text2 size="lg" weight="medium" align="center">
              {target.type === 'user'
                ? target.user.username
                : formatAddress(target.address!)}
            </Text2>
          </Text2>
        );
      case 'succeeded':
        return (
          <Text2 align="center">
            <Text2 size="lg" weight="medium" align="center">
              {tokenLabel}{' '}
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              was sent to{' '}
            </Text2>
            <Text2 size="lg" weight="medium" align="center">
              {target.type === 'user'
                ? target.user.username
                : formatAddress(target.address!)}
            </Text2>
          </Text2>
        );
      case 'reverted':
        return (
          <Text2 align="center">
            <Text2 size="lg" weight="medium" align="center">
              {tokenLabel}{' '}
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              couldn't be sent to{' '}
            </Text2>
            <Text2 size="lg" weight="medium" align="center">
              {target.type === 'user'
                ? target.user.username
                : formatAddress(target.address!)}
            </Text2>
          </Text2>
        );
      case 'error-sending':
        return null;
      case 'error-monitoring':
        return (
          <Text2 size="lg" color="secondary" align="center">
            Use the link below to track.
          </Text2>
        );
    }
  }, [isReceiving, tokenLabel, target, txState]);

  return (
    <View
      style={[
        t.flex1,
        t.p3,
        { paddingBottom: Platform.OS === 'web' ? undefined : insets.bottom },
      ]}
    >
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 358, gap: 18 }, t.itemsCenter, t.justifyCenter]}
        >
          {icon}
          <View
            style={[{ gap: 12 }, t.textCenter, t.itemsCenter, t.justifyCenter]}
          >
            <Text2 weight="semibold" size="3xl" align="center">
              {title}
            </Text2>
            {description}
          </View>
        </View>
      </View>
      {txState === 'pending' && (
        <View style={[t.wFull]}>
          <ButtonV2
            title="Close"
            variant="secondary"
            onPress={() => {
              if (onClose) {
                onClose();
              } else {
                pop(popCount);
              }
            }}
          />
        </View>
      )}
      {(txState === 'succeeded' ||
        txState === 'error-monitoring' ||
        txState === 'error-sending' ||
        txState === 'reverted') && (
        <View style={[t.wFull]}>
          <ButtonV2
            title="Close"
            onPress={() => {
              if (onClose) {
                onClose();
              } else {
                pop(popCount);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}
