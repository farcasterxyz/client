import { SignIn } from '@farcaster/miniapp-host';
import { createSiwfMessage } from 'farcaster-client-data';
import {
  useCreateRemoteSiwfRequest,
  useRemoteSiwfRequestQuery,
  useUpdateRemoteSiwfRequest,
  useUserByFid,
} from 'farcaster-client-hooks';
import { Siwe } from 'ox';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAddress } from 'viem';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

export const useRemoteSiwf = ({
  domain,
  targetUrl,
  options,
}: {
  domain: string;
  targetUrl: string;
  options: SignIn.SignInOptions;
}) => {
  const [token, setToken] = useState<string>();
  const createRequest = useCreateRemoteSiwfRequest();
  const user = useCurrentUser();
  const { result: userProfile } = useUserByFid({ fid: user.fid }).data!;

  const runOnce = useRef(false);

  useEffect(() => {
    (async () => {
      if (runOnce.current === false) {
        runOnce.current = true;

        const data = createSiwfMessage({
          domain,
          targetUrl,
          options,
          fid: user.fid,
          address: getAddress(
            userProfile.extras.custodyAddress,
          ) as `0x${string}`,
        }) as Siwe.Message;

        const message = Siwe.createMessage(data);
        const res = await createRequest({
          source: {
            type: 'frame',
            domain,
          },
          message,
        });

        setToken(res.token);
      }
    })();
  }, [
    createRequest,
    domain,
    options,
    targetUrl,
    user.fid,
    userProfile.extras.custodyAddress,
  ]);

  const { data } = useRemoteSiwfRequestQuery(
    {
      token,
    },
    {
      refetchInterval: 250,
      enabled: !!token,
    },
  );

  const updateRequest = useUpdateRemoteSiwfRequest();
  const onDismiss = useCallback(async () => {
    if (token) {
      void updateRequest({ token, error: 'dismissed' });
    }
  }, [token, updateRequest]);

  return {
    onDismiss,
    token,
    request: data?.result.request,
  };
};
