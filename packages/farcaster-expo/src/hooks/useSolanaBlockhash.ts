import * as React from 'react';

import { solanaConnection } from '../utils';

export function useSolanaBlockhash({ enabled = true }: { enabled?: boolean }) {
  const [recentSolanaBlockhash, setRecentSolanaBlockhash] = React.useState<
    string | undefined
  >();
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    (async () => {
      const { blockhash } = await solanaConnection.getLatestBlockhash();
      setRecentSolanaBlockhash(blockhash);
    })();
  }, [enabled]);

  return recentSolanaBlockhash;
}
