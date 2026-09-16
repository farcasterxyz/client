import { useQueryClient } from '@tanstack/react-query';
import {
  ApiGetOnboardingState200Response,
  ApiGetOnboardingStateAndAuthToken200Response,
  buildCustodyBearerPayload,
  canonicalizeCustodyBearerPayload,
} from 'farcaster-client-data';
import { buildOnboardingStateKey } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useEffect, useRef } from 'react';
import { hexToBytes } from 'viem';

import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { baseApiUrl } from '~/constants/api';
import { getOnboardingStateKey } from '~/constants/storage';
import { getPersistedDeviceId } from '~/utils/deviceIdUtils';
import { trackError } from '~/utils/errorUtils';
import { setItem } from '~/utils/storageUtils';

import { useAuth } from './AuthProvider';
import { authSessionRecoveryRef } from './authSessionRecoveryRef';
import { authSignOutRef } from './authSignOutRef';

const EIP_191_PREFIX = 'eip191:';

const AuthSessionRecoveryBridge: FC = memo(() => {
  const queryClient = useQueryClient();
  const { authToken, signIn } = useAuth();
  const { initialized, isConnected, silentlySignAuthMessage } =
    useEmbeddedWalletBridge();
  const activeRecoveryPromiseRef = useRef<Promise<boolean> | null>(null);

  const recoverSession = useCallback(async () => {
    if (!authToken || !initialized || !isConnected) {
      return false;
    }

    try {
      const authRequest = buildCustodyBearerPayload();
      const canonicalizedAuthRequest =
        canonicalizeCustodyBearerPayload(authRequest);
      if (!canonicalizedAuthRequest) {
        return false;
      }

      const { signature } = await silentlySignAuthMessage({
        message: canonicalizedAuthRequest,
      });
      const signatureBase64 = Buffer.from(hexToBytes(signature)).toString(
        'base64',
      );
      const authSignatureToken = EIP_191_PREFIX + signatureBase64;

      const response = await fetch(
        new URL('/v2/onboarding-state', baseApiUrl),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authSignatureToken}`,
            'Content-Type': 'application/json',
            // This raw fetch bypasses the apiClient (and its meta headers),
            // but it MINTS a new auth token — without FC-DEVICE-ID the
            // backend's one-token-per-device dedup can't replace this
            // browser's previous session, so every recovery re-mint would
            // accumulate in auth-tokens:{fid}.
            'FC-DEVICE-ID': getPersistedDeviceId(),
          },
          body: JSON.stringify({
            authRequest,
          }),
        },
      );

      if (!response.ok) {
        return false;
      }

      const onboardingStateAndAuthToken =
        (await response.json()) as ApiGetOnboardingStateAndAuthToken200Response;
      const nextAuthToken = onboardingStateAndAuthToken.result?.token;
      if (!nextAuthToken) {
        return false;
      }

      const nextOnboardingState: ApiGetOnboardingState200Response = {
        result: {
          state: onboardingStateAndAuthToken.result.state,
        },
      };
      const oldOnboardingStateKey = await getOnboardingStateKey(
        authToken.secret,
      );
      const newOnboardingStateKey = await getOnboardingStateKey(
        nextAuthToken.secret,
      );
      if (oldOnboardingStateKey !== newOnboardingStateKey) {
        await setItem({
          key: oldOnboardingStateKey,
          value: undefined,
        });
      }
      await setItem({
        key: newOnboardingStateKey,
        value: nextOnboardingState,
      });
      queryClient.setQueryData(buildOnboardingStateKey(), nextOnboardingState);

      await signIn({ authToken: nextAuthToken });
      return true;
    } catch (error) {
      trackError(error);
      return false;
    }
  }, [
    authToken,
    initialized,
    isConnected,
    queryClient,
    signIn,
    silentlySignAuthMessage,
  ]);

  const startSessionRecovery = useCallback(() => {
    if (!authToken || !initialized || !isConnected) {
      return false;
    }

    if (activeRecoveryPromiseRef.current) {
      return true;
    }

    const recoveryPromise = recoverSession().finally(() => {
      if (activeRecoveryPromiseRef.current === recoveryPromise) {
        activeRecoveryPromiseRef.current = null;
      }
    });
    activeRecoveryPromiseRef.current = recoveryPromise;

    recoveryPromise.then((didRecover) => {
      if (!didRecover) {
        void authSignOutRef.current?.();
      }
    });

    return true;
  }, [authToken, initialized, isConnected, recoverSession]);

  useEffect(() => {
    authSessionRecoveryRef.current = startSessionRecovery;
    return () => {
      if (authSessionRecoveryRef.current === startSessionRecovery) {
        authSessionRecoveryRef.current = null;
      }
    };
  }, [startSessionRecovery]);

  return null;
});

AuthSessionRecoveryBridge.displayName = 'AuthSessionRecoveryBridge';

export { AuthSessionRecoveryBridge };
