import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getFirstApiErrorBody,
  getUnknownErrorMessage,
} from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useRecoveryAddress,
  useUpdateRecoveryAddress,
} from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Linking, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { isAddress } from 'viem';

import {
  EditableFormField,
  EditableFormFieldLabel,
} from '~/components/EditableFormField';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { Link } from '~/components/Link';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { normalizeAddress } from '~/utils/RecoveryTelemetry';

type EditRecoveryAddressProps = NativeStackScreenProps<
  CommonStackParamList,
  'EditRecoveryAddress'
>;

function EditRecoveryAddress({ route }: EditRecoveryAddressProps) {
  const t = useTheme();
  const { setOptions } = useNavigation();
  const { trackEvent } = useAnalytics();
  const push = usePush();
  const toast = useToast();
  const updateRecoveryAddress = useUpdateRecoveryAddress();
  const { data } = useRecoveryAddress();
  const { account } = useWallet();

  const [newAddress, setNewAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { params } = route;
  const { recoveryAddress } = data!.result;

  // Emit edit-screen-shown once per mount with the relevant state for cohort
  // splitting (can_change, is_warpcast_recovery, pending flow already in flight).
  const editShownRef = useRef(false);
  useEffect(() => {
    if (editShownRef.current) return;
    editShownRef.current = true;
    trackEvent(AnalyticsOnlyEvent.RecoveryAddressEditScreenShown, {
      is_warpcast_recovery: !!recoveryAddress.isWarpcastRecoveryAddress,
      can_change: !!recoveryAddress.canChange,
      pending_change_id: recoveryAddress.pendingChangeId ?? null,
    });
  }, [
    recoveryAddress.canChange,
    recoveryAddress.isWarpcastRecoveryAddress,
    recoveryAddress.pendingChangeId,
    trackEvent,
  ]);

  const canSubmit = useMemo(() => {
    try {
      return isAddress(newAddress);
    } catch {
      return false;
    }
  }, [newAddress]);

  const changeAddress = useCallback(async () => {
    const normalizedNewAddress = normalizeAddress(newAddress);
    trackEvent(AnalyticsOnlyEvent.RecoveryAddressChangeHashRequested, {
      new_address: normalizedNewAddress,
    });
    try {
      const result = await updateRecoveryAddress({
        to: newAddress,
        account: account!,
      });

      setNewAddress('');
      trackEvent(AnalyticsEvent.SubmitRecoveryAddressChange, {
        toAddress: newAddress,
      });
      trackEvent(AnalyticsOnlyEvent.RecoveryAddressChangeSubmitSucceeded, {
        recovery_address_change_id: result.data.result.recoveryAddressChangeId,
        new_address: normalizedNewAddress,
      });
      push('BroadcastingChangeRecoveryAddress', {
        recoveryAddressChangeId: result.data.result.recoveryAddressChangeId,
      });
    } catch (e) {
      const apiError = getFirstApiErrorBody(e);

      if (apiError && apiError.reason === 'recovery_address_change_limit') {
        const message = 'Recovery change limit hit';
        toast.show(message, { type: 'danger' });
        trackEvent(AnalyticsEvent.SubmitRecoveryAddressChangeFailed, {
          toAddress: newAddress,
          message,
          error_reason: 'recovery_address_change_limit',
        });

        return;
      }

      if (apiError && apiError.reason === 'transaction_would_revert') {
        const message = `Transaction would revert: ${apiError.data.revertError.name}`;
        toast.show(message, { type: 'danger' });
        trackEvent(AnalyticsEvent.SubmitRecoveryAddressChangeFailed, {
          toAddress: newAddress,
          message,
          revertError: apiError.data.revertError.name,
          error_reason: 'transaction_would_revert',
        });

        return;
      }

      const message = 'An unexpected error occurred';
      const error = new Error(message, {
        cause: e,
      });
      trackError(error);
      trackEvent(AnalyticsEvent.SubmitRecoveryAddressChangeFailed, {
        toAddress: newAddress,
        message,
        error: getUnknownErrorMessage(e) || 'unknown error',
        error_reason: 'unknown',
      });
      toast.show(message, { type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  }, [toast, updateRecoveryAddress, newAddress, trackEvent, push, account]);

  const submit = useCallback(() => {
    Alert.alert(
      'Are you sure you want to change?',
      'This cannot be undone and requires an onchain action.',
      [
        {
          text: 'Change',
          style: 'destructive',
          onPress: async () => {
            await changeAddress();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  }, [changeAddress]);

  // Push the broadcasting screen if there is a pending change
  useEffect(() => {
    if (recoveryAddress.pendingChangeId) {
      push('BroadcastingChangeRecoveryAddress', {
        recoveryAddressChangeId: recoveryAddress.pendingChangeId,
      });
    }
  }, [recoveryAddress.pendingChangeId, push]);

  // Display a toast on failure
  const failedShownRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      params.failedRecoveryAddressChangeId &&
      failedShownRef.current !== params.failedRecoveryAddressChangeId
    ) {
      failedShownRef.current = params.failedRecoveryAddressChangeId;
      toast.show('Recovery address change failed', {
        type: 'danger',
        duration: 5000,
      });
      trackEvent(AnalyticsEvent.ViewRecoveryAddressChangeFailed, {
        recoveryAddressChangeId: params.failedRecoveryAddressChangeId,
      });
    }
  }, [params.failedRecoveryAddressChangeId, toast, trackEvent]);

  // Display a toast on success
  const succeededShownRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      params.succeededRecoveryAddressChangeId &&
      succeededShownRef.current !== params.succeededRecoveryAddressChangeId
    ) {
      succeededShownRef.current = params.succeededRecoveryAddressChangeId;
      toast.show('Recovery address was changed!', {
        type: 'success',
        duration: 5000,
      });
      trackEvent(AnalyticsEvent.ViewRecoveryAddressChangeSucceeded, {
        recoveryAddressChangeId: params.succeededRecoveryAddressChangeId,
      });
    }
  }, [params.succeededRecoveryAddressChangeId, toast, trackEvent]);

  // Update the submit button
  useEffect(() => {
    setOptions({
      headerRight: () => (
        <HeaderRightSubmit
          disabled={!canSubmit}
          loading={isSubmitting}
          onPress={submit}
        />
      ),
    });
  }, [canSubmit, isSubmitting, setOptions, submit]);

  return (
    <View style={[t.flex, t.hFull, t.p4]}>
      <View style={[t.flexGrow]}>
        <EditableFormFieldLabel label="Current address" />
        <Text style={[t.textLg, t.texts.primary, t.borderDefault, t.pY1]}>
          {!!recoveryAddress.isWarpcastRecoveryAddress &&
            `Farcaster (0x...${recoveryAddress.address!.substring(
              recoveryAddress.address!.length - 4,
            )})`}
          {(!recoveryAddress.isWarpcastRecoveryAddress &&
            recoveryAddress.address) ??
            'No recovery address set'}
        </Text>
        {recoveryAddress.canChange ? (
          <View style={[t.mT8]}>
            <EditableFormField
              label="New address"
              keyboardType="default"
              maxLength={42}
              onChangeText={setNewAddress}
              placeholder="0x..."
              value={newAddress}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={true}
              editable={!isSubmitting}
            />
          </View>
        ) : (
          <View style={[t.mT10]}>
            <Text style={[t.textLg, t.texts.primary, t.borderDefault]}>
              You cannot change your recovery address with Farcaster.
            </Text>

            <TextWithPress
              style={[t.texts.brand, t.pT1]}
              onPress={() => {
                Linking.openURL(
                  getNotionLinkTarget({ to: 'trx-limit-exceeded' }),
                );
              }}
            >
              Learn more
            </TextWithPress>
          </View>
        )}
      </View>
      <View style={[t.flexNone, t.mB3, t.itemsCenter]}>
        <Link
          onPress={() => {
            Linking.openURL(
              getNotionLinkTarget({ to: 'warpcast-recovery-address' }),
            );
          }}
          size="lg"
          title="Learn about recovery"
        />
      </View>
    </View>
  );
}

const EditRecoveryAddressScreen = buildScreen<EditRecoveryAddressProps>(
  {
    avoidKeyboard: true,
    name: 'EditRecoveryAddress',
  },
  EditRecoveryAddress,
);

export { EditRecoveryAddressScreen };
