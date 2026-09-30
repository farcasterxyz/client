import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel, ApiUser } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  useDebouncedValue,
  userKeyExtractor,
  useSearchChannels,
  useSearchUsers,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SearchInput } from '~/components/forms/SearchInput';
import { Image } from '~/components/images/Image';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSelectInputKeyboardShortcuts } from '~/hooks/useSelectInputKeyboardShortcuts';
import { applyCloudflarePath } from '~/utils/images';

import { DefaultCloseModalButton } from './DefaultCloseModalButton';
import { Modal } from './Modal';

type AdvancedSearchModalProps = {
  onClose: () => void;
  onApply: (newQuery: string) => void;
  currentQuery: string;
};

type SearchFilters = {
  from: string;
  channel: string;
};

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  onClose,
  onApply,
  currentQuery,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    from: '',
    channel: '',
  });

  // Parse the currentQuery and set initial filters
  useEffect(() => {
    const queryWords = currentQuery.split(' ');
    const existingFilters: SearchFilters = {
      from: '',
      channel: '',
    };

    queryWords.forEach((word) => {
      if (word.startsWith('from:')) {
        existingFilters.from = word.substring(5);
      } else if (word.startsWith('in:')) {
        existingFilters.channel = word.substring(3);
      }
    });

    setFilters(existingFilters);
  }, [currentQuery]);

  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showChannelSuggestions, setShowChannelSuggestions] = useState(false);
  const [focusedUserIndex, setFocusedUserIndex] = useState<number>(0);
  const [focusedChannelIndex, setFocusedChannelIndex] = useState<number>(0);
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  const debouncedFromQuery = useDebouncedValue({
    value: filters.from,
    debounceDuration: 300,
  });

  const debouncedChannelQuery = useDebouncedValue({
    value: filters.channel,
    debounceDuration: 300,
  });

  const {
    data: userData,
    isFetchingNextPage: isFetchingNextUsers,
    isPending: isLoadingUsers,
  } = useSearchUsers({
    q: debouncedFromQuery,
    limit: 5,
  });

  const {
    data: channelData,
    isFetchingNextPage: isFetchingNextChannels,
    isPending: isLoadingChannels,
  } = useSearchChannels({
    q: debouncedChannelQuery,
    limit: 5,
  });

  const users = useMemo(
    () =>
      uniqBy(
        userData?.pages.flatMap((page) => page.result.users) || [],
        userKeyExtractor,
      ),
    [userData?.pages],
  );

  const channels = useMemo(
    () =>
      uniqBy(
        channelData?.pages.flatMap((page) => page.result.channels) || [],
        channelKeyExtractor,
      ),
    [channelData?.pages],
  );

  const handleApply = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickApplyAdvancedSearchFilters, {});
    const queryWords = currentQuery.split(' ');
    // Remove existing query filters
    const cleanedQuery = queryWords
      .filter(
        (word) =>
          !word.startsWith('from:') &&
          !word.startsWith('in:') &&
          word !== 'has:power_badge',
      )
      .join(' ');

    // Construct new query
    let newQuery = cleanedQuery;

    if (filters.from) {
      newQuery += ` from:${filters.from}`;
    }
    if (filters.channel) {
      newQuery += ` in:${filters.channel}`;
    }

    newQuery = newQuery.trim();
    onApply(newQuery);

    navigate({
      to: 'top',
      searchParams: { q: newQuery },
      params: {},
    });

    onClose();
  }, [currentQuery, filters, onApply, navigate, trackEvent, onClose]);

  const { focusedIndex: _focusedUserIndex, onKeyDown: onUserFieldKeyDown } =
    useSelectInputKeyboardShortcuts({
      data: users,
      onEnter: useCallback(
        ({
          event,
          item,
        }: {
          event: KeyboardEvent;
          item: ApiUser | undefined;
        }) => {
          event.preventDefault();
          if (!item) {
            return;
          }
          setFilters((prev) => ({
            ...prev,
            from: '@' + item.username,
          }));
          setShowFromSuggestions(false);
        },
        [],
      ),
    });

  useEffect(() => {
    setFocusedUserIndex(_focusedUserIndex ?? 0);
  }, [_focusedUserIndex]);

  const {
    focusedIndex: _focusedChannelIndex,
    onKeyDown: onChannelFieldKeyDown,
  } = useSelectInputKeyboardShortcuts({
    // Need undefined in case of 0 items in order to reset the focused index after navigating
    data: channels,
    onEnter: useCallback(
      ({
        event,
        item,
      }: {
        event: KeyboardEvent;
        item: ApiChannel | undefined;
      }) => {
        event.preventDefault();
        if (!item) {
          return;
        }
        setFilters((prev) => ({ ...prev, channel: '/' + item.key }));
        setShowChannelSuggestions(false);
      },
      [],
    ),
  });

  useEffect(() => {
    setFocusedChannelIndex(_focusedChannelIndex ?? 0);
  }, [_focusedChannelIndex]);

  const renderUser = useCallback(
    ({ item }: { item: ApiUser }) => (
      <User
        user={item}
        compact
        hideFollowButton
        showFollowing
        className={cn(
          'cursor-pointer border-b-0 hover:bg-overlay-medium',
          item.fid === users[focusedUserIndex]?.fid && 'bg-overlay-medium',
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFilters((prev) => ({
            ...prev,
            from: '@' + item.username,
          }));
          setShowFromSuggestions(false);
        }}
      />
    ),
    [focusedUserIndex, users],
  );

  const renderChannel = useCallback(
    ({ item }: { item: ApiChannel }) => (
      <div
        className={cn(
          'flex w-full cursor-pointer flex-row items-center p-2 hover:bg-overlay-medium',
          item.key === channels[focusedChannelIndex]?.key &&
            'bg-overlay-medium',
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFilters((prev) => ({ ...prev, channel: '/' + item.key }));
          setShowChannelSuggestions(false);
        }}
      >
        <Image
          src={
            applyCloudflarePath(item.imageUrl, 48) || NFT_IMAGE_UNAVAILABLE_URL
          }
          className="aspect-square size-[48px] shrink-0 rounded-full border object-cover border-default"
          alt={`${item.name} image`}
          fallback={NFT_IMAGE_UNAVAILABLE_URL}
        />
        <div className="mx-2 flex shrink flex-col overflow-hidden">
          <div className="truncate break-words text-base font-semibold text-default">
            {item.name}
          </div>
          <div className="truncate break-words text-base text-faint">
            {item.description}
          </div>
        </div>
      </div>
    ),
    [channels, focusedChannelIndex],
  );

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div
          className="flex size-full flex-col items-center p-4"
          onClick={handleModalClick}
        >
          <div className="relative mt-[calc(50vh-180px)] flex w-full max-w-[500px] flex-col justify-center rounded-lg border p-4 bg-app border-default">
            <div className="absolute right-2 top-2">
              <DefaultCloseModalButton onClick={onClose} className="p-2" />
            </div>
            <div className="mb-6 text-2xl font-semibold">Advanced Search</div>

            <div className="mb-6 w-full">
              <label className="mb-2 block text-default">Filter by user</label>
              <SearchInput
                value={filters.from}
                onChange={(e) => {
                  setFilters({ ...filters, from: e.target.value });
                  setFocusedUserIndex(0);
                  setShowFromSuggestions(true);
                }}
                onClear={() => {
                  setFilters({ ...filters, from: '' });
                  setShowFromSuggestions(false);
                }}
                onFocus={() => {
                  setShowChannelSuggestions(false);
                  setShowFromSuggestions(true);
                }}
                placeholder="@vitalik.eth"
                className="!rounded-md border border-default"
                showSearchIcon={false}
                showClearIcon={false}
                onKeyDown={onUserFieldKeyDown}
              />
              {showFromSuggestions && filters.from && (
                <div className="relative bg-app">
                  <div className="scrollbar-hide absolute z-10 mt-2 max-h-[500px] w-full overflow-y-auto rounded-lg border bg-app border-default">
                    {isLoadingUsers ? (
                      <div className="flex h-20 items-center justify-center">
                        <LoadingIndicator />
                      </div>
                    ) : (
                      <FlatList
                        data={users}
                        renderItem={renderUser}
                        keyExtractor={userKeyExtractor}
                        emptyView={
                          <DefaultEmptyListView message="No users found" />
                        }
                        isFetchingNextPage={isFetchingNextUsers}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 w-full">
              <label className="mb-2 block text-default">
                Filter by channel
              </label>
              <SearchInput
                value={filters.channel}
                onChange={(e) => {
                  setFilters({ ...filters, channel: e.target.value });
                  setFocusedChannelIndex(0);
                  setShowChannelSuggestions(true);
                }}
                onClear={() => {
                  setFilters({ ...filters, channel: '' });
                  setShowChannelSuggestions(false);
                }}
                onFocus={() => {
                  setShowFromSuggestions(false);
                  setShowChannelSuggestions(true);
                }}
                placeholder="/memes"
                className="!rounded-md border border-default"
                showSearchIcon={false}
                showClearIcon={false}
                onKeyDown={onChannelFieldKeyDown}
              />
              {showChannelSuggestions && filters.channel && (
                <div className="relative bg-app">
                  <div className="scrollbar-hide absolute z-10 mt-2 max-h-[500px] w-full overflow-y-auto rounded-lg border bg-app border-default">
                    {isLoadingChannels ? (
                      <div className="flex h-20 items-center justify-center">
                        <LoadingIndicator />
                      </div>
                    ) : (
                      <FlatList
                        data={channels}
                        renderItem={renderChannel}
                        keyExtractor={channelKeyExtractor}
                        emptyView={
                          <DefaultEmptyListView message="No channels found" />
                        }
                        isFetchingNextPage={isFetchingNextChannels}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex w-full flex-row items-center justify-end">
              <DefaultButton onClick={handleApply}>Apply</DefaultButton>
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
};
