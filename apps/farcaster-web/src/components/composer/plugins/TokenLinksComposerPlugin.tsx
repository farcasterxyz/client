import { EditorPlugin } from '@draft-js-plugins/editor';
import createMentionPlugin from '@draft-js-plugins/mention';
import { MentionSuggestionsPubProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/MentionSuggestions';
import React from 'react';

const getMentionsPluginTheme = () => {
  return {
    mention: 'm',
  };
};

const MENTION_TRIGGER = '$';

const useTokenLinksComposerPlugin = (): {
  plugin: EditorPlugin & {
    MentionSuggestions: React.ComponentType<MentionSuggestionsPubProps>;
  };
} => {
  const plugin = React.useMemo(() => {
    return createMentionPlugin({
      mentionTrigger: [MENTION_TRIGGER],
      mentionPrefix: MENTION_TRIGGER,
      // The plugin only works with a set of characters like this, and appends a '*' at the end
      // Using our normal larger regex leads to UI issues
      mentionRegExp: '[a-zA-Z0-9]',
      theme: getMentionsPluginTheme(),
    });
  }, []);

  return {
    plugin,
  };
};

export { useTokenLinksComposerPlugin };
