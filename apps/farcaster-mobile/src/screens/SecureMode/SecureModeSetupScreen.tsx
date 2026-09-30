import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getNotionLinkTarget,
  useCreateTotpSecret,
} from 'farcaster-client-hooks';
import { useRequireBiometricAuth } from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonV2 } from '~/components/ButtonV2';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { RootNativeStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

import { SecureModeVerifyCode } from './SecureModeVerifyCodeScreen';
import { SecurityModeIcon } from './SecurityModeIcon';

type SecureModeSetupScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'SecureModeSetup'
>;

type SecureModeSetupStep = 'setup-code' | 'verify-code' | 'enabled';

const handleLearnMore = () => {
  openBrowserAsync(getNotionLinkTarget({ to: 'advanced-protection' }));
};

const SecureModeSetupCode = ({ onContinue }: { onContinue: () => void }) => {
  const t = useTheme();
  const [enabled, setEnabled] = useState(false);
  const { data, error, isPending } = useCreateTotpSecret();
  const [secretKey, setSecretKey] = useState('');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.otpauthUrl) {
      const url = new URL(data.otpauthUrl);
      setSecretKey(url.searchParams.get('secret') || '');
      setUrl(data.otpauthUrl);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      trackError(error);
    }
  }, [error]);

  const handleCopyKey = useCallback(async () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
    try {
      await Clipboard.setStringAsync(secretKey);
      setEnabled(true);
    } catch (error) {
      trackError(error);
    }
  }, [secretKey]);

  const handleDeepLinkToAuthenticator = useCallback(async () => {
    try {
      await Linking.openURL(url);
      setEnabled(true);
    } catch (error) {
      trackError(error);
    }
  }, [url]);

  const renderAuthenticatorDetail = () => {
    if (error) {
      return (
        <View style={[t.flex1, t.justifyCenter]}>
          <Text2 size="base" color="danger" align="center">
            Failed to generate secret. Please try again later.
          </Text2>
        </View>
      );
    }

    if (isPending || !url) {
      return (
        <View style={[t.flex1, t.justifyCenter]}>
          <LoadingIndicator size="small" />
        </View>
      );
    }

    let prompt = 'Copy and paste the setup key to your authenticator app.';
    if (Platform.OS === 'android') {
      prompt += ' Long press to open default authenticator app.';
    }

    return (
      <View style={[t.flexCol, { gap: 4 }]}>
        <Text2 size="base" weight="medium" color="primary">
          Add your key to your authenticator app
        </Text2>
        <View style={[t.flexCol, { gap: 8, height: 140 }]}>
          <Text2 size="base" color="secondary">
            {prompt}
          </Text2>
          <ButtonV2
            haptics={true}
            variant="secondary"
            title={secretKey}
            onPress={handleCopyKey}
            onLongPress={
              Platform.OS === 'android'
                ? handleDeepLinkToAuthenticator
                : undefined
            }
            longPressDelay={1000}
            IconRight={() => (
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={24}
                color={t.colors.text.brand}
              />
            )}
          />
        </View>
      </View>
    );
  };

  const biometricAuthPromise = useRequireBiometricAuth();
  const onEnterCode = useCallback(async () => {
    await biometricAuthPromise;
    onContinue();
  }, [biometricAuthPromise, onContinue]);

  return (
    <>
      <View style={[t.flex1, t.flexCol, { gap: 8 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <SecurityModeIcon variant="plain" size={42} noBadge />
          <Text2 weight="semibold" size="2xl">
            Set up Advanced Protection
          </Text2>
        </View>
        <Text2 size="base" color="secondary">
          Add an extra layer of security with stronger authentication for
          account recovery and web logins.
        </Text2>
        <View style={[t.flexCol, t.pT6, { gap: 24 }]}>
          {renderAuthenticatorDetail()}
        </View>
      </View>
      <>
        <ButtonV2 variant="link" title="Learn More" onPress={handleLearnMore} />
        <ButtonV2
          variant="primary"
          title="Enter Code"
          onPress={onEnterCode}
          disabled={!enabled || !url || isPending}
        />
      </>
    </>
  );
};

const SecureModeVerifyCodeStep = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  return (
    <SecureModeVerifyCode
      onSuccess={onContinue}
      showKeyboardOnMount={true}
      isFirstTimeVerification={true}
      mode="verify"
    />
  );
};

const SecureModeEnabled = ({ onDone }: { onDone: () => void }) => {
  const t = useTheme();

  return (
    <>
      <View style={[t.flex1, t.flexCol, { gap: 8 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <SecurityModeIcon variant="checkmark" size={42} noBadge />
          <Text2 weight="semibold" size="2xl">
            Advanced Protection enabled
          </Text2>
        </View>
        <Text2 size="base" color="secondary">
          You'll now use a code from your authenticator app for key actions like
          recovery or email changes.
        </Text2>
      </View>
      <ButtonV2 variant="primary" title="Done" onPress={onDone} />
    </>
  );
};

const SecureModeSetupScreen = buildScreen<SecureModeSetupScreenProps>(
  { name: 'SecureModeSetup' },
  ({ route: { params } }) => {
    const t = useTheme();
    const goBack = usePop();
    const insets = useSafeAreaInsets();
    const { trackEvent } = useAnalytics();
    const [step, setStep] = useState<SecureModeSetupStep>('setup-code');

    const handleClose = useCallback(() => {
      if (step === 'enabled') {
        params.onComplete?.();
      }
      goBack();
    }, [goBack, params, step]);

    const handleBack = useCallback(() => {
      setStep('setup-code');
    }, []);

    const handleContinue = useCallback(() => {
      if (step === 'setup-code') {
        setStep('verify-code');
      } else if (step === 'verify-code') {
        setStep('enabled');
      }
    }, [step]);

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.ViewSetupAdvancedProtection, {
          source: params.source,
          step,
        });
      }, [trackEvent, params.source, step]),
    );

    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={[t.flex1, { marginBottom: insets.bottom }]}
      >
        <View style={[t.flex1, { marginTop: insets.top }]}>
          <View style={[t.flexRow, t.justifyBetween]}>
            {step === 'verify-code' && (
              <Pressable onPress={handleBack} style={[t.p2]}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={t.colors.text.primary}
                />
              </Pressable>
            )}
            <View style={[t.flex1]} />
            <Pressable onPress={handleClose} style={[t.p2]}>
              <Ionicons name="close" size={24} color={t.colors.text.primary} />
            </Pressable>
          </View>
          <View style={[t.flex1, t.pX4, t.pT3]}>
            <View style={[t.flex1, t.justifyBetween]}>
              {step === 'setup-code' && (
                <SecureModeSetupCode onContinue={handleContinue} />
              )}
              {step === 'verify-code' && (
                <SecureModeVerifyCodeStep onContinue={handleContinue} />
              )}
              {step === 'enabled' && <SecureModeEnabled onDone={handleClose} />}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  },
);

SecureModeSetupScreen.displayName = 'SecureModeSetupScreen';

export { SecureModeSetupScreen };
