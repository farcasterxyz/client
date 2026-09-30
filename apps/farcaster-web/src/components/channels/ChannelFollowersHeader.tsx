import { FC, memo } from 'react';

import { LinkToChannelFollowers } from '~/components/links/LinkToChannelFollowers';
import { LinkToChannelFollowersYouKnow } from '~/components/links/LinkToChannelFollowersYouKnow';
import { LinkToChannelMembers } from '~/components/links/LinkToChannelMembers';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { ChannelFollowersTab } from '~/types';

type ChannelFollowersHeaderProps = {
  focusedTab: ChannelFollowersTab;
  channelKey: string;
};

const ChannelFollowersHeader: FC<ChannelFollowersHeaderProps> = memo(
  ({ focusedTab, channelKey }) => {
    const cachedCurrentUser = useCachedCurrentUser();

    return (
      <Tabs>
        <LinkToChannelMembers
          title={`Members /${channelKey}`}
          channelKey={channelKey}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'channelMembers'}>Members</Tab>
        </LinkToChannelMembers>
        <LinkToChannelFollowers
          title={`Followers /${channelKey}`}
          channelKey={channelKey}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'channelFollowers'}>Followers</Tab>
        </LinkToChannelFollowers>
        {typeof cachedCurrentUser !== 'undefined' && (
          <LinkToChannelFollowersYouKnow
            title={`Mutuals /${channelKey}`}
            channelKey={channelKey}
            className="flex size-full items-center justify-center text-inherit"
          >
            <Tab isFocused={focusedTab === 'channelFollowersYouKnow'}>
              Mutuals
            </Tab>
          </LinkToChannelFollowersYouKnow>
        )}
      </Tabs>
    );
  },
);

ChannelFollowersHeader.displayName = 'ChannelFollowersHeader';

export { ChannelFollowersHeader };
