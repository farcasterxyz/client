import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser, ApiUserMinimal } from 'farcaster-client-data';
import { useGloballyCachedUser, useTrackEvent } from 'farcaster-client-hooks';
import { useTheme } from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import React, { FC, memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { FollowButton } from '~/components/users/FollowButton';
import { hitSlop } from '~/constants/Pressable';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

const maxNumAvatars = 6;

type NotificationGroupAvatarsProps = {
  actors: ApiUser[];
};

const NotificationGroupAvatars: FC<NotificationGroupAvatarsProps> = memo(
  ({ actors }) => {
    const t = useTheme();

    const { trackEvent } = useTrackEvent();
    const pushToUserProfile = usePushToUserProfile();

    const globallyCachedCoreActor = useGloballyCachedUser({
      fallback: actors[0],
    });

    const avatars = useMemo(() => {
      return uniqBy(actors, ({ fid }) => fid).slice(0, maxNumAvatars) || [];
    }, [actors]);

    const shouldShowFollowButton = useMemo(() => {
      return (
        avatars.length === 1 &&
        typeof globallyCachedCoreActor.viewerContext?.following !==
          'undefined' &&
        !globallyCachedCoreActor.viewerContext?.following
      );
    }, [avatars.length, globallyCachedCoreActor.viewerContext?.following]);

    return (
      <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
        <View style={[t.flex, t.flexRow]}>
          {avatars.map((actor) => (
            <Pressable
              key={actor.fid}
              hitSlop={hitSlop}
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  // TODO: type
                  action: 'avatar',
                });

                pushToUserProfile({ fid: actor.fid });
              }}
              style={[t.mR2]}
            >
              <Avatar
                diameter={38}
                pfpUrl={actor.pfp?.url}
                shouldFadeIn={false}
              />
            </Pressable>
          ))}
        </View>
        {shouldShowFollowButton && (
          <FollowButton
            targetUser={globallyCachedCoreActor}
            presentation="list"
            size="sm"
          />
        )}
      </View>
    );
  },
);

NotificationGroupAvatars.displayName = 'NotificationGroupAvatars';

type NotificationGroupAvatarsMinimalProps = {
  actors: ApiUserMinimal[];
};

const NotificationGroupAvatarsMinimal: FC<NotificationGroupAvatarsMinimalProps> =
  memo(({ actors }) => {
    const t = useTheme();

    const { trackEvent } = useTrackEvent();
    const pushToUserProfile = usePushToUserProfile();

    const avatars = useMemo(() => {
      return uniqBy(actors, ({ fid }) => fid).slice(0, maxNumAvatars) || [];
    }, [actors]);

    return (
      <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
        <View style={[t.flex, t.flexRow]}>
          {avatars.map((actor) => (
            <Pressable
              key={actor.fid}
              hitSlop={hitSlop}
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  // TODO: type
                  action: 'avatar',
                });

                pushToUserProfile({ fid: actor.fid });
              }}
              style={[t.mR2]}
            >
              <Avatar
                diameter={38}
                pfpUrl={actor.pfp?.url}
                shouldFadeIn={false}
              />
            </Pressable>
          ))}
        </View>
      </View>
    );
  });

export { NotificationGroupAvatars, NotificationGroupAvatarsMinimal };
