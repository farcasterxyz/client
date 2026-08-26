import { buildCustodyVerificationToken } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useWallet } from '~/contexts/WalletProvider';

import { useCurrentUser_UNSAFE } from './data/useCurrentUser';

const useComposeVerificationUrl = () => {
  const { fid } = useCurrentUser_UNSAFE();
  const { address, account } = useWallet();

  return useCallback(async () => {
    const token = await buildCustodyVerificationToken(account!);

    const url = new URL(`https://verify.farcaster.xyz/verify/${fid}`);
    url.searchParams.append('token', token);
    url.searchParams.append('address', address!);

    return url.href;
  }, [address, fid, account]);
};

export { useComposeVerificationUrl };
