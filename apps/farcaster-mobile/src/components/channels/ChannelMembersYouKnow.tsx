import { ApiChannel } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type ChannelMembersYouKnowProps = {
  channel: ApiChannel;
};

const ChannelMembersYouKnow: React.FC<ChannelMembersYouKnowProps> = React.memo(
  ({ channel }) => {
    if (
      !channel.viewerContext.membersYouKnow ||
      channel.viewerContext.membersYouKnow.users.length === 0 ||
      channel.viewerContext.membersYouKnow.totalCount === 0
    ) {
      return null;
    }

    return (
      <ChannelMembersYouKnowContent
        membersYouKnow={channel.viewerContext.membersYouKnow}
      />
    );
  },
);
ChannelMembersYouKnow.displayName = 'ChannelMembersYouKnow';

interface ChannelMembersYouKnowContentProps {
  membersYouKnow: NonNullable<ApiChannel['viewerContext']['membersYouKnow']>;
}

const ChannelMembersYouKnowContent: React.FC<ChannelMembersYouKnowContentProps> =
  React.memo(({ membersYouKnow }) => {
    const t = useTheme();

    const avatars = React.useMemo(
      () =>
        membersYouKnow.users.slice(0, 3).map(({ pfp, fid }, index) => (
          <View
            key={fid}
            style={{
              marginLeft: index > 0 ? -2 : 0,
            }}
          >
            <Avatar pfpUrl={pfp?.url} diameter={16} />
          </View>
        )),
      [membersYouKnow.users],
    );

    return (
      <View style={[t.mT2, t.flexRow, t.itemsStart]}>
        <View style={[t.mR2, t.flexRow]}>{avatars}</View>
        <View style={[t.selfCenter, t.flex1]}>
          <Text2 size="xs" color="tertiary">
            {membersYouKnow.totalCount === 1
              ? '1 member you know'
              : `${membersYouKnow.totalCount} members you know`}
          </Text2>
        </View>
      </View>
    );
  });
ChannelMembersYouKnowContent.displayName = 'ChannelMembersYouKnowContent';

export { ChannelMembersYouKnow };
