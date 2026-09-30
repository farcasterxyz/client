import { Octicons } from '@expo/vector-icons';
import {
  AppClient,
  createAppClient,
  createWalletClient,
  ParseSignInURIResponse,
  viemConnector,
  WalletClient,
} from '@farcaster/auth-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useSignInWithFarcaster, useUser } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import type { Hex } from 'viem';

import { Divider } from '~/components/Divider';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { RemoteImage } from '~/components/RemoteImage';
import { buildScreen } from '~/components/Screen';
import { Text, Text2 } from '~/components/Text';
import { Well } from '~/components/Well';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

const useAppClient = () => {
  const appClientRef = useRef<AppClient | null>(null);

  // type-safe non-null value
  function getClient() {
    if (appClientRef.current !== null) {
      return appClientRef.current;
    }
    const authClient = createAppClient({
      ethereum: viemConnector(),
    });

    appClientRef.current = authClient;
    return authClient;
  }

  return getClient();
};

const useWalletClient = () => {
  const walletClientRef = useRef<WalletClient | null>(null);

  // type-safe non-null value
  function getClient() {
    if (walletClientRef.current !== null) {
      return walletClientRef.current;
    }
    const authClient = createWalletClient({
      ethereum: viemConnector(),
    });

    walletClientRef.current = authClient;
    return authClient;
  }

  return getClient();
};

type SignatureParams = {
  uri: string;
  domain: string;
  nonce?: string;
  notBefore?: string;
  expirationTime?: string;
  requestId?: string;
  redirectUrl?: string;
};

type SignInWithFarcasterScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'SignInWithFarcaster'
>;

const SignInWithFarcasterScreen = buildScreen<SignInWithFarcasterScreenProps>(
  { name: 'SignInWithFarcaster', insetBottom: false },
  ({
    route: {
      params: { signInUri },
    },
  }) => {
    const { trackEvent } = useAnalytics();
    const walletClient = useWalletClient();
    const appClient = useAppClient();

    const [signatureParams, setSignatureParams] = useState<SignatureParams>();
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const parsedUri = walletClient.parseSignInURI({
      uri: signInUri,
    });

    const getSignatureParams = useCallback(async () => {
      try {
        setIsLoading(true);
        const {
          isError,
          error,
          data: { signatureParams },
        } = await appClient.status({
          channelToken: parsedUri.channelToken,
        });
        if (isError) {
          trackEvent(AnalyticsEvent.SignInWithFarcasterFailed, {
            step: 'get-signature-params',
            error: error?.message,
          });
          trackError(error);
          setIsError(true);
        } else {
          const { siweUri, ...params } = signatureParams;
          setSignatureParams({ uri: siweUri, ...params });
          setSuccess(true);
        }
      } catch (e) {
        trackError(e);
        trackEvent(AnalyticsEvent.SignInWithFarcasterFailed, {
          step: 'get-signature-params',
        });
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }, [appClient, parsedUri.channelToken, trackEvent]);

    const retry = useCallback(async () => {
      setIsError(false);
      await getSignatureParams();
    }, [getSignatureParams]);

    useEffect(() => {
      if (!success && !isLoading && !isError) {
        getSignatureParams();
      }
    }, [getSignatureParams, isError, isLoading, success]);

    if (parsedUri.isError) {
      return <MalformedUri />;
    }

    if (isError) {
      return <RelayUnavailable retry={retry} />;
    }

    if (success && signatureParams) {
      return <SignIn parsedUri={parsedUri} signatureParams={signatureParams} />;
    }

    return <FullScreenLoadingIndicator />;
  },
);

function SignIn({
  parsedUri,
  signatureParams,
}: {
  parsedUri: ParseSignInURIResponse;
  signatureParams: SignatureParams;
}) {
  const t = useTheme();
  const pop = usePop();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const { account } = useWallet();
  const currentUser = useCurrentUser_UNSAFE();
  const user = useUser({ fid: currentUser.fid, isCurrentUser: true }).data!
    .result.user;

  const signInWithFarcaster = useSignInWithFarcaster();
  const walletClient = useWalletClient();
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      setSubmitting(true);
      trackEvent(AnalyticsEvent.SignInWithFarcaster, {
        domain: signatureParams.domain,
      });

      const { isError, error, message } = walletClient.buildSignInMessage({
        ...signatureParams,
        address: account!.address,
        fid: user.fid,
        expirationTime: signatureParams.expirationTime
          ? new Date(signatureParams.expirationTime)
          : undefined,
        notBefore: signatureParams.notBefore
          ? new Date(signatureParams.notBefore)
          : undefined,
      });

      if (isError) {
        throw error;
      }

      const signature = await account!.signMessage({
        message: message as Hex,
      });
      await signInWithFarcaster({
        message,
        channelToken: parsedUri.channelToken,
        signature: signature as `0x${string}`,
      });

      if (signatureParams.redirectUrl) {
        await Linking.openURL(signatureParams.redirectUrl);
        pop();
      }

      setSuccess(true);
    } catch (e) {
      toast.show('Sign in failed', { placement: 'top', type: 'danger' });
      trackError(e);
      trackEvent(AnalyticsEvent.SignInWithFarcasterFailed, {
        step: 'sign-in',
        domain: signatureParams.domain,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (signatureParams.domain.includes('farcaster.xyz')) {
    return (
      <View style={[t.hFull, t.justifyCenter, t.p3]}>
        <Text2 align="center" weight="semibold" size="2xl" color="danger">
          Not Allowed
        </Text2>
        <Text2 align="center" color="danger">
          This app requested a malicious signature.
        </Text2>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[t.hFull, t.p4, t.flex]}>
        <View style={[{ flexGrow: 1 }]} />
        <View style={[{ flexGrow: 2 }, t.flex, t.itemsCenter]}>
          <View
            style={[
              t.roundedFull,
              t.bgSuccess,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.h12,
              t.w12,
            ]}
          >
            <Octicons name="check" size={24} style={[{ color: '#ffffff' }]} />
          </View>
          <Text
            style={[
              t.texts.primary,
              t.textCenter,
              t.text2xl,
              t.mT4,
              t.fontBold,
            ]}
          >
            Signed in
          </Text>
          <Text style={[t.texts.secondary, t.textCenter, t.textBase, t.mT2]}>
            You can now return to{' '}
            <Text style={[t.underline]}>{signatureParams.domain}</Text>
          </Text>
        </View>
        <View style={[t.flexNone]}>
          <AtomsButton hierarchy="primary" onPress={pop} size="l">
            Return to Farcaster
          </AtomsButton>
        </View>
      </View>
    );
  }

  return (
    <View style={[t.hFull, t.flex]}>
      <View style={[t.flex1]}>
        <View style={[t.p4]}>
          <Well
            style={[t.flex, t.flexRow, t.bgDefault, t.wFull, t.roundedLg, t.p4]}
          >
            <View style={[t.mR3]}>
              <RemoteImage
                width={68}
                height={68}
                uri={user.pfp?.url}
                style={[t.roundedFull, t.borderDefault, t.borderHairline]}
                fallbackSource={{ uri: defaultAvatarUrl }}
                shouldFadeIn={false}
              />
            </View>
            <View style={[t.flex1, t.flex, t.flexCol, t.justifyAround, t.mY2]}>
              <Text
                style={[t.wFull, t.texts.primary, t.textLg, t.fontSemibold]}
                numberOfLines={1}
              >
                {user.displayName}
              </Text>
              {user.username && (
                <Text
                  style={[t.wFull, t.textBase, t.texts.secondary, t.mT1]}
                  numberOfLines={1}
                >
                  @{user.username}
                </Text>
              )}
            </View>
          </Well>
        </View>
        <Divider marginVertical="slim" />
        <View style={[t.p4]}>
          <Text style={[t.wFull, t.texts.primary, t.textBase, t.mB5]}>
            <Text style={[t.fontSemibold]}>{signatureParams.domain} </Text>
            <Text style={[t.texts.secondary]}>
              will get the following details:
            </Text>
          </Text>

          <View style={[t.flex, t.flexRow, t.itemsCenter, t.mB5]}>
            <View
              style={[
                t.roundedFull,
                t.bgMuted,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.h12,
                t.w12,
                t.mR3,
              ]}
            >
              <Octicons name="id-badge" size={24} style={[t.texts.primary]} />
            </View>
            <Text style={[t.textLg, t.texts.primary, t.fontMedium]}>
              Your public profile
            </Text>
          </View>
          <Well
            style={[t.flex, t.flexRow, t.bgDefault, t.wFull, t.roundedLg, t.p4]}
          >
            <Text style={[t.wFull, t.texts.primary, t.textBase]}>
              <Text style={[t.texts.primary, t.fontSemibold]}>
                {signatureParams.domain}{' '}
              </Text>
              <Text style={[t.texts.secondary]}>
                will not be able to post on your behalf or edit your information
              </Text>
            </Text>
          </Well>
        </View>
      </View>
      <View style={[t.flexNone, t.p4]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <View style={[t.flex1, t.mR3]}>
            <AtomsButton hierarchy="tertiary" size="l" onPress={pop}>
              Cancel
            </AtomsButton>
          </View>
          <View style={[t.flex1]}>
            <AtomsButton
              hierarchy="primary"
              size="l"
              onPress={submit}
              disabled={submitting}
            >
              Sign in
            </AtomsButton>
          </View>
        </View>
        <Text style={[t.texts.secondary, t.mT3, t.textCenter]}>
          If you don’t recognize this, you can cancel it safely
        </Text>
      </View>
    </View>
  );
}

function MalformedUri() {
  const t = useTheme();
  const pop = usePop();

  return (
    <View style={[t.hFull, t.p4, t.flex]}>
      <View style={[t.flexGrow, t.justifyCenter, t.itemsCenter]}>
        <Text style={[t.textLg, t.texts.primary]}>Malformed sign in URI</Text>
      </View>
      <View style={[t.flexNone, t.flex, t.flexCol]}>
        <AtomsButton hierarchy="primary" size="l" onPress={pop}>
          Return to Farcaster
        </AtomsButton>
      </View>
    </View>
  );
}

function RelayUnavailable({ retry }: { retry: () => void }) {
  const t = useTheme();
  const pop = usePop();

  return (
    <View style={[t.hFull, t.p4, t.flex]}>
      <View style={[t.flexGrow, t.justifyCenter, t.itemsCenter]}>
        <Text style={[t.textLg, t.texts.primary]}>
          Sign in with Farcaster is unavailable.
        </Text>
      </View>
      <View style={[t.flexNone, t.p4]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <View style={[t.flex1, t.mR3]}>
            <AtomsButton hierarchy="tertiary" size="l" onPress={pop}>
              Cancel
            </AtomsButton>
          </View>
          <View style={[t.flex1]}>
            <AtomsButton hierarchy="primary" size="l" onPress={retry}>
              Try again
            </AtomsButton>
          </View>
        </View>
      </View>
    </View>
  );
}

SignInWithFarcasterScreen.displayName = 'SignInWithFarcasterScreen';

export { SignInWithFarcasterScreen };
