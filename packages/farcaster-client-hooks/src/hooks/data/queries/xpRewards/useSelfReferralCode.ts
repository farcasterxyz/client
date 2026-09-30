import { type ApiUser } from 'farcaster-client-data';
import { useMemo } from 'react';

import { useUser } from '../user/useUser';

export type UseSelfReferralCodeResult = {
  inviter: ApiUser | undefined;
  code: string | undefined;
};

export const useSelfReferralCode = (): UseSelfReferralCodeResult => {
  // Uses `useUser` with `isCurrentUser` to resolve the current user.
  // When backend API provides a "getSelfReferralCode" endpoint, wire it here.
  const { data } = useUser({
    fid: 0 as unknown as number,
    isCurrentUser: true,
  });

  const inviter = useMemo(() => data?.result.user, [data]);

  return { inviter, code: '123456' };
};
