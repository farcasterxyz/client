import {
  ApiVerification,
  ApiVerificationProtocol,
  formatEthAddress as truncateEthAddress,
} from 'farcaster-client-data';
import { Pill, useEmbeddedWallet } from 'farcaster-expo';
import { MoreHorizontalIcon } from 'lucide-react-native';
import React, { FC, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import {
  FarcasterWalletImage,
  ProtocolImage,
} from '~/components/Protocol/ProtocolImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { truncateAddress as truncateSolAddress } from '~/utils/SolanaUtils';

type VerificationProps = {
  verification: ApiVerification;
  onClick: (verification: ApiVerification) => void;
  idx: number;
  numVerifications: number;
};

const getTruncatedAddress = (
  address: string,
  protocol: ApiVerificationProtocol,
) => {
  switch (protocol) {
    case 'solana':
      return truncateSolAddress(address);
    case 'ethereum':
      return truncateEthAddress(address);
  }
};

const getProtocolImage = (protocol: ApiVerificationProtocol) => {
  switch (protocol) {
    case 'solana':
      return <ProtocolImage protocol="solana" />;
    case 'ethereum':
      return <ProtocolImage protocol="eth" />;
  }
};

// This is a single column?
const Verification: FC<VerificationProps> = memo(
  ({ verification, onClick, idx, numVerifications }) => {
    const isLast = idx === numVerifications - 1;
    const t = useTheme();
    const { evmAddress, solanaAddress } = useEmbeddedWallet();

    const isWarplet =
      verification.address.toLowerCase() === evmAddress?.toLowerCase() ||
      verification.address.toLowerCase() === solanaAddress?.toLowerCase();

    const walletName = isWarplet
      ? 'Farcaster Wallet'
      : getTruncatedAddress(verification.address, verification.protocol);

    const isTheOnlyOption = numVerifications === 1;
    const cannotDelete = isTheOnlyOption || isWarplet;
    const hasOptions = !verification.isPrimary || !cannotDelete;
    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.borderFaint,
          isLast ? null : { borderBottomWidth: 1 },
          t.pX4,
          t.pY4,
        ]}
      >
        <View style={[t.mR2, t.flex, t.flexRow, t.itemsCenter]}>
          <View style={[t.mR2, t.relative]}>
            {getProtocolImage(verification.protocol)}
            {isWarplet && (
              <View style={[t.absolute, { bottom: -4, right: -4 }]}>
                <FarcasterWalletImage />
              </View>
            )}
          </View>
          <Text2 size="base" color="primary">
            {walletName}
          </Text2>
        </View>
        <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          {verification.isPrimary && (
            <>
              <Pill size="sm" variant="active">
                Primary
              </Pill>
            </>
          )}
        </View>
        {hasOptions && (
          <TouchableOpacity onPress={() => onClick(verification)}>
            <MoreHorizontalIcon style={[t.texts.tertiary, t.w4, t.h4]} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

Verification.displayName = 'Verification';

export { Verification };
