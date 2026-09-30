import * as Siwe from 'ox/Siwe';
import { useCallback } from 'react';

import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const useSiwf = () => {
  const currentUser = useCurrentUser();
  const { account } = useWallet();

  return useCallback(
    async ({
      nonce,
      expirationTime,
      uri,
    }: {
      nonce: string;
      expirationTime: Date;
      uri: string;
    }) => {
      if (!account) {
        throw new Error(
          'Attempted to login with Farcaster with no custody wallet',
        );
      }

      if (!currentUser) {
        throw new Error(
          'Attempted to login with Farcaster when user is not signed in',
        );
      }

      const urlObject = new URL(uri);

      const data = {
        version: '1',
        address: account!.address,
        statement: 'Farcaster Auth',
        chainId: 10,
        resources: [`farcaster://fid/${currentUser.fid}`] as string[],
        domain: urlObject.hostname,
        uri,
        nonce,
        expirationTime,
      } as const satisfies Siwe.Message;

      const message = Siwe.createMessage(data);
      const signature = await account!.signMessage({ message });

      return {
        message,
        signature,
        fid: currentUser.fid,
      };
    },
    [currentUser, account],
  );
};

export { useSiwf };
