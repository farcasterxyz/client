import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiAccountHumanVerificationType } from 'farcaster-client-data';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type DebugVerificationRemovalScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugVerificationRemoval'
>;

const DebugVerificationRemovalScreen =
  buildScreen<DebugVerificationRemovalScreenProps>(
    { name: 'DebugVerificationRemoval' },
    () => {
      const t = useTheme();
      const toast = useToast();
      const { apiClient } = useFarcasterApiClient();
      const [fid, setFid] = useState('');
      const [isLoading, setIsLoading] =
        useState<ApiAccountHumanVerificationType | null>(null);

      const isValidFid = /^\d+$/.test(fid) && parseInt(fid, 10) > 0;

      const handleRemoveVerification = useCallback(
        async (type: ApiAccountHumanVerificationType) => {
          if (!isValidFid) {
            Alert.alert(
              'Invalid FID',
              'Please enter a valid FID (positive number)',
            );
            return;
          }

          const numericFid = parseInt(fid, 10);
          setIsLoading(type);

          try {
            const { data } = await apiClient.deleteAccountVerification(
              {
                fid: numericFid,
                type,
              },
              {},
            );

            if (data.result.success) {
              toast.show(
                `Successfully removed ${type} verification for FID: ${numericFid}`,
                {
                  type: 'success',
                },
              );
            } else {
              toast.show(
                `Failed to remove ${type} verification for FID: ${numericFid}`,
                {
                  type: 'danger',
                },
              );
            }
          } catch (error) {
            toast.show(
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                type: 'danger',
              },
            );
          } finally {
            setIsLoading(null);
          }
        },
        [apiClient, fid, isValidFid, toast],
      );

      return (
        <View style={[t.hFull, t.p4, t.justifyStart]}>
          <Text2 weight="semibold" size="lg" style={[t.mB4]}>
            Remove Account Verification
          </Text2>

          <TextInput
            value={fid}
            onChangeText={setFid}
            keyboardType="numeric"
            placeholder="Enter FID"
            containerStyle={[t.mB6]}
            autoCapitalize="none"
            maxLength={20}
          />

          <View style={[t.flexCol, { gap: 12 }]}>
            <ButtonV2
              title="Remove X verification"
              onPress={() => handleRemoveVerification('connect-x')}
              width="full"
              variant="secondary"
              loading={isLoading === 'connect-x'}
              disabled={!isValidFid || isLoading !== null}
            />

            <ButtonV2
              title="Remove phone verification"
              onPress={() => handleRemoveVerification('phone')}
              width="full"
              variant="secondary"
              loading={isLoading === 'phone'}
              disabled={!isValidFid || isLoading !== null}
            />

            <ButtonV2
              title="Remove onchain balance verification"
              onPress={() => handleRemoveVerification('onchain-balance')}
              width="full"
              variant="secondary"
              loading={isLoading === 'onchain-balance'}
              disabled={!isValidFid || isLoading !== null}
            />
          </View>
        </View>
      );
    },
  );

DebugVerificationRemovalScreen.displayName = 'DebugVerificationRemovalScreen';

export { DebugVerificationRemovalScreen };
