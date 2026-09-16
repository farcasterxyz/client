import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  GearIcon,
  PlusIcon,
  StarFillIcon,
  StarIcon,
} from '@primer/octicons-react';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  useAddFavoriteFeed,
  useNonSuspenseFeedSummaries,
  useRemoveFavoriteFeed,
  useSetFavoriteFeedPosition,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Divider } from '~/components/Divider';
import { Image } from '~/components/images/Image';
import { NavLink } from '~/components/links/NavLink';
import { NavLinkIcon } from '~/components/links/NavLinkIcon';
import { NavLinkLabel } from '~/components/links/NavLinkLabel';
import { FlatList } from '~/components/lists/FlatList';
import { CreateChannelModal } from '~/components/modals/CreateChannelModal';
import { ChannelsNavSection } from '~/components/sidebar/ChannelsNavSection';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useOptimisticallyPrefetchFeed } from '~/hooks/data/useOptimisticallyPrefetchFeed';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { applyCloudflarePath } from '~/utils/images';

function generateChannels({ data }: { data?: ApiChannel[] }): {
  favoriteChannels: ApiChannel[];
  activeChannels: ApiChannel[];
  allChannels: ApiChannel[];
} {
  const channels =
    data
      // FIXME: This is not going to work well, we need a "channel" only endpoint.
      ?.filter((channel) => channel.type === 'channel')
      .map((channel) => {
        // For the list of channels to re-render it seems we have to regenerate all items
        const newChannel = {
          ...channel,
        };

        return newChannel;
      }) || [];

  const favoriteChannels = [];
  const activeChannels = [];
  const allChannels = [];
  for (const channel of channels) {
    if (
      typeof channel.viewerContext.favoritePosition !== 'undefined' &&
      channel.viewerContext.favoritePosition > -1
    ) {
      favoriteChannels.push(channel);
    } else if (channel.viewerContext.activityRank !== undefined) {
      activeChannels.push(channel);
    }

    allChannels.push(channel);
  }

  favoriteChannels.sort((a, b) => {
    return (
      a.viewerContext.favoritePosition! - b.viewerContext.favoritePosition!
    );
  });
  activeChannels.sort((a, b) => {
    return a.viewerContext.activityRank! - b.viewerContext.activityRank!;
  });
  activeChannels.splice(5, 100);
  allChannels.sort((a, b) => {
    return a.key < b.key ? -1 : 1;
  });

  return { favoriteChannels, activeChannels, allChannels };
}

const ChannelNavLinksContent: FC = () => {
  const currentUser = useCachedCurrentUser();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const addFavoriteFeed = useAddFavoriteFeed();
  const removeFavoriteFeed = useRemoveFavoriteFeed();
  const setFavoriteFeedPosition = useSetFavoriteFeedPosition();
  const { data: userPreferences } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();

  const [expandFavoriteFeeds, setExpandFavoriteFeeds] = useState(
    !(userPreferences?.result.preferences.expandFavoriteFeeds === false),
  );
  const [expandActiveFeeds, setExpandActiveFeeds] = useState(
    !(userPreferences?.result.preferences.expandActiveFeeds === false),
  );
  const [expandAllFeeds, setExpandAllFeeds] = useState(
    !(userPreferences?.result.preferences.expandAllFeeds === false),
  );
  const [creationModalShowing, setCreationModalShowing] = useState(false);

  const updateExpandFavoriteFeeds = useCallback(
    (expand: boolean) => {
      setExpandFavoriteFeeds(expand);
      setUserPreferences({ preferences: { expandFavoriteFeeds: expand } });
    },
    [setUserPreferences],
  );
  const updateExpandActiveFeeds = useCallback(
    (expand: boolean) => {
      setExpandActiveFeeds(expand);
      setUserPreferences({ preferences: { expandActiveFeeds: expand } });
    },
    [setUserPreferences],
  );
  const updateExpandAllFeeds = useCallback(
    (expand: boolean) => {
      setExpandAllFeeds(expand);
      setUserPreferences({ preferences: { expandAllFeeds: expand } });
    },
    [setUserPreferences],
  );

  const onManageChannelsClick = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickManageChannelsOnNav, {});

    navigate({
      to: 'manageChannelsCategory',
      params: { category: 'moderate' },
    });
  }, [navigate, trackEvent]);

  const { data } = useNonSuspenseFeedSummaries();

  // We compute both favorite and others channels at the same time, but want to be able to override the
  // favorite channels for drag and drop, so we set a variable that's always updated (favoriteChannelsAuto),
  // and use it to set the initial state and update favoriteChannels on change, but since
  // favoriteChannels is a state, we can also override it while favoriteChannelsAuto
  // hasn't changed
  const {
    favoriteChannels: favoriteChannelsAuto,
    activeChannels,
    allChannels,
  } = useMemo(() => {
    return generateChannels({ data });
  }, [data]);

  const [favoriteChannels, setFavoriteChannels] =
    useState<ApiChannel[]>(favoriteChannelsAuto);

  useEffect(() => {
    setFavoriteChannels(favoriteChannelsAuto);
  }, [favoriteChannelsAuto]);

  const optimisticallyPrefetchChannelFeed = useOptimisticallyPrefetchFeed();

  const onMouseOver = useCallback(
    ({ key }: { key: string }) => {
      optimisticallyPrefetchChannelFeed({ feedKey: key });
    },
    [optimisticallyPrefetchChannelFeed],
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiChannel }) => {
      const { key, name, imageUrl } = item;
      const src = imageUrl || NFT_IMAGE_UNAVAILABLE_URL;
      return (
        <NavLink
          key={key}
          to={'channel'}
          params={{ channelKey: key }}
          searchParams={{}}
          title={name}
          className="group"
          onMouseOver={() => {
            onMouseOver({ key });
          }}
          style="channel"
        >
          <NavLinkIcon>
            <Image
              src={applyCloudflarePath(src, 20)}
              className="aspect-square size-[20px] shrink-0 rounded-full object-cover"
              alt={`${name} image`}
              fallback={NFT_IMAGE_UNAVAILABLE_URL}
            />
          </NavLinkIcon>
          <NavLinkLabel>{key}</NavLinkLabel>
          <div className="hidden group-hover:xl:flex">
            <span
              className="size-[22px] items-center justify-center rounded-md hover:bg-overlay-medium xl:flex"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  item.viewerContext.favoritePosition !== undefined &&
                  item.viewerContext.favoritePosition > -1
                ) {
                  removeFavoriteFeed({
                    feedKey: item.key,
                    favoritePosition: item.viewerContext.favoritePosition,
                    channel: item,
                    fid: currentUser!.fid,
                  });
                } else {
                  addFavoriteFeed({
                    feedKey: item.key,
                    channel: item,
                    fid: currentUser!.fid,
                  });
                }
              }}
            >
              {item.viewerContext.favoritePosition !== undefined &&
              item.viewerContext.favoritePosition > -1 ? (
                <StarFillIcon size={14} />
              ) : (
                <StarIcon size={14} />
              )}
            </span>
          </div>
        </NavLink>
      );
    },
    [addFavoriteFeed, currentUser, onMouseOver, removeFavoriteFeed],
  );

  const hasPinnedChannels = useMemo(() => {
    return favoriteChannels.length !== 0;
  }, [favoriteChannels.length]);

  if (typeof currentUser === 'undefined') {
    return null;
  }

  if (allChannels.length === 0) {
    return null;
  }

  // For flex cells to grow and shrink they need a starting size (basis) and then grow/shrink
  return (
    <>
      <div>
        <Divider slim={true} />
      </div>
      <div
        className={cn(
          'only-on-hover-scrollbar !mt-3 flex shrink grow basis-[100px] flex-col gap-3 overflow-y-scroll',
        )}
      >
        {hasPinnedChannels && (
          <ChannelsNavSection
            name="Favorites"
            isFirst={true}
            expanded={expandFavoriteFeeds}
            onSetExpanded={updateExpandFavoriteFeeds}
          >
            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) {
                  return;
                }

                // Translate pinned position (which includes built-in feeds we don't show here) to list index
                const srcIndex = favoriteChannels.findIndex(
                  (item) =>
                    item.viewerContext.favoritePosition === result.source.index,
                );
                const destIndex = favoriteChannels.findIndex(
                  (item) =>
                    item.viewerContext.favoritePosition ===
                    result.destination?.index,
                );

                const newItems = [...favoriteChannels];
                const [item] = newItems.splice(srcIndex, 1);
                newItems.splice(destIndex, 0, item);

                setFavoriteChannels(newItems);
                setFavoriteFeedPosition({
                  feedKey: item.key,
                  position: result.destination.index,
                });
              }}
            >
              <Droppable droppableId="favorites">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {favoriteChannels.map((item) => {
                      // We have to use the pinned position since we don't show non-channel feeds which the user
                      // may have pinned on the mobile app. Without it, reordering makes a mess
                      if (
                        item.viewerContext.favoritePosition !== undefined &&
                        item.viewerContext.favoritePosition > -1
                      ) {
                        return (
                          <Draggable
                            key={item.key}
                            draggableId={item.key}
                            index={item.viewerContext.favoritePosition}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {renderItem({ item })}
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ChannelsNavSection>
        )}
        {activeChannels.length > 0 && (
          <ChannelsNavSection
            name="Recent"
            isFirst={!hasPinnedChannels}
            expanded={expandActiveFeeds}
            onSetExpanded={updateExpandActiveFeeds}
          >
            <FlatList
              data={activeChannels}
              renderItem={renderItem}
              keyExtractor={channelKeyExtractor}
              emptyView={<></>}
            />
          </ChannelsNavSection>
        )}
        <ChannelsNavSection
          name="All"
          isFirst={!hasPinnedChannels && allChannels.length === 0}
          expanded={expandAllFeeds}
          onSetExpanded={updateExpandAllFeeds}
        >
          <FlatList
            data={allChannels}
            renderItem={renderItem}
            keyExtractor={channelKeyExtractor}
            emptyView={<></>}
          />
        </ChannelsNavSection>
      </div>
      <div>
        <Divider slim={true} />
      </div>
      <div
        className="flex cursor-pointer flex-row items-center justify-center rounded-md py-1 pl-[4px] hover:bg-overlay-faint xl:justify-start xl:pl-2"
        onClick={onManageChannelsClick}
      >
        <span className="flex size-[20px] items-center justify-center rounded-full border xl:mr-2">
          <GearIcon className="text-default" size={12} />
        </span>
        <span className="hidden overflow-hidden xl:block">Manage channels</span>
      </div>
      <div
        className="!mb-6 flex cursor-pointer flex-row items-center justify-center rounded-md py-1 pl-[4px] hover:bg-overlay-faint xl:justify-start xl:pl-2"
        onClick={() => setCreationModalShowing(true)}
      >
        <span className="flex size-[20px] items-center justify-center rounded-full border xl:mr-2">
          <PlusIcon className="text-default" size={12} />
        </span>
        <span className="hidden overflow-hidden xl:block">
          Create a channel
        </span>
      </div>
      {creationModalShowing && (
        <CreateChannelModal onClose={() => setCreationModalShowing(false)} />
      )}
    </>
  );
};

ChannelNavLinksContent.displayName = 'ChannelNavLinksContent';

const ChannelNavLinks: FC = memo(() => {
  return <ChannelNavLinksContent />;
});

ChannelNavLinks.displayName = 'ChannelNavLinks';

export { ChannelNavLinks };
