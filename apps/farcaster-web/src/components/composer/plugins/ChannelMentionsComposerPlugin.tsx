import { EditorPlugin } from '@draft-js-plugins/editor';
import createMentionPlugin, { MentionData } from '@draft-js-plugins/mention';
import { EntryComponentProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry';
import { MentionSuggestionsPubProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/MentionSuggestions';
import { ApiChannel } from 'farcaster-client-data';
import {
  useFlatSearchChannelsData,
  useSearchChannels,
} from 'farcaster-client-hooks';
import React, { FC, ReactPortal } from 'react';
import ReactDOM from 'react-dom';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
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

  const channel: ApiChannel = mention.channel;

  return (
    <div {...parentProps} className="flex flex-row p-2 hover:bg-overlay-faint">
      <Image
        src={
          applyCloudflarePath(channel.imageUrl, 56) || NFT_IMAGE_UNAVAILABLE_URL
        }
        className="rounded-xs aspect-square size-[56px] shrink-0 border object-cover border-default"
        alt={`${channel.name} image`}
        fallback={NFT_IMAGE_UNAVAILABLE_URL}
      />
      <div className="ml-2 flex flex-col justify-center">
        <div className={'font-semibold'}>{channel.name}</div>
        <div className={'text-sm text-muted'}>/{channel.key}</div>
      </div>
    </div>
  );
};

const MENTION_TRIGGER = '/';

const useChannelMentionsComposerPlugin = (): {
  plugin: EditorPlugin & {
    MentionSuggestions: React.ComponentType<MentionSuggestionsPubProps>;
  };
  renderPlugin: () => ReactPortal;
} => {
  const [open, setOpen] = React.useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = React.useState<string>('');

  const { data } = useSearchChannels({
    q: mentionSearchTerm,
    prioritizeFollowed: true,
    // Increased limit since this component doesn't support infinite scroll
    limit: 40,
  });
  const channels = useFlatSearchChannelsData({ data });

  const suggestions: MentionData[] = React.useMemo(() => {
    return (channels || []).map((channel) => ({
      name: channel.key,
      id: channel.key,
      avatar: applyCloudflarePath(
        channel.imageUrl || NFT_IMAGE_UNAVAILABLE_URL,
        undefined,
      ),
      channel,
    }));
  }, [channels]);

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

  const onOpenChange = React.useCallback((_open: boolean) => {
    setOpen(_open);
  }, []);

  const plugin = React.useMemo(() => {
    return createMentionPlugin({
      mentionTrigger: [MENTION_TRIGGER],
      mentionPrefix: MENTION_TRIGGER,
      // The plugin only works with a set of characters like this, and appends a '*' at the end
      // Using our normal larger regex leads to UI issues
      mentionRegExp: '[a-z0-9-]',
      mentionSuggestionsComponent:
        ComposerMentionSuggestions as React.ComponentType,
      theme: getMentionsPluginTheme(),
    });
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
          onOpenChange={onOpenChange}
          suggestions={suggestions}
          onSearchChange={onSearchChange}
          entryComponent={Entry}
        />,
        mentionPortalContainer!,
      ),
  };
};

export { useChannelMentionsComposerPlugin };
