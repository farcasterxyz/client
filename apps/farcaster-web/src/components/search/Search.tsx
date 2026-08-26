import { PersonFillIcon, SearchIcon } from '@primer/octicons-react';
import * as Portal from '@radix-ui/react-portal';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChannel,
  ApiFrame,
  ApiTokenLink,
  ApiUser,
} from 'farcaster-client-data';
import {
  channelKeyExtractor,
  formatShorthandNumber,
  frameKeyExtractor,
  userKeyExtractor,
  useSearchSummary,
} from 'farcaster-client-hooks';
import {
  FC,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useLocation } from 'react-router-dom';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Form } from '~/components/forms/Form';
import { SearchInput } from '~/components/forms/SearchInput';
import { Image } from '~/components/images/Image';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOptionalMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';
import { useSelectInputKeyboardShortcuts } from '~/hooks/useSelectInputKeyboardShortcuts';
import { SearchTab } from '~/types';
import { applyCloudflarePath } from '~/utils/images';

type SearchProps = {
  className?: string;
  query?: string;
  focusedTab?: SearchTab;
  showFilterIcon?: boolean;
  showClearIcon?: boolean;
  autoFocus?: boolean;
};

function canUseCmd() {
  return (
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  );
}

const hotkeyMatcher = `${canUseCmd() ? 'meta' : 'ctrl'}+k`;

const Search: FC<SearchProps> = memo(
  ({
    className,
    query = '',
    focusedTab = 'top',
    showFilterIcon = false,
    showClearIcon = true,
    autoFocus = false,
  }) => {
    const { trackEvent } = useAnalytics();
    const location = useLocation();
    const navigate = useNavigate();
    const minimizableWindowContext = useOptionalMinimizableWindowContext();
    const launchMiniApp = minimizableWindowContext?.launchMiniApp;

    const navigateToProfile = useNavigateToProfile();
    const navigateToChannel = useNavigateToChannel();
    const [q, setQ] = useState(query);
    const [isFocused, setIsFocused] = useState(false);

    const trimmedQ = useMemo(() => q.trim(), [q]);

    // What is focused via keyboard navigation
    const [focusedKeyword, setFocusedKeyword] = useState(false);
    const [focusedUser, setFocusedUser] = useState<ApiUser | undefined>(
      undefined,
    );
    const [focusedUsersMoreLink, setFocusedUsersMoreLink] = useState(false);
    const [focusedChannel, setFocusedChannel] = useState<
      ApiChannel | undefined
    >(undefined);
    const [focusedChannelsMoreLink, setFocusedChannelsMoreLink] =
      useState(false);
    const [focusedToken, setFocusedToken] = useState<ApiTokenLink | undefined>(
      undefined,
    );
    const [focusedTokensMoreLink, setFocusedTokensMoreLink] = useState(false);
    const [focusedMiniApp, setFocusedMiniApp] = useState<ApiFrame | undefined>(
      undefined,
    );
    const [focusedMiniAppsMoreLink, setFocusedMiniAppsMoreLink] =
      useState(false);

    // Blur in order to close dropdown when navigating
    useEffect(() => {
      inputRef.current?.blur();
    }, [location]);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [searchResultsPosition, setSearchResultsPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });

    const updateSearchResultsPosition = useCallback(() => {
      if (!inputRef.current) {
        return;
      }
      const rect = inputRef.current.getBoundingClientRect();
      setSearchResultsPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }, []);

    useHotkeys(hotkeyMatcher, () => {
      inputRef.current?.focus();
    });

    const viewerFid = useCachedCurrentUser()?.fid;
    const { data } = useSearchSummary({
      q,
      maxChannels: 2,
      maxUsers: 4,
      maxMiniApps: 2,
      maxTokens: 3,
      contextFid: viewerFid,
    });

    const {
      channels,
      hasMoreChannels,
      users,
      hasMoreUsers,
      miniApps,
      hasMoreMiniApps,
      tokens,
    } = useMemo(() => {
      if (data?.result) {
        return {
          channels: data.result.channels,
          hasMoreChannels: data.result.hasMoreChannels,
          users: data.result.users,
          hasMoreUsers: data.result.hasMoreUsers,
          miniApps: data.result.miniApps,
          hasMoreMiniApps: data.result.hasMoreMiniApps,
          tokens: data.result.tokens,
        };
      } else {
        return {
          channels: undefined,
          hasMoreChannels: false,
          users: undefined,
          hasMoreUsers: false,
          miniApps: undefined,
          hasMoreMiniApps: false,
          tokens: undefined,
        };
      }
    }, [data]);

    const {
      usersStartIndex,
      miniAppsStartIndex,
      tokensStartIndex,
      channelsStartIndex,
      numListItems,
    } = useMemo(() => {
      const keywordCount = trimmedQ ? 1 : 0;
      const tokenCount = tokens?.length ?? 0;
      const tokensMoreCount = tokenCount > 0 ? 1 : 0;
      return {
        usersStartIndex: keywordCount,
        miniAppsStartIndex:
          keywordCount + (users?.length || 0) + (hasMoreUsers ? 1 : 0),
        tokensStartIndex:
          keywordCount +
          (users?.length || 0) +
          (hasMoreUsers ? 1 : 0) +
          (miniApps?.length || 0) +
          (hasMoreMiniApps ? 1 : 0),
        channelsStartIndex:
          keywordCount +
          (users?.length || 0) +
          (hasMoreUsers ? 1 : 0) +
          (miniApps?.length || 0) +
          (hasMoreMiniApps ? 1 : 0) +
          tokenCount +
          tokensMoreCount,
        // The number of total items in the list -> need it for keyboard nav
        numListItems:
          keywordCount +
          (users?.length || 0) +
          (hasMoreUsers ? 1 : 0) +
          (miniApps?.length || 0) +
          (hasMoreMiniApps ? 1 : 0) +
          tokenCount +
          tokensMoreCount +
          (channels?.length || 0) +
          (hasMoreChannels ? 1 : 0),
      };
    }, [
      users,
      hasMoreUsers,
      miniApps,
      hasMoreMiniApps,
      tokens,
      channels,
      hasMoreChannels,
      trimmedQ,
    ]);

    const goToTopSearch = useCallback(
      (query: string) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, {
          type: 'top-search',
        });
        navigate({
          to: 'top',
          searchParams: { q: query },
          params: {},
        });
      },
      [navigate, trackEvent],
    );

    const goToRecentSearch = useCallback(
      (query: string) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, {
          type: 'recent-search',
        });
        navigate({
          to: 'recent',
          searchParams: { q: query },
          params: {},
        });
      },
      [navigate, trackEvent],
    );

    const goToChannelsSearch = useCallback(
      (query: string) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, {
          type: 'channels-search',
        });
        navigate({
          to: 'searchChannels',
          searchParams: { q: query },
          params: {},
        });
      },
      [navigate, trackEvent],
    );

    const goToUsersSearch = useCallback(
      (query: string) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, {
          type: 'users-search',
        });
        navigate({
          to: 'searchUsers',
          searchParams: { q: query },
          params: {},
        });
      },
      [navigate, trackEvent],
    );

    const goToTokenSearch = useCallback(
      (query: string) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'token' });
        navigate({
          to: 'token',
          params: { ticker: query.startsWith('$') ? query.slice(1) : query },
        });
      },
      [navigate, trackEvent],
    );

    const goToToken = useCallback(
      (token: ApiTokenLink) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'token' });
        navigate({
          to: 'token',
          params: { ticker: token.ticker },
        });
      },
      [navigate, trackEvent],
    );

    const goToMiniAppsSearch = useCallback(
      (query: string) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, {
          type: 'miniapps-search',
        });
        navigate({
          to: 'searchMiniApps',
          searchParams: { q: query },
          params: {},
        });
      },
      [navigate, trackEvent],
    );
    const goToChannel = useCallback(
      (channel: ApiChannel) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'channel' });
        setQ('');
        navigateToChannel({ channelKey: channel.key });
      },
      [navigateToChannel, trackEvent],
    );

    const goToUser = useCallback(
      (user: ApiUser) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'user' });
        setQ('');
        navigateToProfile({ user });
      },
      [navigateToProfile, trackEvent],
    );

    const goToMiniApp = useCallback(
      (miniApp: ApiFrame) => {
        trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'miniapp' });
        setQ('');
        launchMiniApp?.({
          context: { type: 'launcher' },
          launchConfig: {
            type: 'standalone',
            name: miniApp.name || '',
            url: miniApp.homeUrl || '',
            splashImageUrl: miniApp.splashImageUrl || '',
            splashBackgroundColor: miniApp.splashBackgroundColor || '',
            author: miniApp.author,
          },
        });
      },
      [launchMiniApp, trackEvent],
    );

    const { focusedIndex, onKeyDown } = useSelectInputKeyboardShortcuts({
      // Need undefined in case of 0 items in order to reset the focused index after navigating
      data: numListItems ? [...Array(numListItems).keys()] : undefined,
      onEnter: useCallback(
        ({ event }: { event: KeyboardEvent }) => {
          event.preventDefault(); // We want to short-circuit form submission, so we don't navigate to the search results page
          if (focusedChannel) {
            goToChannel(focusedChannel);
          } else if (focusedChannelsMoreLink) {
            goToChannelsSearch(trimmedQ);
          } else if (focusedToken) {
            goToToken(focusedToken);
          } else if (focusedTokensMoreLink) {
            goToTokenSearch(
              trimmedQ.startsWith('$') ? trimmedQ : `$${trimmedQ}`,
            );
          } else if (focusedUser) {
            goToUser(focusedUser);
          } else if (focusedUsersMoreLink) {
            goToUsersSearch(trimmedQ);
          } else if (focusedMiniApp) {
            goToMiniApp(focusedMiniApp);
          } else if (focusedMiniAppsMoreLink) {
            goToMiniAppsSearch(trimmedQ);
          } else {
            // Keyword focused or nothing focused
            if (focusedTab === 'top') {
              goToTopSearch(trimmedQ);
            } else if (focusedTab === 'recent') {
              goToRecentSearch(trimmedQ);
            } else if (focusedTab === 'channels') {
              goToChannelsSearch(trimmedQ);
            } else if (focusedTab === 'users') {
              goToUsersSearch(trimmedQ);
            } else if (focusedTab === 'miniApps') {
              goToMiniAppsSearch(trimmedQ);
            } else {
              goToTopSearch(trimmedQ);
            }
          }
        },
        [
          focusedChannel,
          focusedChannelsMoreLink,
          focusedToken,
          focusedTokensMoreLink,
          focusedUser,
          focusedUsersMoreLink,
          focusedMiniApp,
          focusedMiniAppsMoreLink,
          goToChannel,
          goToChannelsSearch,
          goToToken,
          goToTokenSearch,
          trimmedQ,
          goToUser,
          goToUsersSearch,
          goToMiniApp,
          goToMiniAppsSearch,
          focusedTab,
          goToTopSearch,
          goToRecentSearch,
        ],
      ),
    });

    // Determine what is focused based on keyboard navigation
    // Doing it here in a single function, otherwise if we just pass focusedIndex to the child
    // both the child will need to do this to determine highlighting and useSelectInputKeyboardShortcuts
    // above will need to do it again for onEnter
    useEffect(() => {
      let focusUsersMoreLink: boolean = false;
      let focusUser: ApiUser | undefined = undefined;
      let focusChannelsMoreLink: boolean = false;
      let focusChannel: ApiChannel | undefined = undefined;
      let focusTokensMoreLink: boolean = false;
      let focusToken: ApiTokenLink | undefined = undefined;
      let focusMiniAppsMoreLink: boolean = false;
      let focusMiniApp: ApiFrame | undefined = undefined;
      let focusKeyword: boolean = false;

      if (
        channels &&
        hasMoreChannels &&
        focusedIndex === channelsStartIndex + channels.length
      ) {
        focusChannelsMoreLink = true;
      } else if (channels && focusedIndex >= channelsStartIndex) {
        focusChannel = channels[focusedIndex - channelsStartIndex];
      } else if (
        tokens &&
        tokens.length > 0 &&
        focusedIndex === tokensStartIndex + tokens.length
      ) {
        focusTokensMoreLink = true;
      } else if (tokens && focusedIndex >= tokensStartIndex) {
        focusToken = tokens[focusedIndex - tokensStartIndex];
      } else if (
        miniApps &&
        hasMoreMiniApps &&
        focusedIndex === miniAppsStartIndex + miniApps.length
      ) {
        focusMiniAppsMoreLink = true;
      } else if (miniApps && focusedIndex >= miniAppsStartIndex) {
        focusMiniApp = miniApps[focusedIndex - miniAppsStartIndex];
      } else if (
        users &&
        hasMoreUsers &&
        focusedIndex === usersStartIndex + users.length
      ) {
        focusUsersMoreLink = true;
      } else if (users && focusedIndex >= usersStartIndex) {
        focusUser = users[focusedIndex - usersStartIndex];
      } else if (focusedIndex === 0) {
        focusKeyword = true;
      }

      setFocusedUsersMoreLink(focusUsersMoreLink);
      setFocusedUser(focusUser);
      setFocusedChannelsMoreLink(focusChannelsMoreLink);
      setFocusedChannel(focusChannel);
      setFocusedTokensMoreLink(focusTokensMoreLink);
      setFocusedToken(focusToken);
      setFocusedMiniAppsMoreLink(focusMiniAppsMoreLink);
      setFocusedMiniApp(focusMiniApp);
      setFocusedKeyword(focusKeyword);
    }, [
      focusedIndex,
      users,
      usersStartIndex,
      miniAppsStartIndex,
      tokensStartIndex,
      channelsStartIndex,
      channels,
      tokens,
      miniApps,
      hasMoreUsers,
      hasMoreMiniApps,
      hasMoreChannels,
    ]);

    const showSearchResults = Boolean(trimmedQ && isFocused);

    useLayoutEffect(() => {
      if (!showSearchResults) {
        return;
      }
      updateSearchResultsPosition();
    }, [showSearchResults, trimmedQ, updateSearchResultsPosition]);

    useEffect(() => {
      if (!showSearchResults) {
        return;
      }

      const onScrollOrResize = () => {
        updateSearchResultsPosition();
      };

      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize);

      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
      };
    }, [showSearchResults, updateSearchResultsPosition]);

    return (
      <div className="w-full">
        <Form
          className={cn('', className)}
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmedQ) {
              if (focusedTab === 'top') {
                goToTopSearch(trimmedQ);
              } else if (focusedTab === 'recent') {
                goToRecentSearch(trimmedQ);
              } else if (focusedTab === 'channels') {
                goToChannelsSearch(trimmedQ);
              } else if (focusedTab === 'users') {
                goToUsersSearch(trimmedQ);
              } else if (focusedTab === 'miniApps') {
                goToMiniAppsSearch(trimmedQ);
              } else {
                goToTopSearch(trimmedQ);
              }
            }
          }}
        >
          <SearchInput
            className={cn('!rounded-md border !border-surface-secondary')}
            ref={inputRef}
            value={q}
            maxLength={64}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            onClear={() => {
              setQ('');
            }}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            showModSelectorHint={true}
            showFilterIcon={showFilterIcon}
            showClearIcon={showClearIcon}
          />
          {showSearchResults && (
            <Portal.Root>
              <div
                className="z-100 fixed max-h-[min(calc(100vh-16px),920px)]"
                style={{
                  top: searchResultsPosition.top,
                  left: searchResultsPosition.left,
                  width: searchResultsPosition.width,
                }}
              >
                <SearchResults
                  query={trimmedQ}
                  channels={channels}
                  hasMoreChannels={hasMoreChannels}
                  users={users}
                  hasMoreUsers={hasMoreUsers}
                  miniApps={miniApps}
                  hasMoreMiniApps={hasMoreMiniApps}
                  tokens={tokens}
                  focusedKeyword={focusedKeyword}
                  focusedChannel={focusedChannel}
                  focusedChannelsMoreLink={focusedChannelsMoreLink}
                  focusedToken={focusedToken}
                  focusedTokensMoreLink={focusedTokensMoreLink}
                  focusedUser={focusedUser}
                  focusedUsersMoreLink={focusedUsersMoreLink}
                  focusedMiniApp={focusedMiniApp}
                  focusedMiniAppsMoreLink={focusedMiniAppsMoreLink}
                  goToTopSearch={goToTopSearch}
                  goToChannelsSearch={goToChannelsSearch}
                  goToUsersSearch={goToUsersSearch}
                  goToMiniAppsSearch={goToMiniAppsSearch}
                  goToChannel={goToChannel}
                  goToUser={goToUser}
                  goToMiniApp={goToMiniApp}
                  goToToken={goToToken}
                  focusedTab={focusedTab}
                  goToRecentSearch={goToRecentSearch}
                  goToTokenSearch={goToTokenSearch}
                />
              </div>
            </Portal.Root>
          )}
        </Form>
      </div>
    );
  },
);

Search.displayName = 'Search';

type SearchResultsProps = {
  query: string;
  channels: ApiChannel[] | undefined;
  hasMoreChannels: boolean;
  users: ApiUser[] | undefined;
  hasMoreUsers: boolean;
  miniApps: ApiFrame[] | undefined;
  hasMoreMiniApps: boolean;
  tokens: ApiTokenLink[] | undefined;
  focusedTab: SearchTab | undefined;
  focusedKeyword: boolean;
  focusedChannel: ApiChannel | undefined;
  focusedChannelsMoreLink: boolean;
  focusedToken: ApiTokenLink | undefined;
  focusedTokensMoreLink: boolean;
  focusedUser: ApiUser | undefined;
  focusedUsersMoreLink: boolean;
  focusedMiniApp: ApiFrame | undefined;
  focusedMiniAppsMoreLink: boolean;
  goToTopSearch: (q: string) => void;
  goToChannelsSearch: (q: string) => void;
  goToUsersSearch: (q: string) => void;
  goToMiniAppsSearch: (q: string) => void;
  goToChannel: (channel: ApiChannel) => void;
  goToUser: (user: ApiUser) => void;
  goToMiniApp: (miniApp: ApiFrame) => void;
  goToToken: (token: ApiTokenLink) => void;
  goToRecentSearch: (q: string) => void;
  goToTokenSearch: (q: string) => void;
};

const SearchResults: FC<SearchResultsProps> = memo(
  ({
    query,
    channels,
    hasMoreChannels,
    users,
    hasMoreUsers,
    miniApps,
    hasMoreMiniApps,
    tokens,
    focusedKeyword,
    focusedChannel,
    focusedChannelsMoreLink,
    focusedToken,
    focusedTokensMoreLink,
    focusedUser,
    focusedUsersMoreLink,
    focusedMiniApp,
    focusedMiniAppsMoreLink,
    goToTopSearch,
    goToChannelsSearch,
    goToUsersSearch,
    goToMiniAppsSearch,
    goToChannel,
    goToUser,
    goToMiniApp,
    goToToken,
    focusedTab,
    goToRecentSearch,
    goToTokenSearch,
  }) => {
    const renderChannel = useCallback(
      ({ item }: { item: ApiChannel }) => {
        return (
          <div
            className={cn(
              'flex w-full cursor-pointer flex-row items-center p-2 hover:bg-overlay-medium',
              item.key === focusedChannel?.key && 'bg-overlay-medium',
            )}
            onClick={(e) => {
              e.preventDefault();
              goToChannel(item);
            }}
          >
            <Image
              src={
                applyCloudflarePath(item.imageUrl, 48) ||
                NFT_IMAGE_UNAVAILABLE_URL
              }
              className="aspect-square size-12 shrink-0 rounded-full border object-cover border-surface-secondary"
              alt={`${item.name} image`}
              fallback={NFT_IMAGE_UNAVAILABLE_URL}
            />
            <div className="mx-2 flex shrink flex-col overflow-hidden">
              <div className="truncate break-words text-base font-semibold text-default">
                {'/' + item.key}
              </div>
              {item.followerCount !== undefined && (
                <div className="flex flex-row items-center space-x-1">
                  <PersonFillIcon size={12} className="text-faint" />
                  <div className="text-sm text-faint">
                    {formatShorthandNumber(item.followerCount)} followers
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
      [focusedChannel, goToChannel],
    );

    const renderUser = useCallback(
      ({ item }: { item: ApiUser }) => {
        return (
          <User
            user={item}
            compact
            hideFollowButton
            showFollowing
            className={cn(
              'cursor-pointer border-b-0 hover:bg-overlay-medium',
              item.fid === focusedUser?.fid && 'bg-overlay-medium',
            )}
            onClick={(e) => {
              e.preventDefault();
              goToUser(item);
            }}
          />
        );
      },
      [focusedUser, goToUser],
    );

    const renderMiniApp = useCallback(
      ({ item }: { item: ApiFrame }) => {
        return (
          <div
            className={cn(
              'flex w-full cursor-pointer flex-row items-center p-2 hover:bg-overlay-medium',
              item.domain === focusedMiniApp?.domain && 'bg-overlay-medium',
            )}
            onClick={(e) => {
              e.preventDefault();
              goToMiniApp(item);
            }}
          >
            <Image
              src={
                applyCloudflarePath(item.iconUrl, 48) ||
                NFT_IMAGE_UNAVAILABLE_URL
              }
              className="aspect-square size-12 shrink-0 rounded-full border object-cover border-surface-secondary"
              alt={`${item.name} icon`}
              fallback={NFT_IMAGE_UNAVAILABLE_URL}
            />
            <div className="mx-2 flex shrink flex-col overflow-hidden">
              <div className="truncate break-words text-base font-semibold text-default">
                {item.name}
              </div>
              {item.author && (
                <div className="flex flex-row items-center space-x-1">
                  <div className="text-sm text-faint">
                    by {item.author.username || `@${item.author.fid}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
      [focusedMiniApp, goToMiniApp],
    );

    return (
      <div
        className="scrollbar-hide max-h-[inherit] w-full overflow-y-auto rounded-lg border shadow-lg bg-app border-surface-secondary"
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <div className={cn(focusedKeyword && 'bg-overlay-medium')}>
          <div
            onClick={() => {
              if (query.startsWith('$')) {
                goToTokenSearch(query);
              } else if (focusedTab === 'top') {
                goToTopSearch(query);
              } else if (focusedTab === 'recent') {
                goToRecentSearch(query);
              } else if (focusedTab === 'channels') {
                goToChannelsSearch(query);
              } else if (focusedTab === 'users') {
                goToUsersSearch(query);
              } else if (focusedTab === 'miniApps') {
                goToMiniAppsSearch(query);
              } else {
                goToTopSearch(query);
              }
            }}
            className="relative flex cursor-pointer flex-row items-center justify-between px-2 py-4 hover:bg-overlay-medium"
          >
            <div className="flex flex-row items-center">
              <SearchIcon
                className="mr-2 w-12"
                verticalAlign="middle"
                size={20}
              />
              <span className="max-w-[250px] truncate font-semibold">
                {query}
              </span>
            </div>
          </div>
        </div>
        {!users && !channels && !miniApps && !tokens && (
          <div className="flex w-full items-center justify-center p-4">
            <LoadingIndicator />
          </div>
        )}
        {users && users.length ? (
          <div className="border-t border-faint">
            <div className="p-2 text-xs">Users</div>
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={userKeyExtractor}
              emptyView={
                <DefaultEmptyListView
                  className="mt-1 rounded-lg border text-sm border-surface-secondary"
                  message="No users match your query"
                />
              }
            />
            {hasMoreUsers && (
              <div
                onClick={() => goToUsersSearch(query)}
                className={cn(
                  'cursor-pointer p-3 text-xs text-faint hover:bg-overlay-medium',
                  focusedUsersMoreLink && 'bg-overlay-medium',
                )}
              >
                Show more users
              </div>
            )}
          </div>
        ) : null}
        {miniApps && miniApps.length ? (
          <div
            className={cn(
              'border-t border-faint',
              !hasMoreMiniApps && (users || channels) ? 'pb-1' : '',
            )}
          >
            <div className="p-2 text-xs">Mini Apps</div>
            <FlatList
              data={miniApps}
              renderItem={renderMiniApp}
              keyExtractor={frameKeyExtractor}
              emptyView={
                <DefaultEmptyListView
                  className="mt-1 rounded-lg border text-sm border-surface-secondary"
                  message="No mini apps found"
                />
              }
            />
            {hasMoreMiniApps && (
              <div
                onClick={() => goToMiniAppsSearch(query)}
                className={cn(
                  'cursor-pointer p-3 text-xs text-faint hover:bg-overlay-medium',
                  focusedMiniAppsMoreLink && 'bg-overlay-medium',
                )}
              >
                Show more mini apps
              </div>
            )}
          </div>
        ) : null}
        {tokens && tokens.length ? (
          <div className="border-t border-faint">
            <div className="p-2 text-xs">Tokens</div>
            {tokens.map((token) => {
              const isFocused =
                focusedToken &&
                token.chain === focusedToken.chain &&
                token.ca === focusedToken.ca;
              return (
                <div
                  key={`${token.chain}:${token.ca}`}
                  className={cn(
                    'flex w-full cursor-pointer flex-row items-center p-2 hover:bg-overlay-medium',
                    isFocused && 'bg-overlay-medium',
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    goToToken(token);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToToken(token);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <TokenIcon
                    iconUrl={token.imageUrl}
                    symbol={token.ticker}
                    diameter={40}
                    chain={token.chain}
                    chainImageSize={14}
                    imageBordered
                  />
                  <div className="ml-2 flex flex-1 flex-row items-center justify-between">
                    <div className="flex flex-col">
                      <div className="font-semibold text-default">
                        {token.ticker}
                      </div>
                      {typeof token.holderCount !== 'undefined' &&
                        token.holderCount !== 0 && (
                          <div className="text-sm text-faint">
                            {token.holderCount.toLocaleString()} holders
                          </div>
                        )}
                    </div>
                    {typeof token.marketCap !== 'undefined' && (
                      <div className="text-sm text-default">
                        ${formatShorthandNumber(token.marketCap)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div
              onClick={() => goToTokenSearch(query)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goToTokenSearch(query.startsWith('$') ? query : `$${query}`);
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                'cursor-pointer p-3 text-xs text-faint hover:bg-overlay-medium',
                focusedTokensMoreLink && 'bg-overlay-medium',
              )}
            >
              Show more tokens
            </div>
          </div>
        ) : null}
        {channels && channels.length ? (
          <div
            className={cn(
              'border-t border-faint',
              !hasMoreChannels && (users || miniApps || tokens) ? 'pb-1' : '',
            )}
          >
            <div className="p-2 text-xs">Channels</div>
            <FlatList
              data={channels}
              renderItem={renderChannel}
              keyExtractor={channelKeyExtractor}
              emptyView={
                <DefaultEmptyListView
                  className="mt-1 rounded-lg border text-sm border-surface-secondary"
                  message="No channels found"
                />
              }
            />
            {hasMoreChannels && (
              <div
                onClick={() => goToChannelsSearch(query)}
                className={cn(
                  'cursor-pointer p-3 text-xs text-faint hover:bg-overlay-medium',
                  focusedChannelsMoreLink && 'bg-overlay-medium',
                )}
              >
                Show more channels
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  },
);

SearchResults.displayName = 'SearchResults';

export { Search };
