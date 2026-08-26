import { useUnfollowLeastInteractedWithFollowing } from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import React from 'react';
import { Alert } from 'react-native';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

const UnfollowLeastInteractedWithFollowingButton: React.FC = () => {
  const { fid } = useCurrentUser_UNSAFE();

  const [unfollowingAll, setUnfollowingAll] = React.useState<boolean>(false);

  const unfollowLeastInteractedWithFollowing =
    useUnfollowLeastInteractedWithFollowing();

  const onUnfollowAllPress = React.useCallback(() => {
    return Alert.alert(
      'Unfollow all',
      'Changes may take a few minutes to be reflected.',
      [
        {
          text: 'Cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            setUnfollowingAll(true);

            await unfollowLeastInteractedWithFollowing({ fid });

            setUnfollowingAll(false);
          },
        },
      ],
    );
  }, [fid, unfollowLeastInteractedWithFollowing]);

  return (
    <ButtonV2
      onPress={onUnfollowAllPress}
      title={'Unfollow all'}
      variant="tertiary"
      height="xs"
      width={120}
      loading={unfollowingAll}
      disabled={unfollowingAll}
    />
  );
};

export { UnfollowLeastInteractedWithFollowingButton };
