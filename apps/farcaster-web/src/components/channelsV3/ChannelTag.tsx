import classNames from 'classnames';
import { ApiChannel, ApiOnchainTokenMinimal } from 'farcaster-client-data';
import React from 'react';

import { LinkToChannel } from '~/components/links/LinkToChannel';
import { LinkToToken } from '~/components/links/LinkToToken';
import { TokenIcon } from '~/components/tokens/TokenIcon';

import { ChannelImage } from './ChannelImage';
import { ChannelTagSize } from './ChannelTagSize';

type ChannelTagProps = {
  channel: Pick<ApiChannel, 'name' | 'key' | 'imageUrl'>;
  size: ChannelTagSize;
  shouldLinkToChannel: boolean;
  variant?: 'default' | 'direct-cast';
};

const ChannelTag: React.FC<ChannelTagProps> = React.memo(
  ({ channel, size, shouldLinkToChannel, variant = 'default' }) => {
    const tag = React.useMemo(() => {
      return (
        <div
          className={classNames(
            'flex min-w-0 shrink-0 cursor-pointer flex-row items-center space-x-1 rounded-full ',
            size === 'conversation-header'
              ? ''
              : 'px-[6px] py-[3px] bg-surface-secondary',
            variant === 'direct-cast' && '!bg-direct-cast-channel-tag',
          )}
        >
          <ChannelImage channelImageUrl={channel.imageUrl} size={size} />
          <div
            className={classNames(
              // Not using truncate because that implies overflow:hidden which chops off hanging characters a little
              'text-ellipsis text-nowrap leading-[18px]',
              size === 'conversation-header'
                ? shouldLinkToChannel
                  ? 'font-semibold text-link'
                  : 'font-semibold text-default'
                : 'text-[#546473] dark:text-[#9FA3AF]',
            )}
          >
            {channel.key}
          </div>
        </div>
      );
    }, [channel.imageUrl, channel.key, variant, shouldLinkToChannel, size]);

    if (shouldLinkToChannel) {
      return (
        <LinkToChannel
          channelKey={channel.key}
          title={channel.name}
          className="cursor-pointer"
        >
          {tag}
        </LinkToChannel>
      );
    }

    return tag;
  },
);

ChannelTag.displayName = 'ChannelTag';

type TokenTagProps = {
  token: ApiOnchainTokenMinimal;
  size: ChannelTagSize;
  shouldLinkToToken: boolean;
  variant?: 'default' | 'direct-cast';
};

const TokenTag: React.FC<TokenTagProps> = React.memo(
  ({ token, size, shouldLinkToToken, variant = 'default' }) => {
    const truncatedSymbol = React.useMemo(() => {
      const maxLength = 20;
      if (token.symbol.length <= maxLength) {
        return token.symbol;
      }
      return `${token.symbol.substring(0, maxLength)}...`;
    }, [token.symbol]);

    const tag = React.useMemo(() => {
      return (
        <div
          className={classNames(
            'flex min-w-0 shrink-0 cursor-pointer flex-row items-center space-x-1 rounded-full ',
            size === 'conversation-header'
              ? ''
              : 'px-[6px] py-[3px] bg-surface-secondary',
            variant === 'direct-cast' && '!bg-direct-cast-channel-tag',
          )}
        >
          <TokenIcon
            iconUrl={token.imageUrl}
            diameter={16}
            symbol={token.symbol}
          />
          <div
            className={classNames(
              // Not using truncate because that implies overflow:hidden which chops off hanging characters a little
              'text-ellipsis text-nowrap leading-[18px]',
              size === 'conversation-header'
                ? shouldLinkToToken
                  ? 'font-semibold text-link'
                  : 'font-semibold text-default'
                : 'text-[#546473] dark:text-[#9FA3AF]',
            )}
          >
            {truncatedSymbol}
          </div>
        </div>
      );
    }, [
      token.imageUrl,
      token.symbol,
      truncatedSymbol,
      variant,
      shouldLinkToToken,
      size,
    ]);

    if (shouldLinkToToken) {
      return <LinkToToken token={token}>{tag}</LinkToToken>;
    }

    return tag;
  },
);

TokenTag.displayName = 'TokenTag';

export { ChannelTag, TokenTag };
