import { useWarpTransactions } from 'farcaster-client-hooks';

import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

const useCanAccessWarps = () => {
  const { checkUserAppContextGate } = useUserAppContextGate();

  const { data } = useWarpTransactions();

  if (data?.pages?.length === 0) {
    return false;
  }

  if (data?.pages[0]?.result.canPurchaseMore === false) {
    return false;
  }

  return checkUserAppContextGate('warps').value;
};

export { useCanAccessWarps };
