import { ApiOnchainTokenMinimal } from 'farcaster-client-data';
import { FC, memo, ReactNode, useCallback } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';

type LinkToTokenProps = {
  token: ApiOnchainTokenMinimal;
  children: ReactNode;
};

const LinkToToken: FC<LinkToTokenProps> = memo(({ token, children }) => {
  const isGeoRestricted = useWalletGeoRestricted();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isGeoRestricted && navigateInWallet) {
        e.stopPropagation();
        navigateInWallet({
          path: 'Token',
          params: {
            chain: token.chain,
            ca: token.ca,
            via: 'cast_tag',
          },
        });
      }
    },
    [isGeoRestricted, navigateInWallet, token.ca, token.chain],
  );

  return (
    <div className="cursor-pointer" onClick={handleClick}>
      {children}
    </div>
  );
});

LinkToToken.displayName = 'LinkToToken';

export { LinkToToken };
