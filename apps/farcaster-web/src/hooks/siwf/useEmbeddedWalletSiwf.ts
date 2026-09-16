import { SignIn } from '@farcaster/miniapp-host';
import { createSiwfMessage } from 'farcaster-client-data';
import { useEffect, useRef } from 'react';

import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

export const useEmbeddedWalletSiwf = ({
  domain,
  targetUrl,
  options,
  onSignIn,
}: {
  domain: string;
  targetUrl: string;
  options: SignIn.SignInOptions;
  onSignIn: (result: SignIn.SignInResult) => void;
}) => {
  const { ethProvider, signInWithAuthAddress } = useEmbeddedWalletBridge();
  const user = useCurrentUser();
  const runOnce = useRef(false);

  useEffect(() => {
    (async () => {
      await ethProvider.request({ method: 'eth_requestAccounts' });
      if (runOnce.current === false) {
        runOnce.current = true;

        const message = createSiwfMessage({
          domain,
          targetUrl,
          options,
          fid: user.fid,
        });
        const res = await signInWithAuthAddress({ message });
        onSignIn(res);
      }
    })();
  }, [
    ethProvider,
    domain,
    signInWithAuthAddress,
    options,
    targetUrl,
    user.fid,
    onSignIn,
  ]);
};
