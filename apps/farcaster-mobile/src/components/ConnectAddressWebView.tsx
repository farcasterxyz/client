import { AnalyticsEvent } from 'farcaster-analytics';
import {
  UnrecognizedWebViewMessageError,
  useInvalidateVerifications,
  WebViewMessageParsingError,
} from 'farcaster-client-hooks';
import React, { FC, memo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useComposeVerificationUrl } from '~/hooks/useComposeVerificationUrl';
import { trackError } from '~/utils/ErrorUtils';

import { FullScreenLoadingIndicator } from './FullScreenLoadingIndicator';

type ConnectAddressWebViewProps = {
  onVerifiedAddress?: (data: VerifiedAddressData) => void;
  onMessageSigningStarted?: () => void;
  onMessageSigningFailed?: () => void;
  // Tried to only call this in onboarding and not inject.
  // Unfortunately the WebView full height caused some trouble and
  // had to resort to this.
  OnboardingFooterComponent?: React.ReactNode;
};

const ConnectAddressWebView: FC<ConnectAddressWebViewProps> = memo(
  ({
    onVerifiedAddress,
    onMessageSigningStarted,
    onMessageSigningFailed,
    OnboardingFooterComponent,
  }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const currentUser = useCurrentUser_UNSAFE();
    const invalidateVerifications = useInvalidateVerifications();
    const composeVerificationUrl = useComposeVerificationUrl();

    const [verificationUrl, setVerificationUrl] = React.useState<string>();
    const opacity = useRef(new Animated.Value(0)).current;
    const hasStartedAnimatingInRef = useRef(false);
    const [hasFinishedAnimatingIn, setHasFinishedAnimatingIn] = useState(false);

    React.useEffect(() => {
      const init = async () => {
        setVerificationUrl(await composeVerificationUrl());
      };

      if (typeof verificationUrl === 'undefined') {
        init();
      }
    }, [composeVerificationUrl, verificationUrl]);

    return (
      <>
        {!hasFinishedAnimatingIn && (
          <View style={[t.hFull, t.wFull, t.absolute]}>
            <FullScreenLoadingIndicator debugName="ConnectAddressWebView" />
          </View>
        )}
        {verificationUrl && (
          <Animated.View style={[t.hFull, t.pT2, t.bgDefault, { opacity }]}>
            <WebView
              style={[t.dark ? t.bgDefault : t.bgDefault]}
              bounces={false}
              onNavigationStateChange={(e) => {
                if (!e.loading && !hasStartedAnimatingInRef.current) {
                  hasStartedAnimatingInRef.current = true;
                  Animated.timing(opacity, {
                    toValue: 1,
                    duration: 50,
                    useNativeDriver: true,
                  }).start(() => {
                    setHasFinishedAnimatingIn(true);
                  });
                }
              }}
              source={{
                uri: verificationUrl,
                // uri: `https://inquisitive-cheesecake-a83a23.netlify.app/sign/${address}`,
                // uri: 'https://funny-bombolone-7101cc.netlify.app',
              }}
              onMessage={(event) => {
                try {
                  const message: ConnectAddressWebViewMessage = JSON.parse(
                    event.nativeEvent.data,
                  );

                  if (!message) {
                    return;
                  }

                  switch (message.type) {
                    case 'address_connected':
                      trackEvent(AnalyticsEvent.FinishAddressVerification, {});
                      invalidateVerifications({ fid: currentUser.fid });
                      if (onVerifiedAddress) {
                        onVerifiedAddress(message.data);
                      }
                      return;
                    case 'message_signing_started':
                      if (onMessageSigningStarted) {
                        onMessageSigningStarted();
                      }
                      return;
                    case 'message_signing_failed':
                      if (onMessageSigningFailed) {
                        onMessageSigningFailed();
                      }
                      return;
                    default:
                      trackError(
                        new UnrecognizedWebViewMessageError({
                          messageData: event.nativeEvent.data,
                        }),
                      );
                  }
                } catch (error) {
                  trackError(
                    new WebViewMessageParsingError({
                      messageData: event.nativeEvent.data,
                      error,
                    }),
                  );
                }
              }}
            />
            {typeof OnboardingFooterComponent !== 'undefined' &&
              OnboardingFooterComponent}
          </Animated.View>
        )}
      </>
    );
  },
);

type VerifiedAddressData = {
  verifiedAddress: {
    signedMessage: string;
    originalMessage: string;
    signerAddress: string;
    farcasterAddress: string;
  };
};

// https://github.com/merkle-manufactory/explorer/pull/133
type VerifiedAddressMessage = {
  type: 'address_connected';
  data: VerifiedAddressData;
};

// https://github.com/merkle-manufactory/explorer/pull/148
type MessageSigningStartedMessage = {
  type: 'message_signing_started';
};

// https://github.com/merkle-manufactory/explorer/pull/148
type MessageSigningFailedMessage = {
  type: 'message_signing_failed';
};

type ConnectAddressWebViewMessage =
  | null
  | VerifiedAddressMessage
  | MessageSigningStartedMessage
  | MessageSigningFailedMessage;

export { ConnectAddressWebView };
