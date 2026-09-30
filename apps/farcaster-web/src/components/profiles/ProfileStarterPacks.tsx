import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack, ApiUserProfile } from 'farcaster-client-data';
import {
  getFeedSourceOn,
  resolveUsername,
  useStarterPacks,
} from 'farcaster-client-hooks';
import React from 'react';

import { StarterPackIcon } from '~/components/icons/StarterPackIcon';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { ProfileContent } from '~/components/profiles/ProfileContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
type ProfileStarterPacksProps = {
  userProfile: ApiUserProfile;
};

const ProfileStarterPacks: React.FC<ProfileStarterPacksProps> = React.memo(
  ({ userProfile }) => {
    const { user } = userProfile;
    const { trackEvent } = useAnalytics();
    const navigate = useNavigate();
    const withUsernameSearchParams = useSearchParams(
      'profileStarterPacksWithUsername',
    );
    const withoutUsernameSearchParams = useSearchParams(
      'profileStarterPacksWithoutUsername',
    );
    const sourceOn = getFeedSourceOn(
      withUsernameSearchParams.sourceOn ?? withoutUsernameSearchParams.sourceOn,
    );
    const castHash =
      withUsernameSearchParams.castHash ?? withoutUsernameSearchParams.castHash;

    const { data, onEndReached, isFetchingNextPage } = useStarterPacks({
      fid: user.fid,
    });

    const starterPacks = React.useMemo(
      () => data?.pages.flatMap((page) => page.result.starterPacks) || [],
      [data],
    );

    const title = React.useMemo(
      () =>
        `Starter packs by ${user.displayName}${
          user.username ? ` (@${user.username})` : ''
        } / Farcaster`,
      [user.displayName, user.username],
    );

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.ViewProfileStarterPacks, {
        ...(sourceOn ? { on: sourceOn } : {}),
        ...(castHash ? { castHash } : {}),
      });
    }, [castHash, sourceOn, trackEvent, user.fid, user.username]);

    const onStarterPackClick = React.useCallback(
      ({ item }: { item: ApiStarterPack }) => {
        trackEvent(AnalyticsEvent.PressStarterPackOnProfile, {
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
              'flex cursor-pointer flex-row items-start space-x-2 p-4 hover:bg-overlay-faint',
              index !== 0 && ' border-t border-default',
            )}
            onClick={() => onStarterPackClick({ item })}
          >
            <div className="flex size-[48px] shrink-0 items-center justify-center rounded-lg border bg-tertiary border-default">
              <StarterPackIcon
                size={24}
                className={'stroke-starter-pack-icon'}
              />
            </div>
            <div className="flex flex-col space-y-0.5">
              <div className="text-default">{item.name}</div>
              <div className="text-muted">{item.description}</div>
            </div>
          </div>
        );
      },
      [onStarterPackClick],
    );

    return (
      <ProfileContent
        title={title}
        userProfile={userProfile}
        focusedTab="starterPacks"
      >
        <FlatList
          data={starterPacks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          emptyView={
            <DefaultEmptyListView
              message={`${resolveUsername({ fid: user.fid, username: user.username })} hasn't created any starter packs yet.`}
            />
          }
        />
      </ProfileContent>
    );
  },
);

ProfileStarterPacks.displayName = 'ProfileStarterPacks';

export { ProfileStarterPacks };
