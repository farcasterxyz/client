import bs58 from 'bs58';
import {
  ApiSignedVerificationClaim,
  buildCustodyVerificationToken,
} from 'farcaster-client-data';
import {
  useOptimisticallyAddVerification,
  useOptimisticSetUserPreferences,
  usePutVerification,
  useSetUserPreferences,
  useVerificationsQuery,
} from 'farcaster-client-hooks';
import {
  solanaConnection,
  useEmbeddedWallet,
  usePublicClient,
} from 'farcaster-expo';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { mainnet } from 'viem/chains';

import { useWallet } from '~/contexts/WalletProvider';
import { trackError } from '~/utils/ErrorUtils';

import { useCurrentUser_UNSAFE } from './data/useCurrentUser';

const EIP_712_FARCASTER_VERIFICATION_CLAIM = [
  {
    name: 'fid',
    type: 'uint256',
  },
  {
    name: 'address',
    type: 'address',
  },
  {
    name: 'blockHash',
    type: 'bytes32',
  },
  {
    name: 'network',
    type: 'uint8',
  },
];

/**
 * Copy and pasted from @farcaster/js.
 * Remove once @farcaster/js is compatible with browser environments.
 */
const EIP_712_FARCASTER_DOMAIN = {
  name: 'Farcaster Verify Ethereum Address',
  version: '2.0.0',
  // fixed salt to minimize collisions
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558' as const,
};

export const useVerifyEmbeddedWallet = ({
  autoVerifyEvm = false,
  autoVerifySolana = false,
}: { autoVerifyEvm?: boolean; autoVerifySolana?: boolean } = {}) => {
  const { fid } = useCurrentUser_UNSAFE();
  const { account } = useWallet();
  const { getEthereumClient } = usePublicClient();
  const { evmAddress, getWalletClient, solanaAddress, solanaWalletProvider } =
    useEmbeddedWallet();
  const putVerification = usePutVerification();
  const { data: verificationsData, isPending } = useVerificationsQuery({ fid });
  const setUserPreferences = useSetUserPreferences();
  const optimisticSetUserPreferences = useOptimisticSetUserPreferences();
  const optimisticAddVerification = useOptimisticallyAddVerification();

  const { evmAddressVerified, solanaAddressVerified } = useMemo(() => {
    const verifications =
      verificationsData?.pages.flatMap((page) => page.result.verifications) ??
      [];

    const evmAddressVerified = verifications.some(
      (verification) =>
        verification.protocol === 'ethereum' &&
        verification.address.toLowerCase() === evmAddress?.toLowerCase(),
    );

    const solanaAddressVerified = verifications.some(
      (verification) =>
        verification.protocol === 'solana' &&
        verification.address.toLowerCase() === solanaAddress?.toLowerCase(),
    );

    return { evmAddressVerified, solanaAddressVerified };
  }, [verificationsData, evmAddress, solanaAddress]);

  const { evmAutoVerifyEnabled, solanaAutoVerifyEnabled } = useMemo(() => {
    if (isPending) {
      return { evmAutoVerifyEnabled: false, solanaAutoVerifyEnabled: false };
    }

    return {
      evmAutoVerifyEnabled: autoVerifyEvm && evmAddress && !evmAddressVerified,
      solanaAutoVerifyEnabled:
        autoVerifySolana && solanaAddress && !solanaAddressVerified,
    };
  }, [
    autoVerifyEvm,
    autoVerifySolana,
    isPending,
    evmAddressVerified,
    solanaAddressVerified,
    evmAddress,
    solanaAddress,
  ]);

  const verifyEvmEmbeddedWallet = useCallback(async () => {
    if (!evmAddress) {
      throw new Error('No embedded wallet found');
    }

    // If address is already verified, we can disable auto-verification
    if (evmAddressVerified) {
      setUserPreferences({
        preferences: { disableWarpcastWalletAutoVerification: true },
      });
      return;
    }

    const publicClient = getEthereumClient({ chain: mainnet });
    const block = await publicClient.getBlock({ blockTag: 'safe' });

    const claim = {
      fid: BigInt(fid),
      address: evmAddress.toLowerCase(),
      blockHash: block.hash,
      // Farcaster Mainnet
      network: 1,
      // Ethereum
      protocol: 0,
    };

    const walletClient = await getWalletClient(mainnet);
    const signature = await walletClient.signTypedData({
      message: claim,
      types: {
        VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM,
      },
      primaryType: 'VerificationClaim',
      domain: EIP_712_FARCASTER_DOMAIN,
    });

    const token = await buildCustodyVerificationToken(account!);
    return putVerification({
      fid,
      signedClaim: {
        chainId: 0,
        verificationType: 0,
        signature,
        claim: {
          ...claim,
          fid: Number(claim.fid),
        } as ApiSignedVerificationClaim['claim'],
      },
      token,
    }).then(() => {
      // If the verification succeeds, we will optimistically disable
      // auto-verification to avoid re-verifying the wallet before the
      // preferences are refreshed from the server.
      optimisticSetUserPreferences({
        preferences: { disableWarpcastWalletAutoVerification: true },
      });
      optimisticAddVerification({ fid, address: evmAddress });
    });
  }, [
    setUserPreferences,
    evmAddress,
    getEthereumClient,
    fid,
    getWalletClient,
    account,
    optimisticSetUserPreferences,
    optimisticAddVerification,
    putVerification,
    evmAddressVerified,
  ]);

  const verifySolanaEmbeddedWallet = useCallback(async () => {
    if (!solanaAddress) {
      throw new Error('No embedded wallet found');
    }

    // If address is already verified, we can disable auto-verification
    if (solanaAddressVerified) {
      setUserPreferences({
        preferences: { disableWarpcastWalletAutoVerification: true },
      });
      return;
    }

    const result = await solanaConnection.getLatestBlockhash();

    const claim = `fid: ${fid} address: ${solanaAddress} network: 1 blockHash: ${result.blockhash} protocol: 1`;
    const message = new TextEncoder().encode(claim);
    const { signature } = await solanaWalletProvider.request({
      method: 'signMessage',
      params: { message: Buffer.from(message).toString('base64') },
    });

    const token = await buildCustodyVerificationToken(account!);
    return putVerification({
      fid,
      signedClaim: {
        signature: bs58.encode(
          Uint8Array.from(atob(signature), (c) => c.charCodeAt(0)),
        ),
        claim: {
          fid: Number(fid),
          address: solanaAddress,
          network: 1,
          blockHash: result.blockhash,
          protocol: 1,
        } as ApiSignedVerificationClaim['claim'],
      },
      token,
    }).then(() => {
      // If the verification succeeds, we will optimistically disable
      // auto-verification to avoid re-verifying the wallet before the
      // preferences are refreshed from the server.
      optimisticSetUserPreferences({
        preferences: { disableWarpcastWalletAutoVerification: true },
      });
      optimisticAddVerification({ fid, address: solanaAddress });
    });
  }, [
    solanaAddress,
    solanaAddressVerified,
    fid,
    solanaWalletProvider,
    account,
    putVerification,
    setUserPreferences,
    optimisticSetUserPreferences,
    optimisticAddVerification,
  ]);

  const isAutoVerifyingEvm = useRef(false);
  const isAutoVerifyingSolana = useRef(false);

  useEffect(() => {
    if (evmAutoVerifyEnabled && !isAutoVerifyingEvm.current) {
      isAutoVerifyingEvm.current = true;
      void verifyEvmEmbeddedWallet().catch((e) => {
        trackError(e);
        isAutoVerifyingEvm.current = false;
      });
    }
    if (solanaAutoVerifyEnabled && !isAutoVerifyingSolana.current) {
      isAutoVerifyingSolana.current = true;
      void verifySolanaEmbeddedWallet().catch((e) => {
        trackError(e);
        isAutoVerifyingSolana.current = false;
      });
    }
  }, [
    verifyEvmEmbeddedWallet,
    evmAutoVerifyEnabled,
    solanaAutoVerifyEnabled,
    isPending,
    verifySolanaEmbeddedWallet,
  ]);

  return { verifyEvmEmbeddedWallet, verifySolanaEmbeddedWallet };
};
