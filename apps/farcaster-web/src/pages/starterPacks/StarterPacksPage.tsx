import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useStarterPacks,
  useSuggestedStarterPacks,
} from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { StarterPackIcon } from '~/components/icons/StarterPackIcon';
import { LinkToProfileCasts } from '~/components/links/LinkToProfileCasts';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { StarterPacksModal } from '~/components/modals/StarterPacksModal';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const StarterPacksPage: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewStarterPacks, {});
  }, [trackEvent]);

  const [showCreateStarterPackModal, setShowCreateStarterPackModal] =
    React.useState<boolean>(false);

  const onCreateStarterPackClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressCreateStarterPackOnStarterPacks, {});

    setShowCreateStarterPackModal(true);
  }, [trackEvent]);

  const onCreateStarterPackModalClose = React.useCallback(() => {
    setShowCreateStarterPackModal(false);
  }, []);

  return (
    <Page meta={{ title: 'Starter Packs' }}>
      <BorderedMainContent>
        <div className="flex w-full items-center justify-between p-4">
          <span className="text-lg font-semibold">Starter Packs</span>
          <DefaultButton
            className={classNames(
              'h-min text-default',
              'flex w-fit flex-row items-center !justify-end gap-2 !font-semibold text-default',
            )}
            size="md"
            variant={'normal'}
            onClick={onCreateStarterPackClick}
          >
            Create a Starter Pack
          </DefaultButton>
        </div>
        <React.Suspense>
          <StarterPacks />
        </React.Suspense>
      </BorderedMainContent>
      {showCreateStarterPackModal && (
        <StarterPacksModal
          existingStarterPack={undefined}
          onClose={onCreateStarterPackModalClose}
        />
      )}
    </Page>
  );
});

StarterPacksPage.displayName = 'StarterPacksPage';
const SuggestedStarterPacksExpanded = React.memo(
  ({
    onBack,
    handleStarterPackClick,
  }: {
    onBack: () => void;
    handleStarterPackClick: (item: ApiStarterPack) => void;
  }) => {
    const { data, onEndReached, isFetchingNextPage } =
      useSuggestedStarterPacks();

    const suggestedStarterPacks = React.useMemo(() => {
      return data?.pages.flatMap((page) => page.result.starterPacks) || [];
    }, [data]);

    const renderItem = React.useCallback(
      ({ item }: { item: ApiStarterPack; index: number }) => {
        return (
          <StarterPackEntry
            item={item}
            handleStarterPackClick={handleStarterPackClick}
          />
        );
      },
      [handleStarterPackClick],
    );

    return (
      <div className="mx-4">
        <div className="my-2 flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Discover Starter Packs</div>

          <button type="button" onClick={onBack} className="text-link">
            Back
          </button>
        </div>

        <FlatList
          itemClassName="w-full cursor-pointer"
          data={suggestedStarterPacks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          emptyView={<LoadingIndicator />}
          isFetchingNextPage={isFetchingNextPage}
          onEndReached={onEndReached}
        />
      </div>
    );
  },
);

SuggestedStarterPacksExpanded.displayName = 'SuggestedStarterPacksExpanded';
function StarterPacks() {
  const { fid: currentUserFid } = useCurrentUser();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const { data, onEndReached, isFetchingNextPage } = useStarterPacks({
    fid: currentUserFid,
  });

  const { data: suggestedStarterPacksData } = useSuggestedStarterPacks();

  const [showAllSuggested, setShowAllSuggested] = useState(false);

  const starterPacks = React.useMemo(() => {
    return data.pages.flatMap((page) => page.result.starterPacks ?? []);
  }, [data.pages]);

  const suggestedStarterPacks: ApiStarterPack[] = useMemo(
    () =>
      (
        suggestedStarterPacksData?.pages.flatMap(
          (page) => page.result.starterPacks,
        ) || []
      ).slice(0, 3),
    [suggestedStarterPacksData],
  );

  const onStarterPackClick = React.useCallback(
    (item: ApiStarterPack) => {
      trackEvent(AnalyticsEvent.PressStarterPackOnStarterPacks, {
        name: item.name,
      });

      if (item.creator.username) {
        navigate({
          to: 'starterPackWithUsername',
          params: { username: item.creator.username, id: item.id },
        });
      }
    },
    [navigate, trackEvent],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ApiStarterPack; index: number }) => {
      return (
        <StarterPackEntry
          item={item}
          handleStarterPackClick={onStarterPackClick}
        />
      );
    },
    [onStarterPackClick],
  );

  const onShowMorePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressShowMoreOnStarterPacks, {});
    setShowAllSuggested(true);
  }, [trackEvent]);

  const onBackToMainPress = React.useCallback(() => {
    setShowAllSuggested(false);
  }, []);

  if (showAllSuggested) {
    return (
      <SuggestedStarterPacksExpanded
        onBack={onBackToMainPress}
        handleStarterPackClick={onStarterPackClick}
      />
    );
  }

  return (
    <div className="mx-4">
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="text-lg font-semibold">Discover Starter Packs</div>

        <button type="button" onClick={onShowMorePress} className="text-link">
          Show more
        </button>
      </div>

      <FlatList
        itemClassName="w-full cursor-pointer"
        data={suggestedStarterPacks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        emptyView={<></>}
        isFetchingNextPage={false}
      />

      <div className="mb-2 mt-4 text-lg font-semibold">Your Starter Packs</div>

      <FlatList
        itemClassName="w-full cursor-pointer"
        data={starterPacks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        emptyView={<LoadingIndicator />}
        isFetchingNextPage={isFetchingNextPage}
        onEndReached={onEndReached}
      />
    </div>
  );
}

const StarterPackEntry = ({
  item,
  handleStarterPackClick,
}: {
  item: ApiStarterPack;
  handleStarterPackClick: (item: ApiStarterPack) => void;
}) => {
  const userIsProUser = useUserLevel(item.creator) === 'pro';

  return (
    <div
      className={classNames(
        'mb-2 flex flex-col space-y-2 rounded-lg p-4 py-4 bg-surface-secondary',
      )}
      onClick={() => handleStarterPackClick(item)}
    >
      <div className="flex flex-row items-center space-x-2">
        <div className="flex size-[56px] items-center justify-center rounded-lg border bg-tertiary border-default">
          <StarterPackIcon size={32} className={'stroke-starter-pack-icon'} />
        </div>
        <div className="flex flex-col space-y-1">
          <div className="font-lg font-semibold text-default">{item.name}</div>
          <div className="flex flex-row items-center space-x-0.5 text-base font-medium text-muted">
            <div>by</div>
            <LinkToProfileCasts
              title="Starter pack creator"
              user={item.creator}
              className="flex flex-row items-center space-x-0.5 !text-muted hover:underline"
            >
              <Avatar size="xs" user={item.creator} />
              <div>
                {resolveUsernameShort({
                  username: item.creator.username,
                  fid: item.creator.fid,
                })}
              </div>
            </LinkToProfileCasts>
            {userIsProUser && <FarcasterProBadge size={18} />}
          </div>
        </div>
      </div>
      <div className="text-default">{item.description}</div>
    </div>
  );
};

export { StarterPacksPage };
