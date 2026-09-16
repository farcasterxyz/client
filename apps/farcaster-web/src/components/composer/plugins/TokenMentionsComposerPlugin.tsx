import { EditorPlugin } from '@draft-js-plugins/editor';
import createMentionPlugin, { MentionData } from '@draft-js-plugins/mention';
import { EntryComponentProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry';
import { MentionSuggestionsPubProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/MentionSuggestions';
import { ApiTokenLink } from 'farcaster-client-data';
import {
  formatTimeAgo,
  formatTokenName,
  formatTokenStat,
  useNonSuspenseTokenLinks,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { FC, ReactPortal } from 'react';
import ReactDOM from 'react-dom';

import { TokenPlatform } from '~/components/chain/ChainImage';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { popoverRootId } from '~/constants/popovers';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

import { ComposerMentionSuggestions } from './ComposerMentionSuggestions';

const VerifiedShieldIcon: FC = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className="fill-action-purple shrink-0"
  >
    <path d="M9 1C9.28698 1 9.56557 1.0898 9.79785 1.25488L9.89453 1.33008L9.89941 1.33398C11.1567 2.43309 12.9115 3.25 14.25 3.25C14.5814 3.25 14.8994 3.3819 15.1338 3.61621C15.3681 3.85055 15.4999 4.1686 15.5 4.5V9.75C15.5 11.7571 14.7914 13.2885 13.6553 14.4541C12.5329 15.6055 11.0154 16.3784 9.41992 16.9346L9.41504 16.9365C9.1464 17.0274 8.85531 17.0233 8.58887 16.9268V16.9277C6.98912 16.3753 5.46932 15.6039 4.3457 14.4531C3.20844 13.2883 2.5 11.757 2.5 9.75V4.5C2.50009 4.1686 2.63187 3.85055 2.86621 3.61621C3.10061 3.3819 3.41856 3.25 3.75 3.25C5.08806 3.25 6.85036 2.426 8.10059 1.33398L8.10547 1.33008C8.35487 1.11709 8.67202 1 9 1ZM11.7803 6.96973C11.4874 6.67683 11.0126 6.67683 10.7197 6.96973L8.25 9.43945L7.28027 8.46973C6.98738 8.17683 6.51262 8.17683 6.21973 8.46973C5.92683 8.76262 5.92683 9.23738 6.21973 9.53027L7.71973 11.0303C7.86038 11.1709 8.05109 11.25 8.25 11.25C8.44891 11.25 8.63962 11.1709 8.78027 11.0303L11.7803 8.03027C12.0732 7.73738 12.0732 7.26262 11.7803 6.96973Z" />
  </svg>
);

// Inline badges matching the mobile `TokenBadges` used in the mobile token picker:
// verified shield (if the token has any verifications, matching the convention
// used by the web `TokenBadges` in components/attachments/Token.tsx) + platform
// icon (clanker, zora, pumpfun, bonk, heaven, paragraph). Kept slim and
// un-pilled so they sit neatly next to the token name rather than using the
// larger pill variant that appears in the token embed card.
const TokenNameBadges: FC<{ token: ApiTokenLink }> = ({ token }) => {
  const verified = (token.verifications?.length ?? 0) > 0;
  const platform = token.source?.platform;

  if (!verified && !platform) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-row items-center gap-1">
      {verified && <VerifiedShieldIcon />}
      {platform && <TokenPlatform platform={platform} />}
    </div>
  );
};

const getMentionsPluginTheme = () => {
  return {
    mention: 'm',
    mentionSuggestionsPopup: 'ms-popup ms-popup-token scrollbar-hide',
  };
};

// Match the mobile `TokenListItem` layout used in the mobile token picker:
// - 40px token icon with chain badge
// - Primary line: formatted token name
// - Secondary line: "<ticker> · <timeAgo>"
// - Right-aligned market cap (with leading "$", via formatTokenStat)
const Entry: FC<EntryComponentProps> = (props) => {
  const {
    mention,

    searchValue: _sv,

    selectMention: _sm,

    theme: _t,

    isFocused: _isFocused,
    ...parentProps
  } = props;

  const token: ApiTokenLink = mention.token;
  const tokenName = formatTokenName(token.name, token.ca, token.chain);
  const timeAgo = token.source?.createdAt
    ? formatTimeAgo(token.source.createdAt)
    : '';
  const marketCap = formatTokenStat(token.marketCap);

  return (
    <div
      {...parentProps}
      className="flex flex-row items-center gap-2 px-4 py-2 hover:bg-overlay-faint"
    >
      <TokenIcon
        iconUrl={token.imageUrl}
        symbol={token.ticker}
        diameter={40}
        chain={token.chain}
        chainImageSize={16}
        imageBordered
      />
      <div className="flex min-w-0 flex-1 flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center overflow-hidden">
          <div className="flex w-full min-w-0 flex-row items-center gap-1">
            <span className="truncate font-semibold">{tokenName}</span>
            <TokenNameBadges token={token} />
          </div>
          <div className="flex flex-row items-center gap-1 text-sm text-muted">
            <span className="truncate">{token.ticker}</span>
            {timeAgo && (
              <>
                <span>∙</span>
                <span className="truncate">{timeAgo}</span>
              </>
            )}
          </div>
        </div>
        {marketCap && (
          <div className="shrink-0 text-base text-default">{marketCap}</div>
        )}
      </div>
    </div>
  );
};

const MENTION_TRIGGER = '$';

const useTokenMentionsComposerPlugin = ({
  onAddMention,
}: {
  onAddMention?: ({ token }: { token: ApiTokenLink }) => void;
} = {}): {
  plugin: EditorPlugin & {
    MentionSuggestions: React.ComponentType<MentionSuggestionsPubProps>;
  };
  renderPlugin: () => ReactPortal;
} => {
  const [open, setOpen] = React.useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = React.useState<string>('');
  const viewerFid = useCachedCurrentUser()?.fid;

  const { data } = useNonSuspenseTokenLinks({
    ticker: mentionSearchTerm,
    intent: 'typeahead',
    contextFid: viewerFid,
    enabled: mentionSearchTerm !== '',
  });

  const tokens = React.useMemo(() => {
    return uniqBy(data?.tokens || [], ({ chain, ca }) => `${chain}:${ca}`);
  }, [data?.tokens]);

  const suggestions: MentionData[] = React.useMemo(() => {
    return tokens.map((token) => ({
      // `id` is used by the plugin as the React list key for suggestions. Use
      // `${chain}:${ca}` since the same contract address can exist on more
      // than one chain.
      id: `${token.chain}:${token.ca}`,
      name: token.ticker,
      token,
    }));
  }, [tokens]);

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

  const onAddMentionChange = React.useCallback(
    (mention: MentionData) => {
      onAddMention?.({ token: mention.token as ApiTokenLink });
    },
    [onAddMention],
  );

  const plugin = React.useMemo(() => {
    return createMentionPlugin({
      mentionTrigger: [MENTION_TRIGGER],
      mentionPrefix: MENTION_TRIGGER,
      // The plugin only works with a set of characters like this, and appends a '*' at the end
      // Using our normal larger regex leads to UI issues
      mentionRegExp: '[a-zA-Z0-9]',
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
          onAddMention={onAddMentionChange}
        />,
        mentionPortalContainer!,
      ),
  };
};

export { useTokenMentionsComposerPlugin };
