import classNames from 'classnames';
import { ApiChain, ApiTokenSourcePlatform } from 'farcaster-client-data';
import React from 'react';

import { Image } from '~/components/images/Image';
import { appPathPrefix } from '~/constants/routePrefixes';
import { useIsDarkMode } from '~/hooks/useIsDarkMode';
import { getOpenGraphFallbackImageUrl } from '~/utils/openGraphUtils';

const CHAIN_IMAGE_URLS: Record<'true' | 'false', Record<ApiChain, string>> = {
  true: {
    abstract: `${appPathPrefix}/images/chains/abstract.webp`,
    arbitrum: `${appPathPrefix}/images/chains/arbitrum.webp`,
    base: `${appPathPrefix}/images/chains/base.webp`,
    celo: `${appPathPrefix}/images/chains/celo.webp`,
    degen: `${appPathPrefix}/images/chains/degen.webp`,
    ethereum: `${appPathPrefix}/images/chains/ethereum.webp`,
    gnosis: `${appPathPrefix}/images/chains/gnosis-dark.webp`,
    hyperevm: `${appPathPrefix}/images/chains/hyperevm.webp`,
    'monad-testnet': `${appPathPrefix}/images/chains/monad.webp`,
    monad: `${appPathPrefix}/images/chains/monad.webp`,
    optimism: `${appPathPrefix}/images/chains/optimism.webp`,
    polygon: `${appPathPrefix}/images/chains/polygon.webp`,
    solana: `${appPathPrefix}/images/chains/solana-dark.webp`,
    unichain: `${appPathPrefix}/images/chains/unichain.webp`,
    'base-sepolia': `${appPathPrefix}/images/chains/base.webp`,
    zora: `${appPathPrefix}/images/chains/zora-dark.webp`,
    bsc: `${appPathPrefix}/images/chains/bsc.webp`,
    robinhood: `${appPathPrefix}/images/chains/robinhood.png`,
  },
  false: {
    abstract: `${appPathPrefix}/images/chains/abstract.webp`,
    arbitrum: `${appPathPrefix}/images/chains/arbitrum.webp`,
    base: `${appPathPrefix}/images/chains/base.webp`,
    celo: `${appPathPrefix}/images/chains/celo.webp`,
    degen: `${appPathPrefix}/images/chains/degen.webp`,
    ethereum: `${appPathPrefix}/images/chains/ethereum.webp`,
    gnosis: `${appPathPrefix}/images/chains/gnosis-light.webp`,
    hyperevm: `${appPathPrefix}/images/chains/hyperevm.webp`,
    'monad-testnet': `${appPathPrefix}/images/chains/monad.webp`,
    monad: `${appPathPrefix}/images/chains/monad.webp`,
    optimism: `${appPathPrefix}/images/chains/optimism.webp`,
    polygon: `${appPathPrefix}/images/chains/polygon.webp`,
    solana: `${appPathPrefix}/images/chains/solana-light.webp`,
    unichain: `${appPathPrefix}/images/chains/unichain.webp`,
    'base-sepolia': `${appPathPrefix}/images/chains/base.webp`,
    zora: `${appPathPrefix}/images/chains/zora-light.webp`,
    bsc: `${appPathPrefix}/images/chains/bsc.webp`,
    robinhood: `${appPathPrefix}/images/chains/robinhood.png`,
  },
};

type ChainImageProps = {
  chain: ApiChain | undefined;
  size?: number;
  bordered?: boolean;
  inverted?: boolean;
  borderRadius?: number;
  borderWidth?: number;
  className?: string;
};

const ChainImage: React.FC<ChainImageProps> = React.memo(
  ({
    chain,
    bordered,
    size = 17,
    borderRadius = 6,
    borderWidth = 1.5,
    inverted = false,
    className,
  }) => {
    const isDarkMode = useIsDarkMode();

    if (size === 12) {
      borderRadius = 5;
    }

    const isDark = inverted ? !isDarkMode : isDarkMode;
    const chainImageUrl = chain
      ? CHAIN_IMAGE_URLS[isDark ? 'true' : 'false'][chain]
      : null;

    if (!chainImageUrl) {
      return (
        <div
          className={classNames(
            'flex items-center justify-center text-secondary bg-elevated',
            className,
          )}
          style={{
            width: size,
            height: size,
            borderRadius: 6,
          }}
        >
          <span className="text-xs font-bold">?</span>
        </div>
      );
    }

    if (bordered) {
      return (
        <div
          className={classNames(
            'bg-default flex items-center justify-center overflow-hidden',
            className,
          )}
          style={{
            borderRadius: borderRadius,
            width: size,
            height: size,
          }}
        >
          <Image
            alt="Chain logo"
            src={chainImageUrl}
            className="object-contain"
            style={{
              borderRadius: borderRadius - borderWidth,
              width: size - borderWidth * 2,
              height: size - borderWidth * 2,
            }}
          />
        </div>
      );
    }

    return (
      <Image
        alt="Chain logo"
        src={chainImageUrl}
        className={classNames('object-contain', className)}
        style={{
          borderRadius,
          width: size,
          height: size,
        }}
      />
    );
  },
);

ChainImage.displayName = 'ChainImage';

function TokenPlatform({ platform }: { platform: ApiTokenSourcePlatform }) {
  const platformImageUrl = React.useMemo(() => {
    switch (platform) {
      case 'zora':
        return `${appPathPrefix}/images/platforms/zora.webp`;
      case 'clanker':
        return `${appPathPrefix}/images/platforms/clanker.webp`;
      case 'bonk':
        return `${appPathPrefix}/images/platforms/bonk.webp`;
      case 'pumpfun':
        return `${appPathPrefix}/images/platforms/pumpfun.webp`;
      case 'heaven':
        return `${appPathPrefix}/images/platforms/heaven.webp`;
      case 'paragraph':
        return `${appPathPrefix}/images/platforms/paragraph.webp`;
      default:
        return getOpenGraphFallbackImageUrl({
          assetName: 'EthereumDiamondPurple',
          assetExtension: 'webp',
        });
    }
  }, [platform]);

  return (
    <Image
      alt="Platform logo"
      src={platformImageUrl}
      className={classNames('h-3 w-3 object-contain bg-app')}
    />
  );
}

export { ChainImage, TokenPlatform };
