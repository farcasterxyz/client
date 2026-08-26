import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserProfile } from 'farcaster-client-data';
import {
  getFeedSourceOn,
  usePurgedUserCastsAndReplies,
} from 'farcaster-client-hooks';
import { FC, memo, useEffect, useMemo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { ProfileContent } from '~/components/profiles/ProfileContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

type ProfileCastsAndRepliesProps = {
  userProfile: ApiUserProfile;
};

const ProfileCastsAndReplies: FC<ProfileCastsAndRepliesProps> = memo(
  ({ userProfile }) => {
    const { user } = userProfile;
    const { trackEvent } = useAnalytics();
    const withUsernameSearchParams = useSearchParams(
      'profileCastsAndRepliesWithUsername',
    );
    const withoutUsernameSearchParams = useSearchParams(
      'profileCastsAndRepliesWithoutUsername',
    );
    const sourceOn = getFeedSourceOn(
      withUsernameSearchParams.sourceOn ?? withoutUsernameSearchParams.sourceOn,
    );
    const castHash =
      withUsernameSearchParams.castHash ?? withoutUsernameSearchParams.castHash;
    const { data, onEndReached, isFetchingNextPage } =
      usePurgedUserCastsAndReplies({
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
        `${user.displayName}${
          user.username ? ` (@${user.username})` : ''
        } casts and replies on Farcaster`,
      [user.displayName, user.username],
    );

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewProfileReplies, {
        ...(sourceOn ? { on: sourceOn } : {}),
        ...(castHash ? { castHash } : {}),
      });
    }, [castHash, sourceOn, trackEvent, user.fid, user.username]);

    return (
      <ProfileContent
        title={title}
        userProfile={userProfile}
        focusedTab="castsAndReplies"
      >
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
      </ProfileContent>
    );
  },
);

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

ProfileCastsAndReplies.displayName = 'ProfileCastsAndReplies';

export { ProfileCastsAndReplies };
