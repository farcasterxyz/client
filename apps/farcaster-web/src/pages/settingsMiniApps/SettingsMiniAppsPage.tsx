import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ThreeBarsIcon,
} from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useEnableFrameNotifications,
  useFavoriteFrames,
  useFeatureFlag,
  useInvalidateFavoriteFrames,
  useSetMiniAppPushNotifications,
  useUpdateFavoriteFrame,
} from 'farcaster-client-hooks';
import React, { memo, Suspense, useCallback, useEffect, useState } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Toggle } from '~/components/forms/Toggle';
import { FrameImageIcon } from '~/components/icons/FrameImageIcon';
import { Image } from '~/components/images/Image';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  FavoriteFrameProvider,
  useFavoriteFrame,
} from '~/contexts/FavoriteFrameProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { SettingsNav } from '~/layouts/SettingsNav';
import { toast } from '~/utils/toast';

const EmptyFramesPromo = memo(() => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent(AnalyticsEvent.ClickDiscoverFrames, {
      source: 'settings',
    });
    navigate({ to: 'miniApps', params: {} });
  };

  return (
    <div
      className="cursor-pointer rounded-xl p-6 bg-overlay-faint"
      onClick={handleClick}
    >
      <div>
        {/* <Image
          src="/~/images/DiscoverFramesHero.webp"
          alt="Discover Mini Apps"
          className="w-full"
        /> */}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Discover Mini Apps</div>
          <div className="text-muted">View Mini Apps in Action</div>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-action-primary">
          <ArrowRightIcon size={21} className="text-white" />
        </div>
      </div>
    </div>
  );
});
EmptyFramesPromo.displayName = 'EmptyFramesPromo';

const SettingsMiniAppsPage = memo(() => {
  const { flatData, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useFavoriteFrames();
  const [frames, setFrames] = useState<ApiFrame[]>(flatData || []);
  const [selectedFrame, setSelectedFrame] = useState<ApiFrame | null>(null);
  const updateFavoriteFrame = useUpdateFavoriteFrame();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();

  useEffect(() => {
    setFrames(flatData || []);
  }, [flatData]);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <Page meta={{ title: 'Mini App settings / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <FavoriteFrameProvider>
            <SettingsPageContent>
              {selectedFrame ? (
                <div className="flex flex-col">
                  <DefaultButton
                    onClick={() => setSelectedFrame(null)}
                    variant="link"
                    className="mb-2 flex items-center !p-0 !font-normal text-link hover:text-default"
                  >
                    <ArrowLeftIcon size={16} className="mr-1" />
                    Return to list
                  </DefaultButton>
                  <FrameSettings
                    frame={selectedFrame}
                    onClose={() => setSelectedFrame(null)}
                  />
                </div>
              ) : frames.length === 0 ? (
                <EmptyFramesPromo />
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="mb-2 px-2 text-sm text-muted">
                      Drag and drop to rearrange the order of your mini apps.
                      Mini apps are displayed from left to right, filling the
                      top row first, then moving to the next row.
                    </span>
                  </div>
                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination) {
                        return;
                      }

                      const newItems = [...frames];
                      const [removed] = newItems.splice(result.source.index, 1);
                      newItems.splice(result.destination.index, 0, removed);

                      setFrames(newItems);

                      try {
                        updateFavoriteFrame({
                          frame: removed,
                          position: result.destination.index,
                        });

                        setTimeout(() => {
                          invalidateFavoriteFrames();
                        }, 3000);
                      } catch (e) {
                        invalidateFavoriteFrames();
                        toast({
                          message: 'Error reordering mini apps',
                          type: 'error',
                        });
                      }
                    }}
                  >
                    <Droppable droppableId="frames">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="overflow-hidden rounded-xl border border-default"
                        >
                          <div>
                            {frames.map((frame, index) => (
                              <Draggable
                                key={frame.domain}
                                draggableId={frame.domain}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={
                                      snapshot.isDragging
                                        ? 'rounded-lg border px-2 shadow-lg bg-action-secondary border-default'
                                        : ''
                                    }
                                  >
                                    <FrameListItem
                                      frame={frame}
                                      onClick={() => setSelectedFrame(frame)}
                                      isLast={index === frames.length - 1}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </>
              )}
            </SettingsPageContent>
          </FavoriteFrameProvider>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

const FrameListItem = memo(
  ({
    frame,
    onClick,
    isLast,
  }: {
    frame: ApiFrame;
    onClick: () => void;
    isLast: boolean;
  }) => {
    const [imageError, setImageError] = React.useState(false);
    const authorIsProUser = useUserLevel(frame.author) === 'pro';
    return (
      <div
        className="flex cursor-pointer flex-row items-center hover:bg-overlay-faint"
        onClick={onClick}
      >
        <div className="px-4 py-3 text-faint">
          <ThreeBarsIcon size={18} />
        </div>
        <div
          className={`border-hairline flex grow flex-row items-center py-3 ${!isLast && 'border-b border-default'}`}
        >
          <div className="border-hairline mr-2 size-9 overflow-hidden rounded-lg border border-faint">
            {!imageError ? (
              <Image
                src={frame.iconUrl}
                alt={frame.name}
                className="size-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <FrameImageIcon size={24} />
              </div>
            )}
          </div>
          <div className="grow">
            <div>{frame.name}</div>
            <div className="flex flex-row items-center gap-1">
              <div className="text-sm text-muted">
                by {frame.author?.username}
              </div>
              {authorIsProUser && <FarcasterProBadge size={14} />}
            </div>
          </div>
          <div className="pr-4 text-faint">
            <ChevronRightIcon size={16} />
          </div>
        </div>
      </div>
    );
  },
);

const FrameSettings = memo(
  ({ frame, onClose }: { frame: ApiFrame; onClose: () => void }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(
      frame.viewerContext?.notificationsEnabled || false,
    );
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
      frame.viewerContext?.pushNotificationsEnabled || false,
    );
    const enableFrameNotifications = useEnableFrameNotifications();
    const setMiniAppPushNotifications = useSetMiniAppPushNotifications();
    const updateFavoriteFrame = useUpdateFavoriteFrame();
    const favoriteFrame = useFavoriteFrame();
    const miniAppPushNotificationsEnabled = useFeatureFlag(
      'mini-app-push-notifications',
    );

    const toggleNotifications = useCallback(async () => {
      if (notificationsEnabled) {
        try {
          setNotificationsEnabled(false);
          await updateFavoriteFrame({
            frame,
            disableNotifications: true,
            pushNotificationsEnabled:
              miniAppPushNotificationsEnabled && frame.supportsPushNotifications
                ? pushNotificationsEnabled
                : undefined,
          });
          toast({ message: 'Notifications disabled', type: 'success' });
        } catch (e) {
          setNotificationsEnabled(true);
          toast({ message: 'Error disabling notifications', type: 'error' });
        }
      } else {
        try {
          setNotificationsEnabled(true);
          await enableFrameNotifications(frame);
          toast({ message: 'Notifications enabled', type: 'success' });
        } catch (e) {
          setNotificationsEnabled(false);
          toast({ message: 'Error enabling notifications', type: 'error' });
        }
      }
    }, [
      enableFrameNotifications,
      frame,
      miniAppPushNotificationsEnabled,
      notificationsEnabled,
      pushNotificationsEnabled,
      updateFavoriteFrame,
    ]);

    const togglePushNotifications = useCallback(async () => {
      const nextValue = !pushNotificationsEnabled;
      setPushNotificationsEnabled(nextValue);
      try {
        await setMiniAppPushNotifications({ frame, enabled: nextValue });
        toast({
          message: `Push notifications ${nextValue ? 'enabled' : 'disabled'}`,
          type: 'success',
        });
      } catch {
        setPushNotificationsEnabled(!nextValue);
        toast({ message: 'Error updating push notifications', type: 'error' });
      }
    }, [frame, pushNotificationsEnabled, setMiniAppPushNotifications]);

    const handleRemove = useCallback(async () => {
      const removed = await favoriteFrame.confirmRemoveFavoriteFrame({
        frame,
        emit: undefined,
      });
      if (removed) {
        onClose();
      }
    }, [favoriteFrame, frame, onClose]);

    const authorIsProUser = useUserLevel(frame.author) === 'pro';

    return (
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center space-x-3">
          <div className="border-hairline size-14 overflow-hidden rounded-lg border border-faint">
            <Image
              src={frame.iconUrl}
              alt={frame.name}
              className="size-full object-cover"
            />
          </div>
          <div className="shrink">
            <div className="font-semibold">{frame.name}</div>
            {frame.author && (
              <div className="flex flex-row items-center gap-1">
                <div className="text-sm text-muted">
                  Built by {resolveUsernameShort(frame.author)}
                </div>
                {authorIsProUser && (
                  <FarcasterProBadge size={14} className="mb-1" />
                )}
              </div>
            )}
            <div className="truncate text-xs text-muted">{frame.homeUrl}</div>
          </div>
        </div>

        <div className="rounded-xl p-3 bg-overlay-faint">
          <Toggle
            label="In-app notifications"
            description={
              !frame.supportsNotifications
                ? 'Mini App does not support notifications'
                : undefined
            }
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            disabled={!frame.supportsNotifications}
          />
          {miniAppPushNotificationsEnabled &&
            frame.supportsPushNotifications && (
              <div className="mt-3 border-t pt-3 border-faint">
                <Toggle
                  label="Push notifications"
                  description="Receive push notifications from this Mini App"
                  value={pushNotificationsEnabled}
                  onValueChange={togglePushNotifications}
                />
              </div>
            )}
        </div>

        <DefaultButton
          variant="danger"
          onClick={handleRemove}
          className="w-full"
        >
          Remove
        </DefaultButton>
      </div>
    );
  },
);

SettingsMiniAppsPage.displayName = 'SettingsMiniAppsPage';

export { SettingsMiniAppsPage };
