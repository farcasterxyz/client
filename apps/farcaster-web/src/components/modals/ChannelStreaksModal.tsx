import { PersonIcon, XIcon } from '@primer/octicons-react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel, ApiChannelBasic } from 'farcaster-client-data';
import {
  formatFollowCount,
  useSetUserPreferences,
  useStartChannelStreak,
  useUserFollowingChannels,
} from 'farcaster-client-hooks';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';
import { applyCloudflarePath } from '~/utils/images';

import { ComposeCastModal } from './ComposeCastModal';
import { ConfirmationModal } from './ConfirmationModal';

type ChannelStreaksChannelSelectorProps = {
  onChannelSelect: ({ channel }: { channel: ApiChannel }) => void;
};

const ChannelStreaksModalChannelSelector: React.FC<ChannelStreaksChannelSelectorProps> =
  React.memo(({ onChannelSelect }) => {
    const { data, onEndReached } = useUserFollowingChannels({
      forComposer: false,
    });

    const channels = React.useMemo(
      () =>
        data!.pages
          .flatMap((page) => page.result.channels)
          .filter((channel) => channel.type === 'channel') || [],
      [data],
    );

    const keyExtractor = React.useCallback((item: ApiChannel) => {
      return item.key;
    }, []);

    const renderItem = React.useCallback(
      ({ item: channel }: { item: ApiChannel }) => {
        const channelImageUrl = channel.imageUrl || NFT_IMAGE_UNAVAILABLE_URL;
        const channelName = channel.name;

        return (
          <div
            className="flex cursor-pointer flex-row items-center space-x-2 px-2 py-3 bg-overlay-faint hover:bg-overlay-light"
            onClick={() => {
              onChannelSelect({ channel });
            }}
          >
            <Image
              src={applyCloudflarePath(channelImageUrl, 24)}
              className="aspect-square size-[24px] min-h-[24px] max-w-[24px] flex-1 shrink-0 rounded-full border object-cover border-default"
              alt={`${channelName} image`}
            />
            <span className="line-clamp-1 text-sm text-default">
              {channel.key}
            </span>
            <span className="flex flex-row items-center space-x-0.5">
              <PersonIcon className="text-muted " size={10} />
              <span className="text-xs text-muted">
                {formatFollowCount({ followCount: channel.followerCount || 0 })}
              </span>
            </span>
          </div>
        );
      },
      [onChannelSelect],
    );

    return (
      <FlatList
        itemClassName="border-b border-default last:border-b-0"
        containerClassName="border border-default rounded scrollbar-vert flex max-h-[300px] flex-col overflow-y-auto"
        data={channels}
        renderItem={renderItem}
        emptyView={<></>}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
      />
    );
  });

type ChannelStreaksModalProps = {
  children: React.ReactElement;
};

const ChannelStreaksModal: React.FC<ChannelStreaksModalProps> = React.memo(
  ({ children: trigger }) => {
    const { fid: currentUserFid } = useCurrentUser();

    const { trackEvent } = useAnalytics();

    const navigateToChannel = useNavigateToChannel();

    const [open, setOpen] = React.useState<boolean>(false);
    const [choosingChannel, setChoosingChannel] =
      React.useState<boolean>(false);
    const [selectedChannel, setSelectedChannel] = React.useState<
      ApiChannelBasic | undefined
    >(undefined);
    const [channelKey, setChannelKey] = React.useState<string | undefined>(
      undefined,
    );
    const [askDismissStreaksConfirmation, setAskDismissStreaksConfirmation] =
      React.useState<boolean>(false);

    const startChannelStreak = useStartChannelStreak();

    const setUserPreferences = useSetUserPreferences();

    const onNotInterestedClick = React.useCallback(() => {
      trackEvent(
        AnalyticsEvent.PressNotInterestedChannelStreakPrompt,
        undefined,
      );

      setOpen(false);
      setAskDismissStreaksConfirmation(true);
    }, [trackEvent]);

    const onProceedClick = React.useCallback(() => {
      trackEvent(AnalyticsEvent.PressLetsGoChannelStreaksPrompt, undefined);

      setChoosingChannel(true);
    }, [trackEvent]);

    const onChannelSelect = React.useCallback(
      async ({ channel }: { channel: ApiChannel }) => {
        trackEvent(AnalyticsEvent.PressSelectChannelChannelStreakPrompt, {
          channelKey: channel.key,
        });

        const streakChannel = {
          description: channel.description || '',
          followerCount: channel.followerCount || 0,
          imageUrl: channel.imageUrl || NFT_IMAGE_UNAVAILABLE_URL,
          key: channel.key,
          name: channel.name,
        };

        startChannelStreak({
          fid: currentUserFid,
          channel: streakChannel,
        });

        setChoosingChannel(false);
        setSelectedChannel(streakChannel);
      },
      [currentUserFid, startChannelStreak, trackEvent],
    );

    const onGoToChannelClick = React.useCallback(() => {
      if (typeof selectedChannel === 'undefined') {
        return;
      }

      setOpen(false);

      trackEvent(AnalyticsEvent.PressGoToChannelChannelStreakPrompt, {});

      navigateToChannel({ channelKey: selectedChannel.key });
    }, [navigateToChannel, selectedChannel, trackEvent]);

    const onCastNowClick = React.useCallback(() => {
      if (typeof selectedChannel === 'undefined') {
        return;
      }

      setOpen(false);

      trackEvent(AnalyticsEvent.PressCastNowChannelStreakPrompt, {});

      setChannelKey(selectedChannel.key);
    }, [selectedChannel, trackEvent]);

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.ShowStartChannelStreaksPrompt, {});
    }, [trackEvent]);

    React.useEffect(() => {
      setChoosingChannel(false);
      setSelectedChannel(undefined);
    }, [open]);

    const content = React.useMemo(() => {
      if (choosingChannel) {
        return (
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 max-h-[85vh] w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] py-6 bg-app">
            <div className="flex flex-row items-center justify-between pl-6 pr-4">
              <Dialog.Title className="text-lg font-semibold text-default">
                Pick a channel
              </Dialog.Title>
              <Dialog.Close asChild>
                <div className="flex w-max cursor-pointer flex-col items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default">
                  <XIcon size={20} className="text-default" />
                </div>
              </Dialog.Close>
            </div>
            <div className="mt-1 px-6 text-default">
              You can only have 1 streak at a time. You cannot change the
              channel until the streak ends.
            </div>
            <div className="flex flex-col space-y-2 px-6">
              <React.Suspense
                fallback={
                  <div className="flex h-[300px] w-full items-center justify-center">
                    <LoadingIndicator />
                  </div>
                }
              >
                <ChannelStreaksModalChannelSelector
                  onChannelSelect={onChannelSelect}
                />
              </React.Suspense>
            </div>
          </Dialog.Content>
        );
      } else if (typeof selectedChannel !== 'undefined') {
        return (
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 max-h-[85vh] w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] py-6 bg-app">
            <div className="flex flex-row items-center justify-between pl-6 pr-4">
              <Dialog.Title className="text-lg font-semibold text-default">
                You're all set!
              </Dialog.Title>
              <Dialog.Close asChild>
                <div className="flex w-max cursor-pointer flex-col items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default">
                  <XIcon size={20} className="text-default" />
                </div>
              </Dialog.Close>
            </div>
            <div className="mt-1 px-6 text-default">
              Cast in /{selectedChannel.key} to get started.
            </div>
            <div className="relative justify-center">
              <Image
                alt={'Channel Straks illustration'}
                src={'/~/images/StreakLightModeSuccess.webp'}
                className="block dark:hidden"
              />
              <Image
                alt={'Channel Straks illustration'}
                src={'/~/images/StreakDarkModeSuccess.webp'}
                className="hidden dark:block"
              />
              <div className="absolute top-0 flex size-full items-center justify-center pt-24">
                <div className="flex w-max flex-row items-center space-x-2 self-center rounded border px-2 py-1 bg-app border-default">
                  <Image
                    src={applyCloudflarePath(selectedChannel.imageUrl, 24)}
                    className="aspect-square size-[24px] min-h-[24px] max-w-[24px] flex-1 shrink-0 rounded-full border object-cover border-default"
                    alt={`${selectedChannel.name} image`}
                  />
                  <span className="text-sm text-default">
                    {selectedChannel.key}
                  </span>
                  <span className="flex flex-row items-center space-x-0.5 pt-[2px]">
                    <PersonIcon className="text-muted" size={10} />
                    <span className="text-xs text-muted">
                      {formatFollowCount({
                        followCount: selectedChannel.followerCount || 0,
                      })}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 grid-rows-1 items-center justify-between gap-4 px-6">
              <DefaultButton
                title="Go to channel"
                className="outline-hidden flex h-10 !w-full flex-row items-center !justify-center space-x-1 self-center border !bg-transparent !p-0 !text-base !font-normal !text-muted border-default"
                onClick={onGoToChannelClick}
              >
                <span className="flex flex-row items-center text-center">
                  Go to channel
                </span>
              </DefaultButton>
              <DefaultButton
                title="Cancel"
                className="outline-hidden flex h-10 !w-full  flex-row items-center !justify-center space-x-1 !text-base !font-normal !bg-action-primary hover:!bg-[#7C65C1F0]"
                onClick={onCastNowClick}
              >
                <span className="flex flex-row items-center text-center text-light">
                  Cast now
                </span>
              </DefaultButton>
            </div>
          </Dialog.Content>
        );
      } else {
        return (
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 max-h-[85vh] w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] py-6 bg-app">
            <div className="flex flex-row items-center justify-between pl-6 pr-4">
              <Dialog.Title className="text-lg font-semibold text-default">
                Showcase your favorite channel
              </Dialog.Title>
              <Dialog.Close asChild>
                <div className="flex w-max cursor-pointer flex-col items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default">
                  <XIcon size={20} className="text-default" />
                </div>
              </Dialog.Close>
            </div>
            <Image
              alt={'Channel Straks illustration'}
              src={'/~/images/StreakLightModeStart.webp'}
              className="block dark:hidden"
            />
            <Image
              alt={'Channel Straks illustration'}
              src={'/~/images/StreakDarkModeStart.webp'}
              className="hidden dark:block"
            />
            <div className="flex flex-col space-y-2 px-6">
              <div className="text-base text-default">Here's how it works:</div>
              <div className="text-base text-default">
                1. Pick a channel for your streak
              </div>
              <div className="text-base text-default">
                2. Cast or reply daily to keep your streak alive
              </div>
              <div className="text-base text-default">
                3. Miss a day and it resets to 0
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 grid-rows-1 items-center justify-between gap-4 px-6">
              <DefaultButton
                title="Not interested"
                className="outline-hidden flex h-10 !w-full flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted hover:underline"
                onClick={onNotInterestedClick}
              >
                <span className="flex flex-row items-center text-center">
                  I'm not interested
                </span>
              </DefaultButton>
              <DefaultButton
                title="Cancel"
                className="outline-hidden flex h-10 !w-full  flex-row items-center !justify-center space-x-1 !text-base !font-normal !bg-action-primary hover:!bg-[#7C65C1F0]"
                onClick={onProceedClick}
              >
                <span className="flex flex-row items-center text-center text-light">
                  Let's go
                </span>
              </DefaultButton>
            </div>
          </Dialog.Content>
        );
      }
    }, [
      choosingChannel,
      onCastNowClick,
      onChannelSelect,
      onGoToChannelClick,
      onNotInterestedClick,
      onProceedClick,
      selectedChannel,
    ]);

    return (
      <>
        <Dialog.Root open={open} onOpenChange={setOpen} modal={true}>
          <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-10 bg-overlay" />
            {content}
          </Dialog.Portal>
        </Dialog.Root>
        {typeof channelKey !== 'undefined' && (
          <ComposeCastModal
            intent={{
              channelKey: channelKey,
            }}
            onClose={() => {
              setChannelKey(undefined);
            }}
          />
        )}
        {askDismissStreaksConfirmation && (
          <ConfirmationModal
            onCancel={() => {
              setOpen(true);
              setAskDismissStreaksConfirmation(false);
            }}
            onConfirm={async () => {
              void setUserPreferences({
                preferences: { optOutChannelStreaks: true },
              }).catch(() => {});

              setOpen(false);
              setAskDismissStreaksConfirmation(false);
            }}
            confirmText={'Yes, opt-out'}
            title="Opt out"
            destructive
            body={
              <>
                Opting out will remove the streak indicator from your profile
                and stop streak notifications.
              </>
            }
          />
        )}
      </>
    );
  },
);

ChannelStreaksModal.displayName = 'ChannelStreaksModal';

export { ChannelStreaksModal };
