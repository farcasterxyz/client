import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useRecoveryAddressChange } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useRef } from 'react';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';

type BroadcastingChangeRecoveryAddressScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'BroadcastingChangeRecoveryAddress'
>;

function BroadcastingChangeRecoveryAddress({
  route,
}: BroadcastingChangeRecoveryAddressScreenProps) {
  const { recoveryAddressChangeId } = route.params;
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewRecoveryAddressChangeBroadcasting, {
        recoveryAddressChangeId,
      });
    }, [recoveryAddressChangeId, trackEvent]),
  );

  const { data } = useRecoveryAddressChange(
    { recoveryAddressChangeId },
    { refetchInterval: 1000 },
  );

  const pollStartRef = useRef<number>(Date.now());
  const terminalFiredRef = useRef(false);

  useEffect(() => {
    const { completedAt, failedAt } = data!.result.recoveryAddressChange;

    if (completedAt) {
      if (!terminalFiredRef.current) {
        terminalFiredRef.current = true;
        trackEvent(AnalyticsOnlyEvent.RecoveryAddressChangePollingTerminal, {
          terminal_state: 'completed',
          recovery_address_change_id: recoveryAddressChangeId,
          time_in_poll_ms: Date.now() - pollStartRef.current,
        });
      }
      navigate('EditRecoveryAddress', {
        succeededRecoveryAddressChangeId: recoveryAddressChangeId,
      });
      return;
    }

    if (failedAt) {
      if (!terminalFiredRef.current) {
        terminalFiredRef.current = true;
        trackEvent(AnalyticsOnlyEvent.RecoveryAddressChangePollingTerminal, {
          terminal_state: 'failed',
          recovery_address_change_id: recoveryAddressChangeId,
          time_in_poll_ms: Date.now() - pollStartRef.current,
        });
      }
      navigate('EditRecoveryAddress', {
        failedRecoveryAddressChangeId: recoveryAddressChangeId,
      });
      return;
    }
  }, [data, recoveryAddressChangeId, trackEvent, navigate]);

  return (
    <FullScreenLoadingIndicator
      message="Broadcasting"
      bottomMessage={`This may take up to 60 seconds.\nPlease keep your app open.`}
      debugName="BroadcastingChangeRecoveryAddressScreen"
    />
  );
}

export const BroadcastingChangeRecoveryAddressScreen =
  buildScreen<BroadcastingChangeRecoveryAddressScreenProps>(
    {
      name: 'BroadcastingChangeRecoveryAddress',
    },
    BroadcastingChangeRecoveryAddress,
  );
