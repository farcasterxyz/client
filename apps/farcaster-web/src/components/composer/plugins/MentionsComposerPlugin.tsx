import { EditorPlugin } from '@draft-js-plugins/editor';
import createMentionPlugin, { MentionData } from '@draft-js-plugins/mention';
import { EntryComponentProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry';
import { MentionSuggestionsPubProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/MentionSuggestions';
import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  useFlatSearchUsersData,
  useGloballyCachedUser,
  useNonSuspenseSearchUsers,
} from 'farcaster-client-hooks';
import React, { FC, ReactPortal, useMemo } from 'react';
import ReactDOM from 'react-dom';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { Following } from '~/components/users/Following';
import { FollowingEachOther } from '~/components/users/FollowingEachOther';
import { FollowsYou } from '~/components/users/FollowsYou';
import { popoverRootId } from '~/constants/popovers';
import { applyCloudflarePath } from '~/utils/images';

import { ComposerMentionSuggestions } from './ComposerMentionSuggestions';

const getMentionsPluginTheme = () => {
  return {
    mention: 'm',
    mentionSuggestionsPopup: 'ms-popup scrollbar-hide',
  };
};

const Entry: FC<EntryComponentProps> = (props) => {
  const {
    mention,

    searchValue: _sv,

    selectMention: _sm,

    theme: _t,

    isFocused: _isFocused,
    ...parentProps
  } = props;

  const userProp: ApiUser = mention.user;
  const user = useGloballyCachedUser({ fallback: userProp });

  const following = user.viewerContext?.following === true;
  const followedBy = user.viewerContext?.followedBy === true;

  const followPill = useMemo(() => {
    if (followedBy && following) {
      return <FollowingEachOther />;
    }
    if (following) {
      return <Following />;
    }
    if (followedBy) {
      return <FollowsYou />;
    }
    return undefined;
  }, [following, followedBy]);

  return (
    <div
      {...parentProps}
      className="flex flex-row px-4 py-2 hover:bg-overlay-faint"
    >
      <AvatarImage
        size="lg"
        imgUrl={user.pfp?.url}
        imgAlt={`${user.displayName} avatar`}
      />
      <div className="ml-2 flex min-w-0 flex-col justify-center">
        <div className={'truncate font-semibold'}>{user.displayName}</div>
        <div className="line-clamp-2 flex min-w-0 flex-row flex-wrap items-center gap-1">
          <div className={'text-sm text-muted'}>
            {resolveUsername({
              username: user.username,
              fid: user.fid,
            })}
          </div>
          {typeof followPill !== 'undefined' && (
            <div className="inline-block shrink-0">{followPill}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const MENTION_TRIGGER = '@';

const useMentionsComposerPlugin = ({
  prioritizeFids,
}: Partial<{
  prioritizeFids: number[];
}> = {}): {
  plugin: EditorPlugin & {
    MentionSuggestions: React.ComponentType<MentionSuggestionsPubProps>;
  };
  renderPlugin: () => ReactPortal;
} => {
  const [open, setOpen] = React.useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = React.useState<string>('');
  // Increase limit as this component doesn't support infinite scroll
  const { data } = useNonSuspenseSearchUsers({
    q: mentionSearchTerm,
    excludeSelf: true,
    prioritizeFids,
    // Increased limit since this component doesn't support infinite scroll
    limit: 40,
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
      mentionSuggestionsComponent:
        ComposerMentionSuggestions as React.ComponentType,
      theme: getMentionsPluginTheme(),
    });
  }, []);

  const users = React.useMemo(() => {
    return (allUsers || []).filter((user) => {
      // We will filter out any users without a username or display name
      // out of the mentions. We will revisit when there are other ways to
      // mention in the future like fid.
      return user.username && user.displayName;
    });
  }, [allUsers]);

  const suggestions: MentionData[] = React.useMemo(() => {
    const mapped = users.map((user) => ({
      name: user.username || user.fid.toString(),
      displayName: user.displayName,
      avatar: applyCloudflarePath(user.pfp?.url || '', undefined),
      user,
    }));

    if (typeof prioritizeFids !== 'undefined' && prioritizeFids.length !== 0) {
      return mapped.filter((o) => prioritizeFids.indexOf(o.user.fid) !== -1);
    }

    return mapped;
  }, [prioritizeFids, users]);

  const onSearchChange = React.useCallback(
    ({ trigger, value }: { trigger: string; value: string }) => {
      // We ignore values that end with a space since the plugin has an odd behavior
      // where it's triggered after deleting the trigger character using the current
      // editor text as value.
      if (trigger === MENTION_TRIGGER && value[value.length - 1] !== ' ') {
        setMentionSearchTerm(value);
      }
    },
    [setMentionSearchTerm],
  );

  const onOpenChangeInternal = React.useCallback((_open: boolean) => {
    setOpen(_open);
  }, []);

  const { MentionSuggestions } = plugin;
  const mentionPortalContainer =
    document.getElementById(popoverRootId) ?? document.getElementById('root');

  return {
    plugin,
    renderPlugin: () =>
      ReactDOM.createPortal(
        <MentionSuggestions
          open={open}
          onOpenChange={onOpenChangeInternal}
          suggestions={suggestions}
          onSearchChange={onSearchChange}
          entryComponent={Entry}
        />,
        mentionPortalContainer!,
      ),
  };
};

export { useMentionsComposerPlugin };
