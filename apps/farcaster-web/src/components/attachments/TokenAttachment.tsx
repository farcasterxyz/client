import { ApiChain } from 'farcaster-client-data';
import { useNonSuspenseToken } from 'farcaster-client-hooks';
import React, { useCallback } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { TokenSummary } from '~/components/tokens/TokenSummary';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

type TokenAttachmentProps = {
  chain: ApiChain;
  ca: string;
  disabled?: boolean;
  skipWrapperStyles?: boolean;
};

function TokenAttachment({
  chain,
  ca,
  disabled = false,
}: TokenAttachmentProps) {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return <AuthedTokenAttachment chain={chain} ca={ca} disabled={disabled} />;
  }

  return <UnauthedTokenAttachment chain={chain} ca={ca} disabled={disabled} />;
}

function UnauthedTokenAttachment({
  chain,
  ca,
  disabled = false,
}: {
  chain: ApiChain;
  ca: string;
  disabled?: boolean;
}) {
  const { data: token } = useNonSuspenseToken({
    params: {
      chain,
      ca,
    },
  });
  const navigate = useExternalNavigate();

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }
    const url = `https://dexscreener.com/${chain}/${ca}`;
    navigate({ to: url, openInNewTab: true });
  }, [chain, ca, disabled, navigate]);

  if (!token?.token) {
    return null;
  }

  return (
    <div
      className="relative w-full flex-row items-center rounded-[12px] border border-default"
      onClick={handleClick}
    >
      <TokenSummary token={token.token} />
    </div>
  );
}

function AuthedTokenAttachment({
  chain,
  ca,
  disabled = false,
}: {
  chain: ApiChain;
  ca: string;
  disabled?: boolean;
}) {
  const { data: token } = useNonSuspenseToken({ params: { chain, ca } });
  const navigate = useExternalNavigate();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;
  const isGeoRestricted = useWalletGeoRestricted();

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }

    if (!isGeoRestricted && navigateInWallet) {
      navigateInWallet({
        path: 'Token',
        params: {
          chain,
          ca,
          via: 'cast_embed',
        },
      });
    } else {
      const url = `https://dexscreener.com/${chain}/${ca}`;
      navigate({ to: url, openInNewTab: true });
    }
  }, [isGeoRestricted, navigateInWallet, chain, ca, disabled, navigate]);

  if (!token?.token) {
    return null;
  }

  return (
    <div
      className="relative w-full flex-row items-center rounded-[12px] border border-default"
      onClick={handleClick}
    >
      <TokenSummary token={token.token} />
    </div>
  );
}

export { TokenAttachment };
