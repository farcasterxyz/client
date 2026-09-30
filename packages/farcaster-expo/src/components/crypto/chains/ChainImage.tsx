// Metro picks `resolveAssetSource.native.js` (RN) vs `resolveAssetSource.js` (web). Using RN's
// internal module directly breaks web bundling (native-only deps like `Platform`).
import resolveAssetSource from 'expo-asset/build/resolveAssetSource';
import { Image, ImageSource } from 'expo-image';
import { ApiChain } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { Text2 } from '../../design-system';

const Abstract = require('../../../assets/chains/abstract.webp');
const Arbitrum = require('../../../assets/chains/arbitrum.webp');
const Base = require('../../../assets/chains/base.webp');
const Celo = require('../../../assets/chains/celo.webp');
const Degen = require('../../../assets/chains/degen.webp');
const Ethereum = require('../../../assets/chains/ethereum.webp');
const GnosisDark = require('../../../assets/chains/gnosis-dark.webp');
const GnosisLight = require('../../../assets/chains/gnosis-light.webp');
const Hyperevm = require('../../../assets/chains/hyperevm.webp');
const Monad = require('../../../assets/chains/monad.webp');
const Optimism = require('../../../assets/chains/optimism.webp');
const Polygon = require('../../../assets/chains/polygon.webp');
const SolanaDark = require('../../../assets/chains/solana-dark.webp');
const SolanaLight = require('../../../assets/chains/solana-light.webp');
const Unichain = require('../../../assets/chains/unichain.webp');
const ZoraDark = require('../../../assets/chains/zora-dark.webp');
const ZoraLight = require('../../../assets/chains/zora-light.webp');
const Bsc = require('../../../assets/chains/bsc.webp');
const Robinhood = require('../../../assets/chains/robinhood.png');

const CHAIN_IMAGES: Record<'true' | 'false', Record<ApiChain, ImageSource>> = {
  // Dark Mode
  true: {
    abstract: Abstract,
    arbitrum: Arbitrum,
    base: Base,
    celo: Celo,
    degen: Degen,
    ethereum: Ethereum,
    gnosis: GnosisDark,
    hyperevm: Hyperevm,
    'monad-testnet': Monad,
    optimism: Optimism,
    polygon: Polygon,
    solana: SolanaDark,
    unichain: Unichain,
    'base-sepolia': Base,
    zora: ZoraDark,
    bsc: Bsc,
    monad: Monad,
    robinhood: Robinhood,
  },
  // Light Mode
  false: {
    abstract: Abstract,
    arbitrum: Arbitrum,
    base: Base,
    celo: Celo,
    degen: Degen,
    ethereum: Ethereum,
    gnosis: GnosisLight,
    hyperevm: Hyperevm,
    'monad-testnet': Monad,
    optimism: Optimism,
    polygon: Polygon,
    solana: SolanaLight,
    unichain: Unichain,
    'base-sepolia': Base,
    zora: ZoraLight,
    bsc: Bsc,
    monad: Monad,
    robinhood: Robinhood,
  },
};

function resolveChainImageSource(
  raw: ImageSource | null | undefined,
): ImageSource | null {
  if (!raw) {
    return null;
  }
  const resolved = resolveAssetSource(raw as never);
  if (
    resolved &&
    typeof resolved === 'object' &&
    'uri' in resolved &&
    resolved.uri
  ) {
    return { uri: resolved.uri } as ImageSource;
  }
  return raw as ImageSource;
}

type ChainImageProps = {
  chain: ApiChain | undefined;
  size?: number;
  bordered?: boolean;
  inverted?: boolean;
  borderRadius?: number;
  borderWidth?: number;
};

const ChainImage: React.FC<ChainImageProps> = React.memo(
  ({
    chain,
    bordered,
    size = 17,
    borderRadius = 6,
    borderWidth = 1.5,
    inverted = false,
  }) => {
    const t = useTheme();

    if (size === 12) {
      borderRadius = 5;
    }

    const isDark = inverted ? !t.dark : t.dark;
    const rawSource = chain
      ? CHAIN_IMAGES[isDark ? 'true' : 'false'][chain]
      : null;

    // On web, `require()` for static assets may not produce a loadable URI for expo-image;
    // resolve to `{ uri }` so logos render in farcaster-wallet (Expo web).
    const ChainIcon = resolveChainImageSource(rawSource);

    if (!ChainIcon) {
      return (
        <View
          style={[
            t.bgElevated,
            t.itemsCenter,
            t.justifyCenter,
            { width: size, height: size, borderRadius: 6 },
          ]}
        >
          <Text2 weight="bold" size="xs" color="secondary">
            ?
          </Text2>
        </View>
      );
    }

    if (bordered) {
      return (
        <View
          style={[
            t.bgDefault,
            t.itemsCenter,
            t.justifyCenter,
            t.overflowHidden,
            {
              borderRadius: borderRadius,
              width: size,
              height: size,
            },
          ]}
        >
          <Image
            source={ChainIcon}
            cachePolicy="memory-disk"
            style={[
              t.overflowHidden,
              {
                borderRadius: borderRadius - borderWidth,
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
              },
            ]}
          />
        </View>
      );
    }

    return (
      <Image
        source={ChainIcon}
        cachePolicy="memory-disk"
        style={[t.overflowHidden, { borderRadius, width: size, height: size }]}
      />
    );
  },
);

ChainImage.displayName = 'ChainImage';

export { ChainImage };
