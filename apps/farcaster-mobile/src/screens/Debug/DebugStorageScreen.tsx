import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyValuePair } from '@react-native-async-storage/async-storage/lib/typescript/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { isDev } from '~/constants/Env';
import { _storageKeys } from '~/constants/Storage';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { getAllImageLogs, setDebugAppLoad } from '~/utils/FastStorageUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import { deleteSecureItem, getSecureItem } from '~/utils/SecureStorageUtils';
import { storageBenchmarks } from '~/utils/StorageBenchmarkUtils';
import { getItem } from '~/utils/StorageUtils';

type DebugStorageScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugStorage'
>;

const DebugStorageScreen = buildScreen<DebugStorageScreenProps>(
  { name: 'DebugStorage' },
  () => {
    const t = useTheme();
    const toast = useToast();

    const [asyncStoragePairs, setAsyncStoragePairs] =
      React.useState<readonly KeyValuePair[]>();
    const [fetchingAsyncStorage, setFetchingAsyncStorage] =
      React.useState<boolean>(false);

    const toastError = React.useCallback(
      (message: string) => {
        toast.show(message, {
          type: 'danger',
        });
      },
      [toast],
    );

    const toastSuccess = React.useCallback((message: string) => {
      Alert.alert(message);
    }, []);

    const copyAllImageLogs = () => {
      const text = getAllImageLogs();

      Clipboard.setStringAsync(JSON.stringify(text));

      Alert.alert(
        'Copied to clipboard - paste and share with the team for debugging',
      );
    };

    const updateAsyncStoragePairs = React.useCallback(async () => {
      setFetchingAsyncStorage(true);

      return await AsyncStorage.getAllKeys(async (err, keys) => {
        if (err) {
          logErrorInDevOnly(err);
          toastError('Error retrieving AsyncStorage keys');
        } else {
          const result: KeyValuePair[] = [];

          for (const key of keys!) {
            const item = await getItem<KeyValuePair | undefined>({
              key,
              fallback: undefined,
            });

            if (item) {
              result.push(item);
            }
          }

          return await AsyncStorage.multiGet(keys!, (err, result) => {
            if (err) {
              logErrorInDevOnly(err);
              toastError('Error retrieving AsyncStorage values');
            } else {
              setAsyncStoragePairs(result);
            }
          }).finally(() => {
            setFetchingAsyncStorage(false);
          });
        }
      });
    }, [toastError]);

    const headingStyle = [
      t.texts.primary,
      t.textBase,
      t.fontSemibold,
      t.mB2,
      t.textCenter,
    ];

    const codeStyle = [
      t.texts.primary,
      t.textXs,
      t.fontMono,
      t.textCenter,
      t.flexRow,
    ];
    const keyStyle = [...codeStyle, t.fontBold, t.mB1];
    const valueStyle = [...codeStyle, t.mB4];

    return (
      <ScrollView
        keyboardShouldPersistTaps="always"
        style={[t.hFull]}
        contentContainerStyle={[t.p4]}
      >
        <AtomsButton
          size="s"
          hierarchy="primary"
          style={[t.mY4]}
          onPress={() => {
            setDebugAppLoad({ enabled: true });
          }}
        >
          Turn on special app loading
        </AtomsButton>
        <AtomsButton
          size="s"
          hierarchy="primary"
          style={[t.mY4]}
          onPress={() => {
            setDebugAppLoad({ enabled: false });
          }}
        >
          Turn off special app loading
        </AtomsButton>
        <AtomsButton
          size="s"
          hierarchy="primary"
          onPress={copyAllImageLogs}
          style={[t.mY4]}
        >
          Copy all image logs to clipboard
        </AtomsButton>
        <Text style={headingStyle}>Async Storage Keys</Text>
        {typeof asyncStoragePairs !== 'undefined' &&
        asyncStoragePairs.length > 0 ? (
          asyncStoragePairs.map(([key, value]) => (
            <View key={key}>
              <Text style={keyStyle}>{key}</Text>
              <Pressable
                onLongPress={() => {
                  Clipboard.setStringAsync(value || '');
                  toast.show('Copied value to clipboard');
                }}
              >
                <Text style={valueStyle} numberOfLines={3}>
                  / Get value on long press /
                </Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={codeStyle}>[no keys found]</Text>
        )}

        <AtomsButton
          size="s"
          hierarchy="primary"
          style={[t.mY4]}
          loading={fetchingAsyncStorage}
          onPress={async () => {
            await updateAsyncStoragePairs();
          }}
        >
          Fetch AsyncStorage
        </AtomsButton>
        <AtomsButton
          size="s"
          hierarchy="danger"
          style={[t.mY4]}
          onPress={() => {
            AsyncStorage.clear();
            toast.show('Cleared AsyncStorage keys');
            updateAsyncStoragePairs();
          }}
        >
          Clear AsyncStorage
        </AtomsButton>

        {isDev && (
          <>
            <Divider />
            <Text style={headingStyle}>Secure Storage</Text>
            <AtomsButton
              size="s"
              style={[t.mB2]}
              onPress={() => {
                getSecureItem({
                  key: _storageKeys.development.privateKeyV1,
                  fallback: '',
                })
                  .catch(() => {
                    toastError('Error retrieving private key v1');
                  })
                  .then((result) => {
                    toastSuccess(result || '');
                  });
              }}
            >
              Show Private Key V1 Dev
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB6]}
              onPress={() => {
                deleteSecureItem(_storageKeys.development.privateKeyV1)
                  .catch(() => {
                    toastError(
                      'Error clearing private key v1 for development.',
                    );
                  })
                  .then(() => {
                    toastSuccess('Cleared private key v1 for development.');
                  });
              }}
            >
              Clear Private Key V1 Dev
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB2]}
              onPress={() => {
                getSecureItem({
                  key: _storageKeys.production.privateKeyV1,
                  fallback: '',
                })
                  .catch(() => {
                    toastError('Error retrieving private key v1');
                  })
                  .then((result) => {
                    toastSuccess(result || '');
                  });
              }}
            >
              Show Private Key V1 Prod
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB6]}
              onPress={() => {
                deleteSecureItem(_storageKeys.production.privateKeyV1)
                  .catch(() => {
                    toastError('Error clearing private key v1 for production.');
                  })
                  .then(() => {
                    toastSuccess('Cleared private key v1 for production.');
                  });
              }}
            >
              Clear Private Key V1 Prod
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB2]}
              onPress={() => {
                getSecureItem({
                  key: _storageKeys.development.privateKeyV2,
                  fallback: '',
                })
                  .catch(() => {
                    toastError('Error retrieving private key v2');
                  })
                  .then((result) => {
                    toastSuccess(result || '');
                  });
              }}
            >
              Show Private Key V2 Dev
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB6]}
              onPress={() => {
                deleteSecureItem(_storageKeys.development.privateKeyV2)
                  .catch(() => {
                    toastError(
                      'Error clearing private key v2 for development.',
                    );
                  })
                  .then(() => {
                    toastSuccess('Cleared private key v2 for development.');
                  });
              }}
            >
              Clear Private Key V2 Dev
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB2]}
              onPress={() => {
                getSecureItem({
                  key: _storageKeys.production.privateKeyV2,
                  fallback: '',
                })
                  .catch(() => {
                    toastError('Error retrieving private key v2');
                  })
                  .then((result) => {
                    toastSuccess(result || '');
                  });
              }}
            >
              Show Private Key V2 Prod
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB6]}
              onPress={() => {
                deleteSecureItem(_storageKeys.production.privateKeyV2)
                  .catch(() => {
                    toastError('Error clearing private key v2 for production.');
                  })
                  .then(() => {
                    toastSuccess('Cleared private key v2 for production.');
                  });
              }}
            >
              Clear Private Key V2 Prod
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB2]}
              onPress={() => {
                getSecureItem({
                  key: _storageKeys.development.mnemonic,
                  fallback: '',
                })
                  .catch(() => {
                    toastError('Error retrieving mnemonic');
                  })
                  .then((result) => {
                    toastSuccess(result || '');
                  });
              }}
            >
              Show Mnemonic Dev
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB6]}
              onPress={() => {
                deleteSecureItem(_storageKeys.development.mnemonic)
                  .catch(() => {
                    toastError('Error clearing mnemonic for development.');
                  })
                  .then(() => {
                    toastSuccess('Cleared mnemonic for development.');
                  });
              }}
            >
              Clear Mnemonic Dev
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB2]}
              onPress={() => {
                getSecureItem({
                  key: _storageKeys.production.mnemonic,
                  fallback: '',
                })
                  .catch(() => {
                    toastError('Error retrieving mnemonic');
                  })
                  .then((result) => {
                    toastSuccess(result || '');
                  });
              }}
            >
              Show Mnemonic Prod
            </AtomsButton>
            <AtomsButton
              size="s"
              style={[t.mB6]}
              onPress={() => {
                deleteSecureItem(_storageKeys.production.mnemonic)
                  .catch(() => {
                    toastError('Error clearing mnemonic for production.');
                  })
                  .then(() => {
                    toastSuccess('Cleared mnemonic for production.');
                  });
              }}
            >
              Clear Mnemonic Prod
            </AtomsButton>
          </>
        )}
        <Divider />
        <Text style={headingStyle}>Benchmarks</Text>
        <>
          {storageBenchmarks.map((entry, index) => (
            <Text key={index} style={[t.texts.primary, t.textXs]}>
              <Text style={[t.texts.primary, t.fontBold]}>
                {entry.type} {entry.key || entry.keys?.join(',') || ''}:
              </Text>{' '}
              {entry.duration}ms
            </Text>
          ))}
        </>
      </ScrollView>
    );
  },
);

DebugStorageScreen.displayName = 'DebugStorageScreen';

export { DebugStorageScreen };
