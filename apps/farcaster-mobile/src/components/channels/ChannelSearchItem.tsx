import { ApiChannel } from 'farcaster-client-data';
import {
  UnableToFollowFeedError,
  useCreateFeedFollow,
  useDeleteFeedFollow,
  useGloballyCachedChannel,
  useInvalidateChannel,
  useInvalidateDiscoverChannels,
  useInvalidateUserFollowingChannels,
  useRefetchFeedSummaries,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { FeedImage } from '~/components/FeedImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackError } from '~/utils/ErrorUtils';

type ChannelSearchItemProps = {
  channel: ApiChannel;
  showBio?: boolean;
};

const ChannelSearchItem: FC<ChannelSearchItemProps> = memo(
  ({ channel: fallbackChannel, showBio = false }) => {
    const t = useTheme();
    const navigate = useNavigate();

    const channel = useGloballyCachedChannel({ fallback: fallbackChannel });

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          navigate('Channel', {
            channelKey: channel.key,
          });
        }}
      >
        <View
          style={[t.p3, t.flexRow, t.itemsCenter, t.justifyBetween, { gap: 8 }]}
        >
          <FeedImage size={40} imageUrl={channel.imageUrl} />
          <View style={[t.flex1, { gap: 4 }]}>
            <View
              style={[t.flexRow, t.justifyBetween, t.itemsStart, { gap: 12 }]}
            >
              <View style={[t.flex1, { gap: 2 }]}>
                <Text2 weight="medium" numberOfLines={1} ellipsizeMode="tail">
                  {channel.name}
                </Text2>
                <Text2
                  size="sm"
                  color="tertiary"
                  style={[t.flexShrink]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {`/${channel.key}`}
                </Text2>
              </View>
              <ChannelSearchItemFollowButton
                channel={channel}
                isViewerFollowing={channel.viewerContext.following}
              />
            </View>
            {showBio && channel.description && (
              <Text2
                size="sm"
                style={[t.flexShrink]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {channel.description}
              </Text2>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

ChannelSearchItem.displayName = 'ChannelSearchItem';

type ChannelSearchItemFollowButtonProps = {
  channel: ApiChannel;
  isViewerFollowing: boolean;
};

const ChannelSearchItemFollowButton: FC<ChannelSearchItemFollowButtonProps> =
  memo(({ channel, isViewerFollowing }) => {
    const currentUser = useGloballyCachedCurrentUser();

    const createFeedFollow = useCreateFeedFollow();
    const deleteFeedFollow = useDeleteFeedFollow();

    const refetchFeedSummaries = useRefetchFeedSummaries();
    const invalidateUserFollowingChannels =
      useInvalidateUserFollowingChannels();
    const invalidateDiscoverChannels = useInvalidateDiscoverChannels();
    const invalidateChannel = useInvalidateChannel();

    const toast = useToast();

    const onFollowPress = React.useCallback(async () => {
      try {
        if (isViewerFollowing) {
          await deleteFeedFollow({
            feedKey: channel.key,
            following: channel.viewerContext.following,
            fid: currentUser.fid,
            location: 'channel search item',
          });
        } else {
          await createFeedFollow({
            feedKey: channel.key,
            following: channel.viewerContext.following,
            location: 'channel search item',
          });
        }

        await Promise.all([
          refetchFeedSummaries(),
          invalidateUserFollowingChannels(),
          invalidateDiscoverChannels(),
          invalidateChannel({ key: channel.key }),
        ]);
      } catch (error) {
        toast.show('Unable to follow feed', { type: 'danger' });

        trackError(
          new UnableToFollowFeedError({
            followerFid: currentUser.fid,
            feedKey: channel.key,
            follow: !isViewerFollowing,
            error,
          }),
        );
      }
    }, [
      isViewerFollowing,
      refetchFeedSummaries,
      invalidateUserFollowingChannels,
      currentUser.fid,
      invalidateDiscoverChannels,
      invalidateChannel,
      channel.key,
      channel.viewerContext.following,
      deleteFeedFollow,
      createFeedFollow,
      toast,
    ]);

    return (
      <ButtonV2
        title={isViewerFollowing ? 'Following' : 'Follow'}
        onPress={onFollowPress}
        variant={isViewerFollowing ? 'tertiary' : 'secondary'}
        height="xs"
        width={98}
      />
    );
  });

ChannelSearchItemFollowButton.displayName = 'ChannelSearchItemFollowButton';

export { ChannelSearchItem };
