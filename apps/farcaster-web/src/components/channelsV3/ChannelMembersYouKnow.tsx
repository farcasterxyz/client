import cn from 'classnames';
import { ApiChannel } from 'farcaster-client-data';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';

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
    const avatars = React.useMemo(
      () =>
        membersYouKnow.users.slice(0, 3).map((user, index) => (
          <div
            key={user.fid}
            className={cn(
              'block',
              'leading-[0]',
              index > 0 ? '-ml-[3px]' : undefined,
            )}
          >
            <Avatar user={user} size="xs2" />
          </div>
        )),
      [membersYouKnow.users],
    );

    return (
      <div className="mt-2 flex flex-row items-start">
        <div className="mr-2 flex flex-row">{avatars}</div>
        <div className="text-xs text-faint">
          {membersYouKnow.totalCount === 1
            ? '1 member you know'
            : `${membersYouKnow.totalCount} members you know`}
        </div>
      </div>
    );
  });
ChannelMembersYouKnowContent.displayName = 'ChannelMembersYouKnowContent';

export { ChannelMembersYouKnow };
