import {
  BellSlashIcon,
  KebabHorizontalIcon,
  MuteIcon,
} from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame, ApiNotificationGroup } from 'farcaster-client-data';
import {
  canDisableMiniAppPushNotifications,
  useFeatureFlag,
  useGloballyCachedFrame,
  useIngestNotificationFeedback,
  useNonSuspenseFrameDetails,
  useSetMiniAppPushNotifications,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  MouseEvent,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { MenuItem } from '~/components/popovers/MenuItem';
import { useNavigateToNotificationGroupUsers } from '~/hooks/navigation/useNavigateToNotificationGroupUsers';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';
import { toast } from '~/utils/toast';

type NotificationGroupContainerProps = {
  children: ReactNode;
  // Allow rendering individual notifications by only requiring 'type'
  notificationGroup: Pick<ApiNotificationGroup, 'type'> &
    Partial<
      Pick<
        ApiNotificationGroup,
        'id' | 'totalItemCount' | 'previewItems' | 'isUnread'
      >
    >;
  onClick?: ({ openInNewTab }: { openInNewTab: boolean }) => void;
  title?: string;
  clickable?: boolean;
  trackingProps?: Record<string, string>;
  trackAsGroup?: boolean;
};

const NotificationGroupContainer: FC<NotificationGroupContainerProps> = memo(
  ({
    children,
    notificationGroup,
    onClick: onClickProp,
    title,
    clickable = true,
    trackingProps,
    trackAsGroup,
  }) => {
    const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
    const [pushNotificationsDisabled, setPushNotificationsDisabled] =
      useState(false);

    const { trackEvent } = useTrackEvent();

    const navigateToNotificationGroupUsers =
      useNavigateToNotificationGroupUsers();

    const navigateToProfile = useNavigateToProfile();

    const navigate = useCallback(
      ({ openInNewTab }: { openInNewTab: boolean }) => {
        trackEvent(
          trackAsGroup
            ? AnalyticsEvent.ClickGroupedNotification
            : AnalyticsEvent.ClickNotification,
          {
            type: notificationGroup.type,
            ...trackingProps,
          },
        );

        if (onClickProp) {
          onClickProp({ openInNewTab });
          return;
        }

        // Use onClick if not using the default list of actors, don't add custom handling here
        if (
          notificationGroup.totalItemCount === 1 &&
          notificationGroup.previewItems &&
          'actor' in notificationGroup.previewItems[0] &&
          notificationGroup.previewItems[0].actor
        ) {
          navigateToProfile({
            user: notificationGroup.previewItems[0].actor,
            openInNewTab,
          });
        } else if (notificationGroup.id) {
          navigateToNotificationGroupUsers({
            groupId: notificationGroup.id,
            title,
            type: notificationGroup.type,
          });
        }
      },
      [
        trackEvent,
        notificationGroup.type,
        notificationGroup.totalItemCount,
        notificationGroup.previewItems,
        notificationGroup.id,
        onClickProp,
        navigateToProfile,
        navigateToNotificationGroupUsers,
        title,
        trackingProps,
        trackAsGroup,
      ],
    );

    const onClick = useCallback(
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!clickable) {
          return;
        }

        // Open in new tab if user control clicked
        navigate({ openInNewTab: e.metaKey || e.ctrlKey });
      },
      [clickable, navigate],
    );

    const onAuxClick = useCallback(
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!clickable) {
          return;
        }

        if (typeof (e.target as HTMLAnchorElement).href === 'undefined') {
          return;
        }

        // Value of 1 for aux click event indicates middle click
        navigate({ openInNewTab: e.button === 1 });
      },
      [clickable, navigate],
    );

    const miniApp = useMemo(() => {
      if (notificationGroup.type !== 'mini-app') {
        return undefined;
      }
      const previewItem = notificationGroup.previewItems?.[0];
      if (!previewItem || previewItem.type !== 'mini-app') {
        return undefined;
      }
      return previewItem.content.miniapp;
    }, [notificationGroup]);
    const miniAppName = miniApp?.name ?? 'Mini App';

    const uniqueFrameDomain: string | undefined = useMemo(() => {
      if (
        notificationGroup.type !== 'frame-generic' &&
        notificationGroup.type !== 'mini-app'
      ) {
        return;
      }

      const allDomains: Set<string> = new Set();
      const items = notificationGroup.previewItems ?? [];
      for (const item of items) {
        if (item.type === 'frame-generic') {
          allDomains.add(item.content.frame.domain);
        }
        if (item.type === 'mini-app') {
          allDomains.add(item.content.miniapp.domain);
        }
      }
      if (allDomains.size !== 1) {
        return;
      }
      return Array.from(allDomains)[0];
    }, [notificationGroup]);

    const openToFeedback = useMemo(() => {
      const genericFrameWithSingleDomain =
        notificationGroup.type === 'frame-generic' && uniqueFrameDomain;

      const miniAppWithSingleDomain =
        notificationGroup.type === 'mini-app' && uniqueFrameDomain;

      return (
        notificationGroup.type === 'dormant-user-new-cast' ||
        notificationGroup.type === 'trending-token' ||
        genericFrameWithSingleDomain ||
        miniAppWithSingleDomain
      );
    }, [notificationGroup.type, uniqueFrameDomain]);

    const ingestNotificationFeedback = useIngestNotificationFeedback();

    const seeLessOftenLabel = React.useMemo(() => {
      switch (notificationGroup.type) {
        case 'mini-app':
          return `Disable ${miniAppName} in-app notifications`;
        case 'trending-token':
          return 'Disable trending token notifications';
        default:
          return 'See less often';
      }
    }, [notificationGroup.type, miniAppName]);

    const onSeeLessOftenClick = useCallback(() => {
      trackEvent(AnalyticsEvent.PressSeeLessOften, {
        notificationType: notificationGroup.type,
      });

      ingestNotificationFeedback({
        notificationType: notificationGroup.type,
        feedbackType: 'see-fewer',
        domain: uniqueFrameDomain,
      });

      toast({
        message: 'You will no longer receive this type of notification',
        toastId: `see-fewer-${notificationGroup.id}`,
        position: 'bottom-center',
      });
    }, [
      ingestNotificationFeedback,
      notificationGroup.id,
      notificationGroup.type,
      trackEvent,
      uniqueFrameDomain,
    ]);

    return (
      <div
        className={cn(
          'relative flex flex-row items-start border-b px-4 pb-5 pt-4 border-default',
          clickable ? 'cursor-pointer hover:bg-overlay-faint' : '',
          notificationGroup.isUnread ? 'bg-[#F5F4FF] dark:bg-[#1F182C]' : '',
        )}
        onClick={onClick}
        onAuxClick={onAuxClick}
      >
        {openToFeedback && (
          <Popover.Root
            modal={true}
            open={optionsOpen}
            onOpenChange={setOptionsOpen}
          >
            <Popover.Trigger
              asChild
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="absolute right-4 flex rounded-full p-1 text-muted hover:bg-gray-200">
                <KebabHorizontalIcon />
              </div>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="outline-hidden z-20 flex w-max cursor-default flex-col rounded-md border p-1 shadow-lg bg-app border-default"
                side="bottom"
                sideOffset={4}
                align="end"
              >
                <MenuItem
                  name={seeLessOftenLabel}
                  icon={<MuteIcon />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setOptionsOpen(false);

                    onSeeLessOftenClick();
                  }}
                />
                <MiniAppPushNotificationMenuItem
                  miniApp={miniApp}
                  miniAppName={miniAppName}
                  locallyDisabled={pushNotificationsDisabled}
                  onDisabled={() => setPushNotificationsDisabled(true)}
                  onClose={() => setOptionsOpen(false)}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
        {children}
      </div>
    );
  },
);

const MiniAppPushNotificationMenuItem: FC<{
  miniApp: ApiFrame | undefined;
  miniAppName: string;
  locallyDisabled: boolean;
  onDisabled: () => void;
  onClose: () => void;
}> = ({ miniApp, miniAppName, locallyDisabled, onDisabled, onClose }) => {
  const miniAppPushNotificationsEnabled = useFeatureFlag(
    'mini-app-push-notifications',
  );
  const { data: miniAppDetails } = useNonSuspenseFrameDetails({
    domain: miniApp?.domain,
    enabled: !!miniApp,
  });
  const currentMiniApp = useGloballyCachedFrame(miniAppDetails ?? miniApp);
  const setMiniAppPushNotifications = useSetMiniAppPushNotifications();
  const showPushNotificationMenuItem =
    miniAppPushNotificationsEnabled &&
    currentMiniApp?.supportsPushNotifications === true;
  const showDisablePushNotifications = canDisableMiniAppPushNotifications({
    featureEnabled: miniAppPushNotificationsEnabled,
    miniApp: currentMiniApp,
    locallyDisabled,
  });

  const onDisablePushNotificationsClick = useCallback(async () => {
    if (!currentMiniApp) {
      return;
    }

    try {
      await setMiniAppPushNotifications({
        frame: currentMiniApp,
        enabled: false,
      });
      onDisabled();
      toast({
        message: `Push notifications disabled for ${miniAppName}`,
        type: 'success',
        position: 'bottom-center',
      });
    } catch {
      toast({
        message: 'Error disabling push notifications',
        type: 'error',
        position: 'bottom-center',
      });
    }
  }, [currentMiniApp, miniAppName, onDisabled, setMiniAppPushNotifications]);

  if (!showPushNotificationMenuItem) {
    return null;
  }

  return (
    <MenuItem
      name={
        showDisablePushNotifications
          ? `Disable ${miniAppName} push notifications`
          : `${miniAppName} push notifications are off`
      }
      icon={<BellSlashIcon />}
      disabled={!showDisablePushNotifications}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();

        onClose();

        await onDisablePushNotificationsClick();
      }}
    />
  );
};

export { NotificationGroupContainer };
