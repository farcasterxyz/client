import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useSuggestedStarterPacks,
} from 'farcaster-client-hooks';
import React from 'react';

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
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const SuggestedStarterPacksPage: React.FC = React.memo(() => {
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
        <PageHeader
          hideCastButton={true}
          renderAlternateActionButton={() => (
            <DefaultButton
              className={classNames(
                'h-min w-[96px] text-default',
                'flex w-full flex-row items-center !justify-center gap-2 !rounded-lg !font-semibold text-default',
              )}
              size="md"
              variant={'normal'}
              onClick={onCreateStarterPackClick}
            >
              Create a Starter Pack
            </DefaultButton>
          )}
        >
          <PageTitle>Discover Starter Packs</PageTitle>
        </PageHeader>
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

SuggestedStarterPacksPage.displayName = 'SuggestedStarterPacksPage';

function StarterPacks() {
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const { data, onEndReached, isFetchingNextPage } = useSuggestedStarterPacks();

  const starterPacks = React.useMemo(() => {
    return data.pages.flatMap((page) => page.result.starterPacks);
  }, [data.pages]);

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

      // TODO: Add the handler for non-username path later
    },
    [navigate, trackEvent],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ApiStarterPack; index: number }) => {
      return (
        <StarterPackEntry item={item} onStarterPackClick={onStarterPackClick} />
      );
    },
    [onStarterPackClick],
  );

  return (
    <div className="mx-4 mt-4">
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
  onStarterPackClick,
}: {
  item: ApiStarterPack;
  onStarterPackClick: (item: ApiStarterPack) => void;
}) => {
  const userIsProUser = useUserLevel(item.creator) === 'pro';

  return (
    <div
      className={classNames(
        'py-4] mb-2 flex flex-col space-y-2 rounded-lg p-4 bg-surface-secondary',
      )}
      onClick={() => onStarterPackClick(item)}
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
            {userIsProUser && <FarcasterProBadge size={18} className="mb-1" />}
          </div>
        </div>
      </div>
      <div className="text-default">{item.description}</div>
    </div>
  );
};

export { SuggestedStarterPacksPage };
