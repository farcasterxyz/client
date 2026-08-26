import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { NoConnectionIcon } from 'farcaster-expo';
import React from 'react';
import { Alert, Platform, Pressable } from 'react-native';

import {
  authTokenKey,
  mnemonicStorageKey,
  privateKeyV1StorageKey,
  privateKeyV2StorageKey,
} from '~/constants/Storage';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { trackError } from '~/utils/ErrorUtils';
import { deleteSecureItem, getSecureItem } from '~/utils/SecureStorageUtils';

type ErrorIconWithDebugActionsProps = {
  connectionError?: boolean;
  onReset: () => void;
};

const ErrorIconWithDebugActions: React.FC<ErrorIconWithDebugActionsProps> = ({
  connectionError,
  onReset,
}) => {
  const t = useTheme();

  const { address } = useWallet();
  const { signOut } = useAuthToken();

  const copyMnemonic = React.useCallback(() => {
    getSecureItem({ key: mnemonicStorageKey, fallback: '' })
      .then((mnemonic) => {
        if (mnemonic) {
          Clipboard.setStringAsync(mnemonic);
          Alert.alert('A mnemonic has been copied to your clipboard.');
        } else {
          Alert.alert(
            'Sadly we could not find a mneumonic in your keychain\n:(',
          );
        }
      })
      .catch((err) => {
        alert(`Error reading mnemonic: ${err.message}`);
      });
  }, []);

  const reset = React.useCallback(async () => {
    trackError(`User resetting manually. Address: ${address || '0x0'}`);

    if (address) {
      signOut({ reason: 'user_initiated' });
    } else {
      // Fallback to a case in which we are clearly not even able to clear wallet
      await deleteSecureItem(privateKeyV1StorageKey);
      await deleteSecureItem(privateKeyV2StorageKey);
      await deleteSecureItem(mnemonicStorageKey);
      await deleteSecureItem(authTokenKey);

      setTimeout(() => {
        onReset();
      }, 1000);
    }
  }, [address, onReset, signOut]);

  const onLongPress = React.useCallback(() => {
    // Alert.prompt is only available in iOS: so we will fallback to regular alert.
    if (Platform.OS === 'ios') {
      return Alert.prompt(
        'Debug Actions (Caution!)',
        'Type "reset" if you want to clear all local state and restart the app. (You will need your mnemonic to log back in. Type "copy_mnemonic" to copy your mnemonic to your clipboard.)',
        (value) => {
          switch (value.trim()) {
            case 'copy_mnemonic':
              copyMnemonic();
              break;
            case 'reset':
              reset();
              break;
            default:
              Alert.alert('Unrecognized command');
          }
        },
      );
    }

    return Alert.alert(
      'Debug Actions (Caution!)',
      'Use "Reset" if you want to clear all local state and restart the app. (You will need your mnemonic to log back in. Use "Copy Mnemonic" to copy your mnemonic to your clipboard.)',
      [
        {
          text: 'Reset',
          onPress: reset,
        },
        {
          text: 'Copy Mnemonic',
          onPress: copyMnemonic,
        },
      ],
    );
  }, [copyMnemonic, reset]);

  return (
    <Pressable onLongPress={onLongPress}>
      {connectionError ? (
        <NoConnectionIcon size={110} />
      ) : (
        <Ionicons
          name="alert-circle-outline"
          size={110}
          color={t.scheme === 'light' ? '#DDD4FF' : '#2F204A'}
        />
      )}
    </Pressable>
  );
};

export { ErrorIconWithDebugActions };
