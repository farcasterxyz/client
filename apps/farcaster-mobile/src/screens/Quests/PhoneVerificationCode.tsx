import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import {
  useCompletePhoneVerification,
  useStartPhoneVerification,
} from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import { parsePhoneNumber } from 'libphonenumber-js';
import { RefreshCcwIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type PhoneVerificationCodeScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'PhoneVerificationCode'
>;

const PhoneVerificationCodeScreen =
  buildScreen<PhoneVerificationCodeScreenProps>(
    {
      name: 'PhoneVerificationCode',
      insetBottom: true,
    },
    ({ route: { params } }) => {
      const { phone, questId } = params;

      const t = useTheme();
      const navigate = useNavigate();
      const { account } = useWallet();
      const startPhoneVerification = useStartPhoneVerification();
      const completePhoneVerification = useCompletePhoneVerification();
      const { trackEvent } = useAnalytics();
      const [code, setCode] = useState('');
      const [error, setError] = useState<string | undefined>();
      const [canResend, setCanResend] = useState(true);
      const [resendAttempt, setResendAttempt] = useState(1);

      useEffect(() => {
        const timer = setTimeout(
          () => {
            setCanResend(true);
          },
          2 ** resendAttempt * 1000 + 5000,
        );

        return () => clearTimeout(timer);
      }, [resendAttempt, setCanResend]);

      const handleCodeChange = useCallback(
        async (code: string) => {
          setCode(code);

          if (code.length === 6) {
            try {
              setError(undefined);

              await completePhoneVerification({
                phone,
                code,
                account: account!,
              }).then(() => {
                trackEvent(AnalyticsEvent.UserPhoneVerificationCompleted, {
                  questId,
                });
              });
            } catch (e) {
              setCode('');
              trackError(e);
              trackEvent(AnalyticsEvent.UserPhoneVerificationFailed, {
                questId,
              });

              const apiError = getFirstApiErrorBody(e);
              if (apiError) {
                if (apiError.reason === 'number_already_claimed') {
                  navigate('PhoneVerificationStart', {
                    errorMessage: 'Phone number is already claimed',
                    questId,
                  });
                  return;
                }

                if (apiError.reason === 'invalid_verification_code') {
                  setError('Verification failed');
                  return;
                }

                if (
                  apiError.reason === 'max_phone_verification_attempts_reached'
                ) {
                  setError('Max attempts reached, try again later');
                  return;
                }

                if (
                  apiError.reason ===
                  'max_phone_verification_attempts_reached_30d'
                ) {
                  setError('Max attempts reached, try again in 30 days');
                  return;
                }

                if (apiError.reason === 'no_verification_initiated') {
                  navigate('PhoneVerificationStart', {
                    errorMessage: 'Verification expired',
                    questId,
                  });
                  return;
                }
              }

              setError('Unable to verify code');
            }
          }
        },
        [
          completePhoneVerification,
          navigate,
          phone,
          questId,
          account,
          trackEvent,
        ],
      );

      const handleResendCode = async () => {
        try {
          await startPhoneVerification({
            phone,
            account: account!,
          });
          setCanResend(false);
          setResendAttempt(resendAttempt + 1);
        } catch (e) {
          trackError(e);
          setError('Unable to re-send code');
        }
      };

      return (
        <>
          <View style={[t.hFull, t.justifyBetween, t.pX4, t.pB3]}>
            <View style={[t.justifyStart, t.itemsCenter, t.flexGrow]}>
              <View style={[t.wFull]}>
                <Text style={[t.mY3, t.texts.secondary]}>
                  Enter code sent to {parsePhoneNumber(phone).formatNational()}
                </Text>
                <CodeInput
                  codeLength={6}
                  onChange={handleCodeChange}
                  value={code}
                  autoFocus
                />
                {error && (
                  <Text style={[t.textBase, t.texts.danger, t.mT2]}>
                    {error}
                  </Text>
                )}
              </View>
            </View>
            <View style={[t.flexNone]}>
              <AtomsButton
                Icon={({ size, color }) => (
                  <RefreshCcwIcon size={size} color={color} />
                )}
                hierarchy="translucent"
                size="l"
                disabled={!canResend}
                onPress={handleResendCode}
              >
                Resend code
              </AtomsButton>
            </View>
          </View>
        </>
      );
    },
  );

function CodeInput({
  codeLength,
  value,
  onChange,
  autoFocus,
}: {
  codeLength: number;
  value: string;
  onChange: (code: string) => void | Promise<void>;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  const ref = useRef<TextInput>(null);

  const [containerIsFocused, setContainerIsFocused] = useState(false);

  const codeDigitsArray = Array.from(new Array(codeLength));

  const handleOnPress = () => {
    setContainerIsFocused(true);
    ref?.current?.focus();
  };

  const handleOnBlur = () => {
    setContainerIsFocused(false);
  };

  const toDigitInput = (_value: string, idx: number) => {
    const emptyInputChar = ' ';
    const digit = value[idx] || emptyInputChar;

    const isCurrentDigit = idx === value.length;
    const isLastDigit = idx === codeLength - 1;
    const isCodeFull = value.length === codeLength;

    const isFocused = isCurrentDigit || (isLastDigit && isCodeFull);

    const containerStyle = [
      t.pX2,
      t.pY3,
      t.bgMuted,
      t.roundedLg,
      t.texts.primary,
      ...(containerIsFocused && isFocused ? [t.border, t.borderMuted] : []),
    ];

    return (
      <View key={idx} style={containerStyle}>
        <Text style={[t.textLg, t.fontBold, t.w6, t.textCenter]}>{digit}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView>
      <Pressable style={[t.flexRow, t.justifyBetween]} onPress={handleOnPress}>
        {codeDigitsArray.map(toDigitInput)}
      </Pressable>
      <TextInput
        ref={ref}
        value={value}
        onFocus={() => setContainerIsFocused(true)}
        onChangeText={(v) => onChange(v.substring(0, codeLength))}
        onSubmitEditing={handleOnBlur}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoFocus={autoFocus}
        maxLength={codeLength}
        style={[t.absolute, t.inset0, t.opacity0]}
      />
    </SafeAreaView>
  );
}

export { PhoneVerificationCodeScreen };
