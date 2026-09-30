import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useCreateRemoteSiwfRequest,
  useRemoteSiwfRequestQuery,
  useUserByFid,
} from 'farcaster-client-hooks';
import * as Siwe from 'ox/Siwe';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { getAddress } from 'viem';

import {
  useEmbeddedWallet,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { useCurrentUser } from '../../../hooks';
import {
  ButtonV2,
  FullScreenLoadingIndicator,
  LoadingIndicator,
  Text2,
} from '../../design-system';

const phoneImage = require('./phone.png');
const phoneImageDark = require('./phoneDark.png');

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location?.search?.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][expo]', ...args);
};

export function WalletAuthentication() {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return <FullScreenLoadingIndicator />;
  }

  return <WalletAuthenticationExistingUser fid={currentUser.fid} />;
}

function WalletAuthenticationExistingUser({ fid }: { fid: number }) {
  const t = useTheme();
  const createRequest = useCreateRemoteSiwfRequest();
  const { initConnect, connect } = useEmbeddedWallet();
  const [token, setToken] = useState<string>();
  const { data: user } = useUserByFid({ fid });
  const { trackEvent } = useSharedTelemetry();
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<Error | null>();

  useEffect(() => {
    siwfLog('WalletAuthenticationExistingUser mounted', {
      fid,
      hasInitConnect: !!initConnect,
      hasUser: !!user,
      ts: Date.now(),
    });
  }, [fid, initConnect, user]);

  const handleSiwfRequest = useCallback(async () => {
    siwfLog('handleSiwfRequest start', {
      hasInitConnect: !!initConnect,
      hasUser: !!user,
      ts: Date.now(),
    });
    if (!initConnect) {
      siwfLog('handleSiwfRequest error: initConnect undefined');
      throw new Error('initConnect is not defined');
    }

    if (!user) {
      siwfLog('handleSiwfRequest error: user undefined');
      throw new Error('user is not defined');
    }

    setCountdown(60);

    try {
      siwfLog('handleSiwfRequest calling initConnect (Privy init)');
      const { nonce, expiresAt } = await initConnect();
      siwfLog('handleSiwfRequest initConnect resolved', {
        hasNonce: !!nonce,
        hasExpiresAt: !!expiresAt,
        ts: Date.now(),
      });

      const data = {
        version: '1',
        address: getAddress(user.result.extras.custodyAddress),
        statement: 'Farcaster Auth',
        chainId: 10,
        resources: [`farcaster://fid/${user.result.user.fid}`] as string[],
        domain: 'farcaster.xyz',
        uri: 'https://farcaster.xyz/login',
        nonce: nonce,
        expirationTime: new Date(expiresAt),
      } as const satisfies Siwe.Message;

      const message = Siwe.createMessage(data);
      siwfLog('handleSiwfRequest calling createRemoteSiwfRequest');
      const res = await createRequest({
        source: {
          type: 'wallet',
        },
        message,
      });
      siwfLog('handleSiwfRequest createRequest resolved', {
        hasToken: !!res.token,
        ts: Date.now(),
      });

      trackEvent(AnalyticsEvent.WebWalletLoginAttempt);
      setToken(res.token);
    } catch (error) {
      siwfLog('handleSiwfRequest threw', {
        message: (error as Error)?.message,
        name: (error as Error)?.name,
      });
      setError(error as Error);
      setCountdown(0);
    }
  }, [initConnect, createRequest, user, trackEvent]);

  const { data } = useRemoteSiwfRequestQuery(
    {
      token,
    },
    {
      refetchInterval: 250,
      enabled: !!token,
    },
  );

  useEffect(() => {
    const request = data?.result.request;
    if (request) {
      siwfLog('poll tick result', {
        hasSignature: !!request.signature,
        hasError: !!request.error,
        ts: Date.now(),
      });
    }
    if (request?.signature) {
      siwfLog('poll picked up signature → calling Privy connect()', {
        ts: Date.now(),
      });
      connect({
        fid: user?.result.user.fid ?? 0,
        message: request.message,
        signature: request.signature,
      });
      trackEvent(AnalyticsEvent.WebWalletLogin);
    } else if (request?.error) {
      siwfLog('poll returned error (boolean only, no body)');
      setCountdown(0);
    }
  }, [data, connect, user, trackEvent]);

  useEffect(() => {
    if (countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((countdown) => countdown - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdown]);

  const Icon = useMemo(() => {
    return () => <LoadingIndicator />;
  }, []);

  return (
    <View style={[t.flex1, t.justifyBetween, t.p6, { gap: 24 }]}>
      <View style={[{ gap: 12 }]}>
        <View
          style={[
            t.selfCenter,
            t.justifyCenter,
            t.m6,
            { width: 200, height: 200 },
          ]}
        >
          <View style={[t.absolute, t.inset0, t.justifyCenter, t.itemsCenter]}>
            <View
              style={[t.bgFaint, { height: 90, width: 200, borderRadius: 12 }]}
            />
          </View>
          <Image
            source={t.dark ? phoneImageDark : phoneImage}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'contain',
            }}
          />
        </View>
        <Text2 size="2xl" weight="semibold" align="center">
          Confirm it's you
        </Text2>
        <Text2 color="secondary" align="center">
          Click "Continue" below and tap "Approve" on your Farcaster mobile app
          to start using your wallet on web.
        </Text2>
      </View>
      <View style={[{ gap: 12 }]}>
        {error && (
          <Text2 color="danger" align="center">
            {error.message}
          </Text2>
        )}
        <ButtonV2
          onPress={handleSiwfRequest}
          title={countdown > 0 ? `Resend in ${countdown}s` : 'Continue'}
          disabled={countdown > 0}
          variant={countdown > 0 ? 'secondary' : 'primary'}
          Icon={countdown > 0 ? Icon : undefined}
        />
        <Text2 color="secondary" size="xs" align="center">
          You'll stay signed in for 30 days on this browser.
        </Text2>
      </View>
    </View>
  );
}
