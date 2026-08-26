import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  deleteStoredPasskey,
  getStoredPasskeys,
  isPasskeysSupported,
  StoredPasskey,
} from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { deleteSecureItem } from '~/utils/SecureStorageUtils';

type AdvancedPasskeysScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'AdvancedPasskeys'
>;

const AdvancedPasskeysScreen = buildScreen<AdvancedPasskeysScreenProps>(
  { name: 'AdvancedPasskeys' },
  () => {
    const t = useTheme();
    const toast = useToast();
    const { keyStore } = useFarcasterCryptographyKeyStore();
    const [alreadyRegisteredPasskeys, setAlreadyRegisteredPasskeys] = useState<
      StoredPasskey[]
    >([]);
    const [canRegisterPasskey, setCanRegisterPasskey] = useState<boolean>();

    useEffect(() => {
      isPasskeysSupported({ keyStore })
        .then(async (supported) => {
          if (supported) {
            const keys = await getStoredPasskeys({ keyStore });
            setAlreadyRegisteredPasskeys(keys);
            setCanRegisterPasskey(true);
          } else {
            setCanRegisterPasskey(false);
          }
        })
        .catch(trackError);
    }, [alreadyRegisteredPasskeys.length, canRegisterPasskey, keyStore]);

    if (!canRegisterPasskey) {
      return (
        <View style={[t.hFull, t.justifyBetween]}>
          <Text>Passkeys are not supported on this device.</Text>
        </View>
      );
    }

    const renderItem = ({ item }: { item: StoredPasskey }) => {
      return (
        <View
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.pY4,
            t.pX6,
            t.borderB,
            t.borderDefault,
          ]}
        >
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.wFull,
            ]}
          >
            <View style={[t.flex1, t.flexCol, t.justifyCenter, t.pR4]}>
              <Text style={[t.texts.primary, t.fontSemibold]}>
                {item.username}
              </Text>
              {/*
                Passkeys created before dual-domain support (pre-May 2025) have
                no stored `domain`. Auth treats those as warpcast.com (see the
                `?? 'warpcast.com'` fallback in farcaster-cryptography Methods),
                so we display the same here to reflect the RP they authenticate
                against rather than showing a blank line.
              */}
              <Text style={[t.pT1, t.texts.secondary, t.textXs]}>
                {item.domain ?? 'warpcast.com'}
              </Text>
            </View>
            <AtomsButton
              hierarchy="danger"
              size="m"
              onPress={async () => {
                Alert.alert(
                  'Delete passkey?',
                  'Are you sure you want to delete this passkey? This action is irreversible.',
                  [
                    {
                      text: 'Cancel',
                      onPress: () => {},
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      onPress: () => {
                        deleteStoredPasskey({
                          keyStore,
                          credentialId: item.credentialId,
                        })
                          .then(async () => {
                            const keys = await getStoredPasskeys({ keyStore });
                            setAlreadyRegisteredPasskeys(keys);
                            deleteSecureItem('user-dismissed-passkeys');
                            toast.show('Passkey deleted');
                          })
                          .catch(trackError);
                      },
                    },
                  ],
                );
              }}
            >
              Delete
            </AtomsButton>
          </View>
        </View>
      );
    };

    return (
      <View style={[t.hFull, t.justifyBetween]}>
        <FlashList
          data={alreadyRegisteredPasskeys}
          keyExtractor={(item) => item.credentialId}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

AdvancedPasskeysScreen.displayName = 'AdvancedPasskeysScreen';

export { AdvancedPasskeysScreen };
