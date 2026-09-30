import { ApiUserProfile } from 'farcaster-client-data';
import {
  usePurgedProfileSnapCasts,
  useRefreshProfileSnapCastsFirstPage,
} from 'farcaster-client-hooks';
import { FC, memo, Suspense, useMemo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { ProfileContent } from '~/components/profiles/ProfileContent';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useSetOnCurrentNavLinkClicked } from '~/hooks/data/useSetOnCurrentNavLinkClicked';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

type ProfileSnapCastsProps = {
  userProfile: ApiUserProfile;
};

const ProfileSnapCasts: FC<ProfileSnapCastsProps> = memo(({ userProfile }) => {
  const user = userProfile.user;

  const title = useMemo(
    () =>
      `${user.displayName}${
        user.username ? ` (@${user.username})` : ''
      } — Snaps on Farcaster`,
    [user.displayName, user.username],
  );

  return (
    <ProfileContent title={title} userProfile={userProfile} focusedTab="snaps">
      <Suspense fallback={<FullScreenLoadingIndicator />}>
        <ProfileSnapCastsContent user={user} />
      </Suspense>
    </ProfileContent>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

const ProfileSnapCastsEmptyView: FC = memo(() => {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center bg-app">
      <div className="flex max-w-sm flex-col gap-1">
        <div className="p font-semibold">No Snaps yet</div>
        <div className="p text-muted">
          Snaps shared in casts will appear here.
        </div>
      </div>
    </div>
  );
});

ProfileSnapCastsEmptyView.displayName = 'ProfileSnapCastsEmptyView';

ProfileSnapCasts.displayName = 'ProfileSnapCasts';

const ProfileSnapCastsContent: FC<Pick<ApiUserProfile, 'user'>> = memo(
  ({ user }) => {
    const { data, onEndReached, isFetchingNextPage, refetch } =
      usePurgedProfileSnapCasts({
        fid: user.fid,
      });

    const refreshFirstPage = useRefreshProfileSnapCastsFirstPage({
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
        <DebugLogger
          name="Profile Snap Casts"
          data={{ castsWithContext, user }}
        />

        <FlatList
          data={castsWithContext}
          renderItem={renderItem}
          keyExtractor={castWithContextKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          emptyView={<ProfileSnapCastsEmptyView />}
        />
      </>
    );
  },
);

ProfileSnapCastsContent.displayName = 'ProfileSnapCastsContent';

export { ProfileSnapCasts };
