import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { ApiTotpTokenContext } from 'farcaster-client-data';
import {
  useGenerateTotpToken,
  useSetGloballyCachedTotpToken,
  useVerifyTotpCode,
} from 'farcaster-client-hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Pressable,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePop } from '~/hooks/navigation/usePop';
import {
  RootNativeStackParamList,
  SecureModeCodeVerificationMode,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';

export const SecureModeVerifyCode = ({
  mode = 'verify',
  email,
  context,
  onSuccess,
  showKeyboardOnMount = true,
  isFirstTimeVerification = false,
}: {
  mode: SecureModeCodeVerificationMode;
  email?: string;
  context?: ApiTotpTokenContext;
  onSuccess: () => void;
  showKeyboardOnMount?: boolean;
  isFirstTimeVerification?: boolean;
}) => {
  const t = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const verifyCode = useVerifyTotpCode();
  const generateToken = useGenerateTotpToken();
  const [incorrectCode, setIncorrectCode] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<boolean>(false);
  const setGloballyCachedTotpToken = useSetGloballyCachedTotpToken();
  const { address: custodyAddress, account } = useWallet();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    if (showKeyboardOnMount) {
      // Show keyboard and focus first input on mount
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [showKeyboardOnMount]);

  useEffect(() => {
    const checkClipboard = async () => {
      const hasString = await Clipboard.hasStringAsync();
      if (hasString) {
        const content = await Clipboard.getStringAsync();
        if (content.length === 6 && /^\d+$/.test(content)) {
          setCode(content.split(''));
          inputRefs.current[5]?.focus();
          setIncorrectCode(false);
          setVerificationError(false);
          await Clipboard.setStringAsync('');
        }
      }
    };

    const interval = setInterval(checkClipboard, 1000);
    checkClipboard(); // Check immediately on mount

    return () => clearInterval(interval);
  }, []);

  const handleChangeText = (text: string, _index: number) => {
    setIncorrectCode(false);
    setVerificationError(false);
    if (code.every((digit) => digit !== '') && text.length < code.length) {
      return;
    }

    if (text.length === code.length && /^\d+$/.test(text)) {
      setCode(text.split(''));
      inputRefs.current[code.length - 1]?.focus();
      return;
    }

    if (text.length === code.length + 1 && /^\d+$/.test(text)) {
      setCode(text.slice(1).split(''));
      inputRefs.current[code.length - 1]?.focus();
      return;
    }

    // Handle single digit input - only accept digits
    if (text.length === 1 && /^[0-9]$/.test(text)) {
      const firstEmptyIndex = code.findIndex((digit) => digit === '');
      if (firstEmptyIndex !== -1) {
        const newCode = [...code];
        newCode[firstEmptyIndex] = text;
        setCode(newCode);

        // Focus next empty slot if available
        if (firstEmptyIndex < 5) {
          inputRefs.current[firstEmptyIndex + 1]?.focus();
        }
      }
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newCode = [...code];

      if (code[index]) {
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = () => {
    const firstEmptyIndex = code.findIndex((digit) => digit === '');
    if (firstEmptyIndex !== -1) {
      inputRefs.current[firstEmptyIndex]?.focus();
      return;
    }

    inputRefs.current[code.length - 1]?.focus();
  };

  const handleVerifyCode = async () => {
    try {
      if (mode === 'verify') {
        if (!custodyAddress) {
          throw new Error(
            'Custody address should be defined, this should never happen',
          );
        }
        const result = await verifyCode({
          code: code.join(''),
          email,
          firstTimeVerification: isFirstTimeVerification,
          stepUpParams: {
            account: account!,
          },
        });
        if (result) {
          onSuccess();
        } else {
          setIncorrectCode(true);
        }
      } else if (mode === 'generate-token') {
        if (!email || !context) {
          throw new Error('Email and context are required');
        }
        const token = await generateToken({
          code: code.join(''),
          email,
          context,
        });
        if (token) {
          setGloballyCachedTotpToken({
            context,
            token,
          });
          onSuccess();
        } else {
          setIncorrectCode(true);
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('invalid totp code')
      ) {
        setIncorrectCode(true);
      } else {
        setVerificationError(true);
        trackError(error);
      }
    }
  };

  return (
    <>
      <View style={[t.flex1, t.flexCol, { gap: 8 }]}>
        <Text2 weight="semibold" size="2xl">
          Enter the 6-digit code from your authenticator app
        </Text2>
        <Text2 size="base" color="secondary" weight="medium">
          This helps us keep your account secure by verifying that it's really
          you.
        </Text2>
        <View style={[t.flexRow, t.justifyCenter, { gap: 16, marginTop: 24 }]}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                t.h12,
                t.w12,
                t.textCenter,
                t.text2xl,
                t.fontSemibold,
                t.roundedLg,
                t.border,
                t.borderDefault,
                {
                  color:
                    incorrectCode || verificationError
                      ? t.colors.text.danger
                      : t.colors.text.primary,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={handleFocus}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          ))}
        </View>
        {(incorrectCode || verificationError) && (
          <View style={[t.flexRow, t.itemsCenter, t.pX2, t.pY3, { gap: 8 }]}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={t.colors.text.danger}
            />
            <Text2 size="base" color="danger" weight="medium">
              {verificationError
                ? 'Something went wrong. Please try again.'
                : 'That code is incorrect or expired. Please try again'}
            </Text2>
          </View>
        )}
      </View>
      <View style={[isKeyboardVisible && t.pB3]}>
        <ButtonV2
          variant="primary"
          title="Verify code"
          onPress={handleVerifyCode}
          disabled={
            code.some((digit) => !digit) ||
            (mode === 'verify' && custodyAddress === undefined)
          }
        />
      </View>
    </>
  );
};

type SecureModeVerifyCodeScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'SecureModeVerifyCode'
>;

const SecureModeVerifyCodeScreen = buildScreen<SecureModeVerifyCodeScreenProps>(
  { name: 'SecureModeVerifyCode' },
  ({ route: { params } }) => {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const pop = usePop();

    const handleCancel = () => {
      pop();
      params.onCancel?.();
    };

    const handleSuccess = () => {
      pop();
      params.onSuccess?.();
    };

    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={[t.flex1, { marginBottom: insets.bottom }]}
      >
        <View style={[t.flex1, { marginTop: insets.top }]}>
          <View style={[t.flexRow, t.justifyBetween]}>
            <View style={[t.flex1]} />
            <Pressable onPress={handleCancel} style={[t.p2]}>
              <Ionicons name="close" size={24} color={t.colors.text.primary} />
            </Pressable>
          </View>
          <View style={[t.flex1, t.pX4, t.pT3]}>
            <View style={[t.flex1, t.justifyBetween]}>
              <SecureModeVerifyCode
                mode={params.mode}
                email={params.email}
                context={params.context}
                onSuccess={handleSuccess}
                showKeyboardOnMount={true}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  },
);

SecureModeVerifyCodeScreen.displayName = 'SecureModeVerifyCodeScreen';

export { SecureModeVerifyCodeScreen };
