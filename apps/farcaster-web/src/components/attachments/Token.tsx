import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLinkCore } from 'farcaster-client-data';
import { formatBuyerCount, formatTimeAgo } from 'farcaster-client-hooks';
import { animate, motion, useMotionValue } from 'motion/react';
import React, { useCallback } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { TokenPlatform } from '~/components/chain/ChainImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

type TokenEmbedProps = {
  token: ApiTokenLinkCore;
  disabled: boolean;
  location?: 'feed' | 'direct-casts';
};

function TokenEmbed({ token, disabled, location }: TokenEmbedProps) {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return (
      <AuthedTokenEmbed token={token} disabled={disabled} location={location} />
    );
  }

  return (
    <UnauthedTokenEmbed token={token} disabled={disabled} location={location} />
  );
}

function UnauthedTokenEmbed({ token, disabled }: TokenEmbedProps) {
  const navigate = useExternalNavigate();

  const handleClick = useCallback(
    (e: React.SyntheticEvent) => {
      if (disabled) {
        return;
      }

      e.stopPropagation();

      const url = `https://dexscreener.com/${token.chain}/${token.ca}`;
      navigate({ to: url, openInNewTab: true });
    },
    [disabled, navigate, token.ca, token.chain],
  );

  return (
    <div
      className="relative w-full flex-row items-center rounded-[12px] border border-default"
      onClick={handleClick}
    >
      <TokenInner token={token} />
    </div>
  );
}

function AuthedTokenEmbed({ token, disabled, location }: TokenEmbedProps) {
  const navigate = useExternalNavigate();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;
  const isGeoRestricted = useWalletGeoRestricted();

  const { trackEvent } = useAnalytics();

  const handleClick = useCallback(
    (e: React.SyntheticEvent) => {
      if (disabled) {
        return;
      }

      e.stopPropagation();

      trackEvent(AnalyticsEvent.ClickTokenEmbed, {
        chain: token.chain,
        ca: token.ca,
        location,
      });

      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'Token',
          params: { chain: token.chain, ca: token.ca, via: 'cast_embed' },
        });
      } else {
        const url = `https://dexscreener.com/${token.chain}/${token.ca}`;
        navigate({ to: url, openInNewTab: true });
      }
    },
    [
      disabled,
      isGeoRestricted,
      location,
      navigate,
      navigateInWallet,
      token.ca,
      token.chain,
      trackEvent,
    ],
  );

  const scale = useMotionValue(1);

  const handleMouseDown = () => {
    if (disabled) {
      return;
    }
    animate(scale, 0.9, { type: 'spring', stiffness: 300, damping: 20 });
  };

  const handleMouseUp = () => {
    animate(scale, 1, { type: 'spring', stiffness: 300, damping: 20 });
  };

  return (
    <motion.div
      style={{ scale }}
      className="relative w-full flex-row items-center overflow-hidden rounded-[12px] border border-default"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={disabled ? undefined : handleClick}
    >
      <TokenInner token={token} />
    </motion.div>
  );
}

function TokenBadges({ token }: { token: ApiTokenLinkCore }) {
  const verified = (token.verifications?.length ?? 0) > 0;
  const platform = token.source?.platform;
  const creator = token.source?.creator;

  if (!verified && !creator && !platform) {
    return null;
  }

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      {verified && (
        <div className="rounded-[16px] p-1 bg-swap">
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            className="dark:stroke-[#1b1429'] fill-action-purple stroke-[#f8f6ff]"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
      )}
      {platform && (
        <div className="rounded-[16px] p-1 bg-swap">
          <TokenPlatform platform={platform} />
        </div>
      )}
    </div>
  );
}

function TokenInner({ token }: { token: ApiTokenLinkCore }) {
  return (
    <div className="pointer-events-none flex cursor-pointer flex-col bg-gradient-to-b from-[#FFF] to-[#F0F0F0] p-3 dark:from-[#101010] dark:to-[#141414]">
      <div className="flex flex-row items-center gap-2">
        <TokenIcon
          iconUrl={token.imageUrl}
          symbol={token.ticker}
          diameter={48}
          chain={token.chain}
          chainImageSize={16}
          imageBordered
        />
        <div className="flex flex-1 flex-row items-center justify-between">
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2">
              <div className="line-clamp-1 font-semibold">{token.name}</div>
              <TokenBadges token={token} />
            </div>
            {token.source?.creator && (
              <div className="group flex flex-row items-center gap-1">
                <span className="text-sm text-muted">by</span>
                <Avatar
                  user={token.source.creator}
                  size="xs"
                  className="border-default"
                />
                <span className="text-sm font-medium text-muted">
                  {token.source.creator.username}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-row items-center justify-between px-2">
        <div className="flex flex-col justify-center gap-1">
          <div className="text-sm font-medium text-faint">TICKER</div>
          <div className="flex cursor-pointer items-center gap-2">
            <span className="text-sm font-medium text-muted ">
              ${token.ticker}
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center space-x-4">
          <div className="flex flex-col justify-center gap-1">
            <div className="text-sm font-medium text-faint">BUYERS</div>
            <div className="flex cursor-pointer items-center gap-2">
              <span className="text-sm font-medium text-muted ">
                {token.holderCount
                  ? `${formatBuyerCount(token.holderCount)}`
                  : '-'}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="text-sm font-medium text-faint">AGE</div>
            <div className="flex cursor-pointer items-center gap-2">
              <span className="text-sm font-medium text-muted">
                {token.source?.createdAt
                  ? `${formatTimeAgo(token.source?.createdAt)}`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TokenEmbed };
