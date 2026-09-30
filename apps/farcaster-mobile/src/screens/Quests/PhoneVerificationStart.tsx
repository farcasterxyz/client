import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getLocales } from 'expo-localization';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import { useStartPhoneVerification } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString as parsePhoneNumber,
} from 'libphonenumber-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { OnboardingFormField } from '~/components/OnboardingFormField';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type PhoneVerificationStartScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'PhoneVerificationStart'
>;

const allowedCountries = getCountries();

const PhoneVerificationStartScreen =
  buildScreen<PhoneVerificationStartScreenProps>(
    {
      avoidKeyboard: true,
      insetBottom: true,
      name: 'PhoneVerificationStart',
    },
    ({ route: { params } }) => {
      const { errorMessage, questId } = params;

      const t = useTheme();
      const { trackEvent } = useAnalytics();
      const navigate = useNavigate();
      const { account } = useWallet();
      const startPhoneVerification = useStartPhoneVerification();

      const [countryCode, setCountryCode] = useState(() => {
        const regionCode = getLocales()[0].regionCode;
        if (regionCode && isSupportedCountry(regionCode)) {
          return regionCode;
        }

        return 'US';
      });

      const [phone, setPhone] = useState('');
      const [submitting, setSubmitting] = useState<boolean>(false);
      const [error, setError] = useState<string | undefined>(errorMessage);

      useEffect(() => {
        trackEvent(AnalyticsEvent.UserPhoneVerificationStarted, {
          questId: questId ?? undefined,
        });
      }, [questId, trackEvent]);

      useFocusEffect(
        useCallback(() => {
          setError(errorMessage);
        }, [errorMessage, setError]),
      );

      const parsedPhone = useMemo(
        () => parsePhoneNumber(phone, countryCode),
        [phone, countryCode],
      );

      const countryCodeInputValue = `${countryCode} +${getCountryCallingCode(
        countryCode,
      )}`;

      const handleSubmit = async () => {
        try {
          setSubmitting(true);
          await startPhoneVerification({
            phone: parsedPhone!.number,
            account: account!,
          });
          navigate('PhoneVerificationCode', {
            phone: parsedPhone!.number,
            questId: questId ?? undefined,
          });
        } catch (e) {
          trackError(e);

          const apiError = getFirstApiErrorBody(e);
          if (apiError) {
            if (apiError.reason === 'max_phone_verification_attempts_reached') {
              setError('Max attempts reached, try again later');
            }

            if (
              apiError.reason === 'max_phone_verification_attempts_reached_30d'
            ) {
              setError('Max attempts reached, try again in 30 days');
            }
          }

          setError('Unable to start a phone verification, try again later');
        } finally {
          setPhone('');
          setSubmitting(false);
        }
      };

      return (
        <>
          <View style={[t.hFull, t.flex, t.pX4, t.pT3]}>
            <View style={[t.flex1]}>
              <View style={[t.flex, t.flexRow]}>
                <View style={[t.flexNone, t.mR2]}>
                  <Pressable
                    onPress={() => {
                      navigate('SelectCountry', {
                        onSelect: (code: string) => {
                          if (isSupportedCountry(code)) {
                            setCountryCode(code);
                          }
                        },
                        allowedCountyCodes: allowedCountries,
                      });
                    }}
                  >
                    <View pointerEvents="none">
                      <OnboardingFormField
                        label="Country"
                        value={countryCodeInputValue}
                        clearButtonMode="never"
                        readOnly
                      />
                    </View>
                  </Pressable>
                </View>
                <View style={[t.flex1]}>
                  <OnboardingFormField
                    autoFocus
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    label="Phone number"
                    onChangeText={(val) => setPhone(val.trim())}
                    value={phone}
                  />
                </View>
              </View>
              {error && (
                <Text style={[t.textBase, t.texts.danger, t.mT2]}>{error}</Text>
              )}
            </View>
            <View style={[t.flexNone]}>
              <View style={[t.wFull]}>
                <AtomsButton
                  size="l"
                  hierarchy="primary"
                  style={[t.mT4]}
                  onPress={handleSubmit}
                  disabled={submitting || !parsedPhone?.isValid()}
                >
                  Continue
                </AtomsButton>
              </View>
            </View>
          </View>
        </>
      );
    },
  );

export { PhoneVerificationStartScreen };
