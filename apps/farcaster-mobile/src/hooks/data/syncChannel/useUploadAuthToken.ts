import { useLoginWithFarcasterV2 } from '@privy-io/expo';
import {
  useRefreshOnboardingStateAndAuthToken,
  useUpdateSyncChannel,
} from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { assertHex } from 'farcaster-expo';
import * as Siwe from 'ox/Siwe';
import { useCallback } from 'react';

import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useWallet } from '~/contexts/WalletProvider';

const useUploadAuthToken = () => {
  const { dataStore } = useFarcasterAsyncDataStore();
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const updateSyncChannel = useUpdateSyncChannel();
  const { account } = useWallet();
  const refreshOnboardingStateAndAuthToken =
    useRefreshOnboardingStateAndAuthToken();
  const { setAuthToken } = useAuthToken();
  const siwf2 = useLoginWithFarcasterV2();

  return useCallback(
    async ({ channelId }: { channelId: string }) => {
      const transport = await getKeyTransport({ dataStore, keyStore });

      const data = await refreshOnboardingStateAndAuthToken({
        account: account!,
      });
      if (data === null) {
        // eslint-disable-next-line no-console
        console.warn(
          'data was null: useUploadAuthToken:refreshOnboardingStateAndAuthToken',
        );
      }

      const { result } = data;

      const authToken = result.token;

      if (!authToken) {
        return;
      }

      // Adopt the freshly-minted token on THIS device before uploading it.
      // refreshOnboardingStateAndAuthToken mints a new auth token, and the
      // backend's one-token-per-device dedup soft-revokes this device's
      // PREVIOUS token as part of that mint (same fid + same FC-DEVICE-ID).
      // Without adopting the new token here, this client keeps using the
      // now-superseded token and gets involuntarily signed out ~10 min later
      // (SUPERSEDED_TOKEN_GRACE_MS) when the old token's grace elapses — a
      // self-inflicted logout triggered just by opening "sign in on another
      // device". Mirrors the mint + setAuthToken pattern in
      // usePollForRegistrationComplete.
      //
      // NB: the receiving device adopts this same token directly
      // (LoginWithMobile → signIn), so it is minted with THIS device's
      // FC-DEVICE-ID and remains collateral to this device's future dedup — a
      // separate cross-device-session concern that needs the upload mint to
      // carry no/target deviceId (or the receiver to bootstrap its own token).
      // That is out of scope here; this fix only stops the local self-logout.
      await setAuthToken({ authToken });

      const { nonce } = await siwf2.init();
      const siweData = {
        version: '1',
        address: assertHex(account!.address),
        statement: 'Farcaster Auth',
        chainId: 10,
        resources: [
          `farcaster://fid/${data.result.state.user?.fid}`,
        ] as string[],
        domain: 'wallet.farcaster.xyz',
        // ensure valid RFC 3986 resource URI, a bit surprised this is needed
        // but URLs of origins without trailing slashes were throwing from ox
        uri: 'https://farcaster.xyz/login',
        nonce,
      } as const satisfies Siwe.Message;

      const siweMessage = Siwe.createMessage(siweData);
      const signature = await account!.signMessage({ message: siweMessage });

      const message = await transport!.encryptString(
        channelId,
        JSON.stringify({
          authToken,
          message: siweMessage,
          signature,
        }),
      );
      await updateSyncChannel(message);
    },
    [
      dataStore,
      keyStore,
      refreshOnboardingStateAndAuthToken,
      setAuthToken,
      account,
      siwf2,
      updateSyncChannel,
    ],
  );
};

export { useUploadAuthToken };
