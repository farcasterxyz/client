import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserProfile } from 'farcaster-client-data';
import {
  getFeedSourceOn,
  usePurgedUserCasts,
  useRefreshUserCastsFirstPage,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { ProfileContent } from '~/components/profiles/ProfileContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useSetOnCurrentNavLinkClicked } from '~/hooks/data/useSetOnCurrentNavLinkClicked';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useRedirectToWarpcastMobile } from '~/hooks/useRedirectToWarpcastMobile';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

type ProfileCastsProps = {
  userProfile: ApiUserProfile;
};

const ProfileCasts: FC<ProfileCastsProps> = memo(({ userProfile }) => {
  const { trackEvent } = useAnalytics();
  const { trackInternalEvent } = useTrackEvent();
  const withUsernameSearchParams = useSearchParams('profileCastsWithUsername');
  const withoutUsernameSearchParams = useSearchParams(
    'profileCastsWithoutUsername',
  );
  const sourceOn = getFeedSourceOn(
    withUsernameSearchParams.sourceOn ?? withoutUsernameSearchParams.sourceOn,
  );
  const castHash =
    withUsernameSearchParams.castHash ?? withoutUsernameSearchParams.castHash;

  const user = userProfile.user;

  const title = useMemo(
    () =>
      `${user.displayName}${
        user.username ? ` (@${user.username})` : ''
      } on Farcaster`,
    [user.displayName, user.username],
  );

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewProfileFeed, {
      ...(user.username ? { 'profile username': user.username } : {}),
      ...(sourceOn ? { on: sourceOn } : {}),
      ...(castHash ? { castHash } : {}),
    });
    trackInternalEvent({
      type: 'user-profile-view',
      data: {
        profileFid: user.fid,
      },
    });
  }, [
    castHash,
    sourceOn,
    trackEvent,
    trackInternalEvent,
    user.username,
    user.fid,
  ]);

  useRedirectToWarpcastMobile();

  return (
    <ProfileContent title={title} userProfile={userProfile} focusedTab="casts">
      <Suspense fallback={<FullScreenLoadingIndicator />}>
        <ProfileCastsContent user={user} />
      </Suspense>
    </ProfileContent>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

ProfileCasts.displayName = 'ProfileCasts';

const ProfileCastsContent: FC<Pick<ApiUserProfile, 'user'>> = memo(
  ({ user }) => {
    const { data, onEndReached, isFetchingNextPage, refetch } =
      usePurgedUserCasts({
        fid: user.fid,
      });

    const refreshFirstPage = useRefreshUserCastsFirstPage({
      fid: user.fid,
      refetch,
    });

    useSetOnCurrentNavLinkClicked(refreshFirstPage);

    const casts = useMemo(
      () => data?.pages.flatMap((page) => page.result.casts) || [],
      [data],
    );

    const castsWithContext = useCastsWithContext(casts, {
      forceThreadPosition: 'start_and_end',
    });

    return (
      <>
        <DebugLogger name="Profile Casts" data={{ castsWithContext, user }} />

        <FlatList
          data={castsWithContext}
          renderItem={renderItem}
          keyExtractor={castWithContextKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          emptyView={
            <DefaultEmptyListView
              message={`${user.displayName} hasn't casted yet.`}
            />
          }
        />
      </>
    );
  },
);

ProfileCastsContent.displayName = 'ProfileCastsContent';

export { ProfileCasts };
