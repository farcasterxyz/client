import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiPaymentReceivedNotificationGroup,
  formatCents,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  resolveUsernameShort,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '~/components/Button';
import { DollarCircleIcon } from '~/components/icons/DollarCircleIcon';
import { NotificationGroupAvatars } from '~/components/NotificationGroup/shared/NotificationGroupAvatars';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import {
  NotificationTitleText,
  NotificationTitleTextWithPress,
} from './shared/NotificationTitleText';

type PaymentReceivedNotificationGroupProps = {
  group: ApiPaymentReceivedNotificationGroup;
};

const PaymentReceivedNotificationGroup: FC<PaymentReceivedNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const navigate = useNavigate();
    const pushToUserProfile = usePushToUserProfile();
    const { trackEvent } = useTrackEvent();
    const users = React.useMemo(
      () =>
        group.previewItems.flatMap((previewItem) => previewItem.actor) || [],
      [group.previewItems],
    );

    const currentUser = useCurrentUser_UNSAFE();
    const actor = group.previewItems[0].actor;
    const exploreUrl = getTransactionExplorerUrl({
      type: 'tx',
      hash: group.previewItems[0].content.payment.transactionHash,
      chainId: '8453',
    });

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          pushToUserProfile({ fid: actor.fid });
        }}
      >
        <NotificationIcon variant="blue">
          {(iconColor) => <DollarCircleIcon size={20} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupAvatars actors={users} />
          <View
            style={[t.mY2, t.mR1, t.flex, t.flexRow, t.flexWrap, t.itemsCenter]}
          >
            <NotificationTitleText>
              <NotificationTitleTextWithPress
                onPress={() => {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type: group.type,
                    action: 'author',
                  });

                  pushToUserProfile({ fid: actor.fid });
                }}
              >
                {resolveUsernameShort(actor)}
              </NotificationTitleTextWithPress>{' '}
              sent you{' '}
              {formatCents(
                Number(
                  BigInt(group.previewItems[0].content.payment.amount) /
                    10n ** 4n,
                ),
              )}
            </NotificationTitleText>
          </View>
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.mT2]}>
            <Button
              size="sm"
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: group.type,
                  action: 'message',
                });
                navigate('PlaintextDirectCastsConversation', {
                  counterParty: group.previewItems[0].actor,
                  conversationId: buildNonGroupConversationId({
                    participantFids: [
                      group.previewItems[0].actor.fid,
                      currentUser.fid,
                    ],
                  }),
                  create: true,
                  intentText: undefined,
                });
              }}
              style={[t.mR2]}
              title="Message"
            />
            {exploreUrl && (
              <Button
                size="sm"
                variant="muted"
                title="View"
                iconRight="link-external"
                onPress={() => {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type: group.type,
                    action: 'view transaction',
                  });
                  Linking.openURL(exploreUrl);
                }}
              />
            )}
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

PaymentReceivedNotificationGroup.displayName =
  'PaymentReceivedNotificationGroup';

export { PaymentReceivedNotificationGroup };
