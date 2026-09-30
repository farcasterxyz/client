import { CheckIcon, ShareIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiStarterPack,
  ApiStarterPackAccountItem,
  ApiUser,
} from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useFollowAllStarterPackUsers,
  useStarterPack,
  useStarterPackFeed,
  useStarterPackUsers,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { StarterPackIcon } from '~/components/icons/StarterPackIcon';
import { Image } from '~/components/images/Image';
import { LinkToProfileCasts } from '~/components/links/LinkToProfileCasts';
import { FlatList } from '~/components/lists/FlatList';
import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { Page } from '~/components/page/Page';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useParams } from '~/hooks/navigation/useParams';
import { ApiCastWithContext, StarterPackTab } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';
import { toast } from '~/utils/toast';

import { StarterPackPageHeader } from './StarterPackPageHeader';

const StarterPackPage = React.memo(() => {
  const isSignedIn = useIsSignedIn();

  const { trackEvent } = useAnalytics();

  const { id: starterPackId } = useParams('starterPack');

  const { data } = useStarterPack({ id: starterPackId });

  const starterPack = React.useMemo(() => {
    return data.starterPack;
  }, [data.starterPack]);

  const starterPackDeeplinkUri = `farcaster://${starterPack.creator.username}/pack/${starterPack.id}`;
  const starterPackUrl = `https://farcaster.xyz/${starterPack.creator.username}/pack/${starterPack.id}`;

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewStarterPack, {
      starterPackId,
      starterPackName: starterPack.name,
      isSignedIn,
    });
  }, [isSignedIn, starterPack.name, starterPackId, trackEvent]);

  const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
    React.useState<boolean>(false);

  const externalNavigate = useExternalNavigate();

  const userIsLikelyOnMobile = React.useMemo(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
  }, []);

  const onClickOpenWarpcast = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      trackEvent(AnalyticsEvent.ClickOpenWarpcastStarterPack, {
        starterPackName: starterPack.name,
      });

      e.preventDefault();
      e.stopPropagation();

      const to = userIsLikelyOnMobile ? starterPackDeeplinkUri : starterPackUrl;

      externalNavigate({
        to: to,
        openInNewTab: true,
      });
    },
    [
      externalNavigate,
      starterPack.name,
      starterPackDeeplinkUri,
      starterPackUrl,
      trackEvent,
      userIsLikelyOnMobile,
    ],
  );

  // Build SEO metadata for starter pack (consistent with SSR StarterPackHead)
  const starterPackDescription = React.useMemo(() => {
    const memberCount = starterPack.itemCount || 0;
    const baseText =
      memberCount > 0
        ? `Follow ${memberCount} accounts curated by @${starterPack.creator.username}.`
        : `Accounts curated by @${starterPack.creator.username}.`;
    return starterPack.description
      ? `${baseText} ${starterPack.description}`
      : `${baseText} Get started on Farcaster with this collection.`;
  }, [
    starterPack.description,
    starterPack.creator.username,
    starterPack.itemCount,
  ]);

  const starterPackCanonical = React.useMemo(() => {
    return `https://farcaster.xyz/${starterPack.creator.username}/pack/${starterPack.id}`;
  }, [starterPack.creator.username, starterPack.id]);

  const starterPackAuthor = React.useMemo(() => {
    return starterPack.creator.username
      ? `@${starterPack.creator.username}`
      : undefined;
  }, [starterPack.creator.username]);

  if (!isSignedIn) {
    return (
      <Page
        meta={{
          title: `${starterPack.name} Starter Pack by @${starterPack.creator.username} on Farcaster`,
          description: starterPackDescription,
          canonical: starterPackCanonical,
          author: starterPackAuthor,
          twitterCard: 'summary',
        }}
      >
        <BorderedMainContent className="mt-2 flex !min-h-dvh flex-col items-center gap-12 md:justify-start">
          <div className="md:-auto m-2 flex size-full flex-col items-center justify-center space-y-10">
            <div className="relative mx-4 rounded-lg">
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-2">
                <div className="text-2xl font-semibold text-light">
                  {starterPack.name}
                </div>
                <div className="text-base text-[#fff]/80">
                  Starter Pack by @{starterPack.creator.username}
                </div>
              </div>
              <Image
                alt={'Starter pack illustration'}
                src={'/~/images/StarterPack_2.webp'}
                className="inset-0 rounded-lg object-cover object-left-top shadow"
              />
            </div>
            <div className="flex w-full flex-col items-center justify-center space-y-2 px-6">
              <DefaultButton
                variant="normal"
                size="lg"
                className="!w-full !py-[12px]"
                onClick={onClickOpenWarpcast}
              >
                Open Farcaster
              </DefaultButton>
              <DefaultButton
                variant="link"
                className="text-sm !font-normal !text-faint md:w-40"
                onClick={() => setAppStoreRedirectModalVisible(true)}
                size={'sm'}
              >
                Download
              </DefaultButton>
            </div>
            <div className="flex w-full flex-col px-6 text-left text-muted">
              <div className="font-semibold">Description</div>
              <div className="text-default">{starterPack.description}</div>
            </div>
            <div className="w-full px-6 text-left text-muted">
              <div className="font-semibold">
                {starterPack.itemCount} members
              </div>
              <div className="text-default">
                <FlatList
                  itemClassName="w-full cursor-pointer hover:bg-overlay-light -ml-4"
                  data={starterPack.items.map(
                    (item) => (item as ApiStarterPackAccountItem).item,
                  )}
                  renderItem={renderStarterPackUser}
                  keyExtractor={(item) => item.fid.toString()}
                  emptyView={<></>}
                />
              </div>
              {starterPack.itemCount - starterPack.items.length > 0 && (
                <div className="my-2 w-full text-center text-sm text-muted">
                  {starterPack.itemCount - starterPack.items.length} more
                  members
                </div>
              )}
            </div>
            {appStoreRedirectModalVisible && window.innerWidth < 720 && (
              <AppStoreRedirectsModal
                onClose={() => setAppStoreRedirectModalVisible(false)}
              />
            )}
          </div>
        </BorderedMainContent>
      </Page>
    );
  }

  return (
    <AuthedStarterPackPage
      starterPackId={starterPackId}
      starterPack={starterPack}
      starterPackUrl={starterPackUrl}
      starterPackDescription={starterPackDescription}
      starterPackCanonical={starterPackCanonical}
      starterPackAuthor={starterPackAuthor}
    />
  );
});

StarterPackPage.displayName = 'StarterPackPage';

function AuthedStarterPackPage({
  starterPackId,
  starterPack,
  starterPackUrl,
  starterPackDescription,
  starterPackCanonical,
  starterPackAuthor,
}: {
  starterPackId: string;
  starterPack: ApiStarterPack;
  starterPackUrl: string;
  starterPackDescription: string;
  starterPackCanonical: string;
  starterPackAuthor: string | undefined;
}) {
  const { trackEvent } = useAnalytics();

  const followAllStarterPackUsers = useFollowAllStarterPackUsers();

  const onFollowAll = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressFollowAllStarterPack, {
      starterPackId,
    });

    followAllStarterPackUsers({ id: starterPackId });

    toast({
      message: 'Followed all! 🎉',
      toastId: 'follow-all-starterp-pack',
    });
  }, [followAllStarterPackUsers, starterPackId, trackEvent]);

  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

  const onShareClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressShareStarterPack, { starterPackId });

    navigator.clipboard.writeText(starterPackUrl);

    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  }, [starterPackId, starterPackUrl, trackEvent]);

  const userIsProUser = useUserLevel(starterPack.creator) === 'pro';

  return (
    <Page
      meta={{
        title: `${starterPack.name} Starter Pack by @${starterPack.creator.username} on Farcaster`,
        description: starterPackDescription,
        canonical: starterPackCanonical,
        author: starterPackAuthor,
        twitterCard: 'summary',
      }}
    >
      <StarterPackPageHeader starterPack={starterPack} />
      <BorderedMainContent className="flex flex-col">
        <div className="flex flex-col space-y-4 border-b p-4 border-default">
          <div className="flex flex-row items-center space-x-2">
            <div className="flex size-[56px] items-center justify-center rounded-lg border bg-tertiary border-default">
              <StarterPackIcon
                size={32}
                className={'stroke-starter-pack-icon'}
              />
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-semibold text-default">
                {starterPack.name}
              </div>
              <div className="flex flex-row items-center space-x-0.5 text-base font-medium text-muted">
                <div>by</div>
                <LinkToProfileCasts
                  title="Starter pack creator"
                  user={starterPack.creator}
                  className="flex flex-row items-center space-x-0.5 !text-muted hover:underline"
                >
                  <Avatar size="xs" user={starterPack.creator} />
                  <div>
                    {resolveUsernameShort({
                      username: starterPack.creator.username,
                      fid: starterPack.creator.fid,
                    })}
                  </div>
                </LinkToProfileCasts>
                {userIsProUser && (
                  <FarcasterProBadge size={18} className="mb-1" />
                )}
              </div>
            </div>
          </div>
          <div className="text-base text-default">
            <LinkifiedText
              content={starterPack.description}
              mentions={[]}
              channelMentions={[]}
              tokenMentions={undefined}
              tokenMentionsV2={undefined}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <DefaultButton
              title="Share"
              variant="secondary"
              className="flex flex-row items-center !justify-center gap-2 !rounded-lg !font-semibold !bg-elevated text-default"
              onClick={onShareClick}
            >
              {copiedLink ? (
                <>
                  <CheckIcon size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <ShareIcon size={16} />
                  Share
                </>
              )}
            </DefaultButton>
            <DefaultButton
              onClick={onFollowAll}
              variant="normal"
              className="flex flex-row items-center !justify-center gap-2 !rounded-lg !font-semibold text-default"
            >
              Follow all
            </DefaultButton>
          </div>
        </div>
        <React.Suspense>
          <StarterPackUsersAndFeed starterPackId={starterPackId} />
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
}

function renderStarterPackUser({ item }: { item: ApiUser }) {
  return <User user={item} withDetailsPopover={true} />;
}

function renderStarterPackCast({ item }: { item: ApiCastWithContext }) {
  return <Cast castWithContext={item} />;
}

function StarterPackUsersAndFeed({ starterPackId }: { starterPackId: string }) {
  const { trackEvent } = useAnalytics();

  const [focusedTab, setFocusedTab] = React.useState<StarterPackTab>('users');

  const { data, onEndReached, isLoading } = useStarterPackUsers({
    id: starterPackId,
  });

  const {
    data: starterPackFeedData,
    onEndReached: starterPackFeedOnEndReached,
    isLoading: starterPackFeedIsLoading,
  } = useStarterPackFeed({
    id: starterPackId,
  });

  const starterPackUsers = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.result.users) || [];
  }, [data?.pages]);

  const starterPackFeed = React.useMemo(() => {
    return (
      starterPackFeedData?.pages.flatMap((page) => page.result.casts) || []
    );
  }, [starterPackFeedData?.pages]);

  const castsWithContext = useCastsWithContext(starterPackFeed, {
    forceThreadPosition: 'start_and_end',
    forceCastHeaderLabelHidden: true,
  });

  const uniqueCastsWithContext = React.useMemo(
    () => uniqBy(castsWithContext, castWithContextKeyExtractor),
    [castsWithContext],
  );

  React.useEffect(() => {
    if (focusedTab === 'feed') {
      trackEvent(AnalyticsEvent.ViewStarterPackCasts, { starterPackId });
    }
  }, [focusedTab, starterPackId, trackEvent]);

  return (
    <div>
      <Tabs>
        <div
          className="flex size-full items-center justify-center text-inherit"
          onClick={() => setFocusedTab('users')}
        >
          <Tab isFocused={focusedTab === 'users'}>Users</Tab>
        </div>
        <div
          className="flex size-full items-center justify-center text-inherit"
          onClick={() => setFocusedTab('feed')}
        >
          <Tab isFocused={focusedTab === 'feed'}>Casts</Tab>
        </div>
      </Tabs>
      {focusedTab === 'users' && (
        <FlatList
          itemClassName="w-full cursor-pointer hover:bg-overlay-light"
          data={starterPackUsers}
          renderItem={renderStarterPackUser}
          keyExtractor={(item) => item.fid.toString()}
          emptyView={<></>}
          isFetchingNextPage={isLoading}
          onEndReached={onEndReached}
        />
      )}
      {focusedTab === 'feed' && (
        <FlatList
          itemClassName="w-full cursor-pointer hover:bg-overlay-light"
          data={uniqueCastsWithContext}
          renderItem={renderStarterPackCast}
          keyExtractor={castWithContextKeyExtractor}
          emptyView={<></>}
          isFetchingNextPage={starterPackFeedIsLoading}
          onEndReached={starterPackFeedOnEndReached}
        />
      )}
    </div>
  );
}

export { StarterPackPage };
