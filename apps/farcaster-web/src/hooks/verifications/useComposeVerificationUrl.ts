import { useStartVerification } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const useComposeVerificationUrl = () => {
  const { fid } = useCurrentUser();

  const startVerification = useStartVerification();

  return useCallback(async () => {
    const { result } = await startVerification();
    const token = result.token;

    const url = new URL(`https://verify.farcaster.xyz/verify/${fid}`);
    url.searchParams.append('id', token);
    url.searchParams.append(
      'redirect',
      'https://farcaster.xyz/~/settings/verified-addresses',
    );

    return url.href;
  }, [fid, startVerification]);
};

export { useComposeVerificationUrl };
