import { Ionicons } from '@expo/vector-icons';
import { ApiRecoveryInitiatedNotificationGroup } from 'farcaster-client-data';
import { useApproveRecovery, useRejectRecovery } from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type RecoveryState = 'initiated' | 'completed' | 'rejected' | 'approved';

function getMessage(state: RecoveryState) {
  switch (state) {
    case 'initiated':
      return 'Someone tried to recover your Farcaster account using your email address.';
    case 'completed':
      return 'Your account has been recovered.';
    case 'rejected':
      return "We've cancelled the recovery for this account.";
    case 'approved':
      return 'Thanks for letting us know. This may take up to 72 hours to go through review.';
  }
}

type RecoveryInitiatedNotificationGroupProps = {
  group: ApiRecoveryInitiatedNotificationGroup;
};

const RecoveryInitiatedNotificationGroup: FC<RecoveryInitiatedNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const notification = group.previewItems[0];
    const [state, setState] = useState<RecoveryState>(
      notification.content.state,
    );
    const approveRecovery = useApproveRecovery();
    const rejectRecovery = useRejectRecovery();

    const message = useMemo(() => getMessage(state), [state]);

    useEffect(() => {
      if (state === 'initiated') {
        trackEvent(AnalyticsOnlyEvent.RecoveryApprovalNotificationShown, {});
      }
    }, [state, trackEvent]);

    const handleApproveRecovery = useCallback(async () => {
      try {
        await approveRecovery();
        trackEvent(AnalyticsOnlyEvent.RecoveryApprovalApproved, {});
        setState('approved');
      } catch (e) {
        trackEvent(AnalyticsOnlyEvent.RecoveryApprovalError, {
          action: 'approve',
          error_message: (e instanceof Error ? e.message : String(e)).slice(
            0,
            500,
          ),
        });
        throw e;
      }
    }, [approveRecovery, trackEvent]);

    const handleRejectRecovery = useCallback(async () => {
      try {
        await rejectRecovery();
        trackEvent(AnalyticsOnlyEvent.RecoveryApprovalRejected, {});
        setState('rejected');
      } catch (e) {
        trackEvent(AnalyticsOnlyEvent.RecoveryApprovalError, {
          action: 'reject',
          error_message: (e instanceof Error ? e.message : String(e)).slice(
            0,
            500,
          ),
        });
        throw e;
      }
    }, [rejectRecovery, trackEvent]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={() => {}}>
        <NotificationIcon variant="purple">
          {(iconColor) => (
            <Ionicons
              name="shield"
              size={18}
              style={[{ color: iconColor, marginTop: 2 }]}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View
            style={[
              t.flexCol,
              t.flex1,
              { gap: 12 },
              state === 'completed' || state === 'approved' ? t.mT1 : t.mT0,
            ]}
          >
            <Text2 weight="medium">{message}</Text2>
            {state === 'initiated' && (
              <View style={[t.flexRow, { gap: 8 }]}>
                <ButtonV2
                  height="sm"
                  width="flex1"
                  variant="secondary"
                  onPress={handleRejectRecovery}
                  title="No, it's not me"
                />
                <ButtonV2
                  height="sm"
                  width="flex1"
                  variant="secondary"
                  onPress={handleApproveRecovery}
                  title="Yes, it's me"
                />
              </View>
            )}
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

RecoveryInitiatedNotificationGroup.displayName =
  'RecoveryInitiatedNotificationGroup';

export { RecoveryInitiatedNotificationGroup };
