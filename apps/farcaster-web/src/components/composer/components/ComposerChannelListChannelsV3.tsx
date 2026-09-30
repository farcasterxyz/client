import { SearchIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import {
  formatFollowCount,
  useFlatSearchChannelsData,
  useNonSuspenseUserFollowingChannels,
  useSearchChannels,
} from 'farcaster-client-hooks';
import React, { useState } from 'react';

import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { TextInput } from '~/components/forms/TextInput';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type SelectorChannel = Pick<
  ApiChannel,
  'key' | 'name' | 'imageUrl' | 'followerCount'
> & {
  isMember: boolean;
  canCast: boolean;
};

interface ComposerChannelListChannelsV3Props {
  onClose?: () => void;
  selectChannel: ({ channelKey }: { channelKey?: string }) => void;
  trackChannelSelected?: ({
    channelKey,
    isHome,
  }: {
    channelKey?: string;
    isHome: boolean;
  }) => void;
}

const ComposerChannelListChannelsV3: React.FC<
  ComposerChannelListChannelsV3Props
> = ({ selectChannel, onClose }) => {
  const [query, setQuery] = useState('');
  const { trackEvent } = useAnalytics();

  return (
    <div
      className="flex w-[300px] flex-col rounded-md border p-2 pt-3 shadow-lg bg-app border-default"
      style={{
        maxHeight:
          'min(55vh, var(--radix-popover-content-available-height, 55vh))',
      }}
    >
      <div className="relative flex min-h-8 flex-shrink-0 flex-row flex-wrap items-center gap-1">
        <SearchIcon className={'absolute left-[12px] top-[8px] text-faint'} />
        <TextInput
          className={
            '!outline-hidden h-9 !rounded-lg !bg-[#f3f3f3] !px-9 dark:!bg-[#342942]'
          }
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onClick={(e) => {
            // Need to this to prevent closing the menu when a user clicks the input
            e.stopPropagation();
          }}
          placeholder="Search for channels"
        />
      </div>
      <div className="scrollbar-vert flex-1 overflow-y-auto">
        {query === '' ? (
          <ComposerChannelListChannelsV3Default
            onClose={onClose}
            selectChannel={selectChannel}
            trackChannelSelected={(props) => {
              trackEvent(AnalyticsEvent.CastComposerChannelSelected, {
                ...props,
                source: 'default',
              });
            }}
          />
        ) : (
          <ComposerChannelListChannelsV3Search
            onClose={onClose}
            selectChannel={selectChannel}
            query={query}
            trackChannelSelected={(props) => {
              trackEvent(AnalyticsEvent.CastComposerChannelSelected, {
                ...props,
                source: 'search',
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

ComposerChannelListChannelsV3.displayName = 'ComposerChannelListChannelsV3';

const ComposerChannelListChannelsV3Default: React.FC<
  ComposerChannelListChannelsV3Props
> = ({ onClose, selectChannel, trackChannelSelected }) => {
  const { data, onEndReached, isFetchingNextPage, isLoading } =
    useNonSuspenseUserFollowingChannels({
      forComposer: true,
    });

  const channels: SelectorChannel[] = React.useMemo(
    () =>
      data?.pages
        .flatMap((page) => page.result.channels)
        .filter((channel) => channel.type === 'channel')
        .map((channel) => {
          return {
            key: channel.key,
            name: channel.name,
            imageUrl: channel.imageUrl,
            followerCount: channel.followerCount,
            isMember: channel.viewerContext.isMember,
            canCast: channel.viewerContext.canCast ?? false,
          } satisfies SelectorChannel;
        }) || [],
    [data],
  );

  const selectorChannels: SelectorChannel[] = React.useMemo(() => {
    return [
      {
        key: 'Home',
        name: 'Home',
        imageUrl: 'https://farcaster.xyz/~/channel-images/home.png',
        followerCount: undefined,
        isMember: true,
        canCast: true,
      },
      ...channels,
    ];
  }, [channels]);

  const renderItem = React.useMemo(
    () => makeRenderItem(selectChannel, trackChannelSelected, onClose),
    [onClose, selectChannel, trackChannelSelected],
  );

  if (isLoading) {
    return (
      <div className="flex flex-row justify-center px-2 pb-1 pt-2">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="mt-3">
      {selectorChannels.length !== 0 && (
        <FlatList
          itemClassName="w-full"
          data={selectorChannels}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          emptyView={<></>}
          isFetchingNextPage={isFetchingNextPage}
          onEndReached={onEndReached}
        />
      )}
    </div>
  );
};

interface ComposerChannelListChannelsV3SearchProps {
  onClose?: () => void;
  query: string;
  selectChannel: ({ channelKey }: { channelKey?: string }) => void;
  trackChannelSelected: ({
    channelKey,
    isHome,
  }: {
    channelKey?: string;
    isHome: boolean;
  }) => void;
}

const ComposerChannelListChannelsV3Search: React.FC<
  ComposerChannelListChannelsV3SearchProps
> = ({ onClose, query, selectChannel, trackChannelSelected }) => {
  const { data, onEndReached, isFetchingNextPage } = useSearchChannels({
    q: query,
    prioritizeFollowed: true,
    forComposer: true,
  });
  const channelsData = useFlatSearchChannelsData({ data });
  const channels: SelectorChannel[] | undefined = React.useMemo(
    () =>
      channelsData
        // Exclude NFTs and other non-channel feeds
        ?.filter((channel) => channel.type === 'channel')
        .map((channel) => {
          return {
            key: channel.key,
            name: channel.name,
            imageUrl: channel.imageUrl || NFT_IMAGE_UNAVAILABLE_URL,
            followerCount: channel.followerCount,
            isMember: channel.viewerContext.isMember,
            canCast: channel.viewerContext.canCast ?? false,
          };
        }),
    [channelsData],
  );

  const renderItem = React.useMemo(
    () => makeRenderItem(selectChannel, trackChannelSelected, onClose),
    [onClose, selectChannel, trackChannelSelected],
  );

  if (!channels) {
    return (
      <div className="flex flex-row justify-center px-2 pb-1 pt-2">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <FlatList
      containerClassName="flex flex-col pb-4 mt-4 scrollbar-vert"
      data={channels}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      emptyView={
        <DefaultEmptyListView
          className="text-sm text-faint"
          message="No channels found"
        />
      }
    />
  );
};

function makeRenderItem(
  selectChannel: ({ channelKey }: { channelKey?: string }) => void,
  trackChannelSelected:
    | (({
        channelKey,
        isHome,
      }: {
        channelKey?: string;
        isHome: boolean;
      }) => void)
    | undefined,
  onClose: (() => void) | undefined,
) {
  return ({ item }: { item: SelectorChannel; index: number }) => {
    const noChannelSelectorRow = item.key === 'Home';

    return (
      <button
        type="button"
        className={classNames(
          'flex w-full flex-row items-center justify-between rounded-lg border-0 bg-transparent px-2 py-3 text-left',
          item.canCast
            ? 'cursor-pointer hover:bg-[#f3f3f3] dark:hover:bg-[#342942]'
            : 'pointer-events-none cursor-default',
        )}
        disabled={!item.canCast}
        onClick={() => {
          trackChannelSelected?.({
            channelKey: noChannelSelectorRow ? undefined : item.key,
            isHome: noChannelSelectorRow,
          });
          if (noChannelSelectorRow) {
            selectChannel({ channelKey: undefined });
          } else {
            selectChannel({ channelKey: item.key });
          }
          onClose?.();
        }}
      >
        <div
          className={classNames(
            'flex flex-row items-center space-x-2',
            !item.canCast && 'opacity-25',
          )}
        >
          {noChannelSelectorRow ? (
            <div className="flex size-[40px] min-w-0 shrink-0 items-center justify-center rounded-full bg-[#EDE8F8]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12.9705 2.59061C12.4107 2.11563 11.5893 2.11563 11.0295 2.59061L3.52953 8.95425C3.19364 9.23925 3 9.6575 3 10.098V19.5008C3 20.3292 3.67157 21.0008 4.5 21.0008H9.25C9.66421 21.0008 10 20.665 10 20.2508V14.0008H14V20.2508C14 20.665 14.3358 21.0008 14.75 21.0008H19.5C20.3284 21.0008 21 20.3292 21 19.5008V10.098C21 9.6575 20.8064 9.23925 20.4705 8.95425L12.9705 2.59061Z"
                  fill="#7C65C1"
                />
              </svg>
            </div>
          ) : (
            <ChannelImage
              channelImageUrl={item.imageUrl}
              size="composer-selector-large"
            />
          )}
          <span className="line-clamp-1 text-sm text-default">{item.key}</span>
        </div>
        {!noChannelSelectorRow &&
          (item.canCast ? (
            <span
              className={classNames(
                'flex w-[74px] flex-row items-center text-left',
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="min-w-0 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.33341 5.33268C2.33341 3.30765 3.97501 1.66602 6.00003 1.66602C8.02505 1.66602 9.66664 3.30765 9.66664 5.33268C9.66664 6.59234 9.03145 7.70365 8.06389 8.36376C10.3069 9.18543 11.9226 11.308 11.9973 13.8178C12.0055 14.0938 11.7884 14.3242 11.5124 14.3325C11.2363 14.3407 11.0059 14.1236 10.9977 13.8476C10.9176 11.1565 8.71062 8.99935 5.99997 8.99935C3.28932 8.99935 1.08232 11.1565 1.00222 13.8476C0.994009 14.1236 0.763591 14.3407 0.487571 14.3325C0.211551 14.3242 -0.00554796 14.0938 0.00266707 13.8178C0.0773658 11.308 1.69309 9.18538 3.93612 8.36373C2.96859 7.70362 2.33341 6.59232 2.33341 5.33268ZM6.00003 2.66602C4.52731 2.66602 3.33341 3.85992 3.33341 5.33268C3.33341 6.80545 4.52731 7.99935 6.00003 7.99935C7.47275 7.99935 8.66664 6.80545 8.66664 5.33268C8.66664 3.85992 7.47275 2.66602 6.00003 2.66602Z"
                  className="fill-[#8b99a4] dark:fill-[#9FA3AF]"
                />
                <path
                  d="M11.5267 5.33268C11.4282 5.33268 11.3317 5.33969 11.2375 5.35316C10.9642 5.39226 10.7109 5.20235 10.6718 4.92899C10.6327 4.65563 10.8226 4.40233 11.0959 4.36323C11.2369 4.34308 11.3807 4.33268 11.5267 4.33268C13.1946 4.33268 14.5466 5.68479 14.5466 7.35268C14.5466 8.33657 14.0761 9.20994 13.3491 9.76095C14.9034 10.4577 15.9866 12.0182 15.9866 13.8327C15.9866 14.1088 15.7628 14.3327 15.4866 14.3327C15.2105 14.3327 14.9866 14.1088 14.9866 13.8327C14.9866 12.2688 13.9487 10.946 12.5229 10.5181L12.1666 10.4112V9.29391L12.4402 9.15494C13.0978 8.82077 13.5466 8.13871 13.5466 7.35268C13.5466 6.23706 12.6423 5.33268 11.5267 5.33268Z"
                  className="fill-[#8b99a4] dark:fill-[#9FA3AF]"
                />
              </svg>
              <span className="ml-1 text-sm leading-[16px] text-faint">
                {formatFollowCount({ followCount: item.followerCount || 0 })}
              </span>
            </span>
          ) : (
            <span className="text-xs leading-[16px] text-faint">
              Not available
            </span>
          ))}
      </button>
    );
  };
}

export { ComposerChannelListChannelsV3 };
