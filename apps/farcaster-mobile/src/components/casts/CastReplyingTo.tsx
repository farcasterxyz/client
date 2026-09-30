import { ApiCast, parseCaip19Url } from 'farcaster-client-data';
import {
  CastClickType,
  resolveUsername,
  useTrackCastClick,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

type CastReplyingToProps = {
  cast: ApiCast;
};

const CastReplyingTo: FC<CastReplyingToProps> = memo(
  ({ cast: { parentAuthor, parentSource } }) => {
    const t = useTheme();

    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const trackCastClick = useTrackCastClick();

    const pushToUserProfile = usePushToUserProfile();

    const { shouldLinkToUser } = useUserLinkHelpers();

    if (parentAuthor) {
      return (
        <View style={[t.flexRow, t.itemsCenter, t.mB1]}>
          <Text style={[t.texts.secondary, t.textSm]}>Replying to </Text>
          {parentAuthor.fid === currentUserFid ? (
            <Text style={[t.texts.secondary, t.textSm]}>you</Text>
          ) : (
            <TextWithPress
              style={[t.texts.brand]}
              onPress={() => {
                if (shouldLinkToUser({ fid: parentAuthor.fid })) {
                  trackCastClick({ type: CastClickType.Mention });

                  pushToUserProfile({ fid: parentAuthor.fid });
                }
              }}
            >
              {resolveUsername({
                username: parentAuthor.username,
                fid: parentAuthor.fid,
              })}
            </TextWithPress>
          )}
        </View>
      );
    }

    if (parentSource?.type === 'url' && !parseCaip19Url(parentSource.url)) {
      return (
        <View style={[t.flexRow, t.itemsCenter, t.mB1]}>
          <Text style={[t.texts.secondary, t.textSm]}>
            Replying to external content
          </Text>
        </View>
      );
    }

    return null;
  },
);

export { CastReplyingTo };
