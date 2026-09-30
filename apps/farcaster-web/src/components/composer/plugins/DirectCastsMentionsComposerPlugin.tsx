import { EditorPlugin } from '@draft-js-plugins/editor';
import createMentionPlugin, { MentionData } from '@draft-js-plugins/mention';
import { EntryComponentProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry';
import { MentionSuggestionsPubProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/MentionSuggestions';
import classNames from 'classnames';
import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  useFlatSearchUsersData,
  useNonSuspenseSearchUsers,
} from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { applyCloudflarePath } from '~/utils/images';

type DirectCastUser = ApiUser & {
  inGroup: boolean;
};

const getMentionsPluginTheme = () => {
  return {
    mention: 'm',
    mentionSuggestionsPopup: 'ms-popup-dc scrollbar-vert',
  };
};

const Entry: React.FC<EntryComponentProps> = (props) => {
  const {
    mention,

    searchValue: _sv,

    selectMention: _sm,

    theme: _t,

    isFocused: isFocused,
    ...parentProps
  } = props;

  const user: DirectCastUser = mention.user;
  const userIsProUser = useUserLevel(user) === 'pro';
  return (
    <div
      {...parentProps}
      className={classNames(
        'flex flex-row items-center justify-between px-4 py-2 hover:bg-overlay-faint focus:bg-overlay-faint',
        isFocused && 'bg-overlay-faint',
      )}
    >
      <div className="flex flex-row items-center space-x-1">
        <Avatar user={user} size={'sm'} disabled={true} />
        <div
          className={classNames(
            'text-base',
            mention.userIsInGroup ? 'text-default' : 'text-muted',
          )}
        >
          {user.displayName}
        </div>
        <div className={'text-sm text-muted'}>
          {resolveUsername({
            username: user.username,
            fid: user.fid,
          })}
        </div>
        {userIsProUser && <FarcasterProBadge size={18} />}
      </div>
      {!mention.userIsInGroup && (
        <div className={'text-sm text-faint'}>Not in group</div>
      )}
    </div>
  );
};

const MENTION_TRIGGER = '@';

const useDirectCastsMentionsComposerPlugin = ({
  prioritizedUsers,
}: {
  prioritizedUsers: ApiUser[];
}): {
  isOpen: boolean;
  plugin: EditorPlugin & {
    MentionSuggestions: React.ComponentType<MentionSuggestionsPubProps>;
  };
  renderPlugin: () => React.ReactElement;
} => {
  const [open, setOpen] = React.useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = React.useState<string>('');
  const prioritizeFids = prioritizedUsers?.map((user) => user.fid);

  // Increase limit as this component doesn't support infinite scroll
  const { data } = useNonSuspenseSearchUsers({
    q: mentionSearchTerm,
    excludeSelf: true,
    prioritizeFids,
    limit: 10,
  });

  const allUsers = useFlatSearchUsersData({ data });

  const plugin = React.useMemo(() => {
    return createMentionPlugin({
      mentionTrigger: [MENTION_TRIGGER],
      mentionPrefix: MENTION_TRIGGER,
      // Add dots as part of the mention string to support ENS name.
      // The plugin only works with a set of characters like this, and appends a '*' at the end
      // Using our normal larger regex leads to UI issues
      mentionRegExp: '[a-z0-9-.]',
      theme: getMentionsPluginTheme(),
    });
  }, []);

  const users = React.useMemo(() => {
    return (
      (allUsers?.length || 0 > 0 ? allUsers : prioritizedUsers.slice(0, 10)) ||
      []
    ).filter((user) => {
      // We will filter out any users without a username or display name
      // out of the mentions. We will revisit when there are other ways to
      // mention in the future like fid.
      return user.username || user.displayName;
    });
  }, [allUsers, prioritizedUsers]);

  const suggestions: MentionData[] = React.useMemo(() => {
    const mapped = users.map((user) => ({
      name: user.username || user.fid.toString(),
      displayName: user.displayName,
      avatar: applyCloudflarePath(user.pfp?.url || '', undefined),
      userIsInGroup:
        typeof prioritizeFids !== 'undefined' &&
        prioritizeFids.indexOf(user.fid) !== -1,
      user,
    }));

    let finalSet: {
      name: string;
      displayName: string;
      avatar: string;
      userIsInGroup: boolean;
      user: ApiUser;
    }[] = [];

    if (typeof prioritizeFids !== 'undefined' && prioritizeFids.length !== 0) {
      finalSet = mapped.filter(
        (o) => prioritizeFids.indexOf(o.user.fid) !== -1,
      );
    }

    if (finalSet.length !== 0) {
      return finalSet;
    }

    return mapped;
  }, [prioritizeFids, users]);

  const onSearchChange = React.useCallback(
    ({ trigger, value }: { trigger: string; value: string }) => {
      if (trigger === MENTION_TRIGGER) {
        setMentionSearchTerm(value);
      }
    },
    [setMentionSearchTerm],
  );

  const onOpenChangeInternal = React.useCallback((_open: boolean) => {
    setOpen(_open);
  }, []);

  const { MentionSuggestions } = plugin;

  return {
    isOpen: open,
    plugin,
    renderPlugin: () => (
      <MentionSuggestions
        open={open}
        onOpenChange={onOpenChangeInternal}
        suggestions={suggestions}
        onSearchChange={onSearchChange}
        entryComponent={Entry}
      />
    ),
  };
};

export { useDirectCastsMentionsComposerPlugin };
