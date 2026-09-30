import { LinkExternalIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiPaymentReceivedNotificationGroup } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  resolveUsernameShort,
  useOptimisticallyAddNewDirectCastConversationToInbox,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DollarCircleIcon } from '~/components/icons/DollarCircleIcon';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';
import { formatCents } from '~/utils/currencyUtils';
import { getTransactionExplorerUrl } from '~/utils/ethereumUtils';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type PaymentReceivedNotificationGroupProps = {
  notificationGroup: ApiPaymentReceivedNotificationGroup;
};

const PaymentReceivedNotificationGroup: FC<PaymentReceivedNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const currentUser = useCurrentUser();
    const { trackEvent } = useTrackEvent();
    const notification = notificationGroup.previewItems[0];
    const actor = notification.actor;

    const externalNavigate = useExternalNavigate();
    const navigateToDirectCastsConversation =
      useNavigateToDirectCastsConversation();
    const addNewOptimisticConversation =
      useOptimisticallyAddNewDirectCastConversationToInbox();

    const sendMessage = () => {
      const conversationId = buildNonGroupConversationId({
        participantFids: [actor.fid, currentUser.fid],
      });

      addNewOptimisticConversation({
        currentUser,
        conversationId,
        counterParties: [actor],
      });

      navigateToDirectCastsConversation({
        conversationId: conversationId,
      });
    };

    return (
      <NotificationGroupContainer notificationGroup={notificationGroup}>
        <NotificationIcon variant="blue">
          <div className="pt-[3px]">
            <DollarCircleIcon size={NOTIFICATION_ICON_SIZE} />
          </div>
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <div className="line-clamp-2 break-gracefully">
            <LinkToProfileWithSummaryTooltip
              title={resolveUsernameShort(actor)}
              user={actor}
              className="relative font-semibold text-default hover:underline"
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'author',
                });
              }}
            >
              {actor.displayName}
            </LinkToProfileWithSummaryTooltip>{' '}
            sent you{' '}
            {formatCents(
              Number(BigInt(notification.content.payment.amount) / 10n ** 4n),
            )}
          </div>
          <div className="mt-2 flex flex-row gap-2">
            <DefaultButton
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'message',
                });
                sendMessage();
              }}
            >
              Message
            </DefaultButton>
            <DefaultButton
              size="sm"
              variant="muted"
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'view transaction',
                });
                externalNavigate({
                  to: getTransactionExplorerUrl({
                    hash: notification.content.payment.transactionHash,
                    chainId: '8453',
                  }),
                  openInNewTab: true,
                });
              }}
            >
              <div className="flex flex-row items-center justify-center">
                View
                <LinkExternalIcon size={12} className="ml-1" />
              </div>
            </DefaultButton>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

PaymentReceivedNotificationGroup.displayName = 'ReportActionNotificationGroup';

export { PaymentReceivedNotificationGroup };
