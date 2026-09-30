import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserProfile } from 'farcaster-client-data';
import {
  getFeedSourceOn,
  resolveUsername,
  useUserLikedCasts,
} from 'farcaster-client-hooks';
import { FC, memo, useEffect, useMemo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { ProfileContent } from '~/components/profiles/ProfileContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

type ProfileLikesProps = {
  userProfile: ApiUserProfile;
};

const ProfileLikes: FC<ProfileLikesProps> = memo(({ userProfile }) => {
  const { user } = userProfile;
  const { trackEvent } = useAnalytics();
  const withUsernameSearchParams = useSearchParams('profileLikesWithUsername');
  const withoutUsernameSearchParams = useSearchParams(
    'profileLikesWithoutUsername',
  );
  const sourceOn = getFeedSourceOn(
    withUsernameSearchParams.sourceOn ?? withoutUsernameSearchParams.sourceOn,
  );
  const castHash =
    withUsernameSearchParams.castHash ?? withoutUsernameSearchParams.castHash;

  const { data, onEndReached, isFetchingNextPage } = useUserLikedCasts({
    fid: user.fid,
  });

  const casts = useMemo(
    () => data?.pages.flatMap((page) => page.result.casts) || [],
    [data],
  );

  const castsWithContext = useCastsWithContext(casts, {
    forceThreadPosition: 'start_and_end',
  });

  const title = useMemo(
    () =>
      `Liked by ${user.displayName}${
        user.username ? ` (@${user.username})` : ''
      } / Farcaster`,
    [user.displayName, user.username],
  );

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewProfileLikes, {
      ...(sourceOn ? { on: sourceOn } : {}),
      ...(castHash ? { castHash } : {}),
    });
  }, [castHash, sourceOn, trackEvent, user.fid, user.username]);

  return (
    <ProfileContent title={title} userProfile={userProfile} focusedTab="likes">
      <FlatList
        data={castsWithContext}
        renderItem={renderItem}
        keyExtractor={castWithContextKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        emptyView={
          <DefaultEmptyListView
            message={`${resolveUsername({ fid: user.fid, username: user.username })} hasn't liked any casts yet.`}
          />
        }
      />
    </ProfileContent>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

ProfileLikes.displayName = 'ProfileLikes';

export { ProfileLikes };
