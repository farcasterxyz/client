import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack } from 'farcaster-client-data';
import { useStarterPacks } from 'farcaster-client-hooks';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { StarterPackIcon } from '~/components/icons/StarterPackIcon';
import { FlatList } from '~/components/lists/FlatList';
import { StarterPacksModal } from '~/components/modals/StarterPacksModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { SettingsNav } from '~/layouts/SettingsNav';

const SettingsStarterPacksPage = React.memo(() => {
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
    <Page meta={{ title: 'Starter Packs / Farcaster' }}>
      <div className="border-default sm:border-x">
        <PageHeader hideCastButton>
          <PageTitle>Settings</PageTitle>
        </PageHeader>
      </div>
      <BorderedMainContent className="flex flex-row">
        <SettingsNav />
        <SettingsPageContent>
          <div className="mb-4 flex flex-col">
            <span className="mb-2 font-semibold">Starter Packs</span>
            <div className="mb-4 text-muted">
              <p className="pb-3">
                Starter packs help your friends curate a community
              </p>
              <div className="font-semibold">
                <DefaultButton
                  className={classNames(
                    'h-min w-[96px] text-default',
                    'flex w-full flex-row items-center !justify-center gap-2 !rounded-lg !font-semibold text-default',
                  )}
                  size="md"
                  variant={'normal'}
                  onClick={onCreateStarterPackClick}
                >
                  Create Starter Pack
                </DefaultButton>
              </div>
            </div>
            <React.Suspense>
              <StarterPacks />
            </React.Suspense>
          </div>
        </SettingsPageContent>
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

SettingsStarterPacksPage.displayName = 'SettingsStarterPacksPage';

function StarterPacks() {
  const { fid: currentUserFid } = useCurrentUser();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const { data, onEndReached, isFetchingNextPage } = useStarterPacks({
    fid: currentUserFid,
  });

  const starterPacks = React.useMemo(() => {
    return data.pages.flatMap((page) => page.result.starterPacks);
  }, [data.pages]);

  const onStarterPackClick = React.useCallback(
    ({ item }: { item: ApiStarterPack }) => {
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
    ({ item, index }: { item: ApiStarterPack; index: number }) => {
      return (
        <div
          className={classNames(
            'flex flex-row items-center space-x-2 py-4',
            index !== 0 && ' border-t border-default',
          )}
          onClick={() => onStarterPackClick({ item })}
        >
          <div className="flex size-[56px] items-center justify-center rounded-lg border bg-tertiary border-default">
            <StarterPackIcon size={32} className={'stroke-starter-pack-icon'} />
          </div>
          <div className="flex flex-col space-y-1">
            <div className="font-lg text-default">{item.name}</div>
          </div>
        </div>
      );
    },
    [onStarterPackClick],
  );

  return (
    <div className="-mx-4 border-t border-default">
      <FlatList
        itemClassName="w-full cursor-pointer hover:bg-overlay-light px-4"
        data={starterPacks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        emptyView={<></>}
        isFetchingNextPage={isFetchingNextPage}
        onEndReached={onEndReached}
      />
    </div>
  );
}

export { SettingsStarterPacksPage };
