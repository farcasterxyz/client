import { ApiTokenLink } from 'farcaster-client-data';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import { UsersRound } from 'lucide-react';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';

export function TokenSummary({ token }: { token: ApiTokenLink }) {
  const navigateToProfile = useNavigateToProfile();

  const isGeoRestricted = useWalletGeoRestricted();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  const onPress = React.useCallback(() => {
    if (!isGeoRestricted && navigateInWallet) {
      navigateInWallet({
        path: 'Token',
        params: { chain: token.chain, ca: token.ca, via: 'cast_embed' },
      });
    }
  }, [token.ca, token.chain, isGeoRestricted, navigateInWallet]);

  const onCreatorPress = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (token.source?.creator) {
        e.stopPropagation();
        navigateToProfile({ user: token.source.creator });
      }
    },
    [navigateToProfile, token.source?.creator],
  );

  return (
    <div
      className="flex cursor-pointer flex-col rounded-[12px] p-3 bg-faint"
      onClick={onPress}
    >
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
          <div className="flex flex-col gap-1">
            <div className="font-semibold">${token.ticker}</div>
            {token.source?.creator && (
              <div
                className="group flex flex-row items-center gap-1"
                onClick={onCreatorPress}
              >
                <span className="text-sm text-muted">by</span>
                <Avatar
                  user={token.source.creator}
                  size="xs"
                  className="border-default"
                />
                <span className="text-sm font-medium text-link">
                  {token.source.creator.username}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            {token.marketCap && (
              <div className="flex cursor-pointer items-center gap-2">
                <span className="text-sm font-semibold text-muted ">
                  ${formatShorthandNumber(token.marketCap)}
                </span>
              </div>
            )}
            {token.holderCount && (
              <div className="flex flex-row items-center gap-1">
                <UsersRound size={16} className="text-faint" />
                <span className="text-sm font-medium text-faint">
                  {formatShorthandNumber(token.holderCount)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
