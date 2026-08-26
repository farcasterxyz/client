import {
  apiChainDisplayName,
  ApiEthNonFungibleToken,
  chainIdToChain,
  formatDecimal,
} from 'farcaster-client-data';
import React, { useCallback } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../../contexts';
import {
  getFarcasterProNFTImage,
  isFarcasterProNFT,
} from '../../../utils/WalletUtils';
import { Text2 } from '../../design-system/Text';
import { WalletCollectibleIntents } from '../../wallet/collectibles';
import { ChainImage } from '../chains/ChainImage';
import { CollectibleIcon } from './CollectibleIcon';

const HORIZONTAL_PADDING = 16;

export function Collectible({ data }: { data: ApiEthNonFungibleToken }) {
  const t = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isPro = isFarcasterProNFT(data);
  const imageUrl = isPro
    ? getFarcasterProNFTImage({ token: data, size: 'lg' })
    : data.previewUrl || data.imageUrl;

  const Datum = useCallback(
    ({ name, value }: { name: string; value: string | React.ReactNode }) => {
      return (
        <View style={[t.wFull, t.bgSwap, t.roundedLg]}>
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.pX4,
              t.pY3,
              t.borderB,
              { borderColor: t.colors.bgDefault },
            ]}
          >
            <Text2 color="secondary" size="base" weight="regular">
              {name}
            </Text2>
            <Text2
              color="primary"
              size="base"
              weight="medium"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ maxWidth: '70%' }}
            >
              {value}
            </Text2>
          </View>
        </View>
      );
    },
    [t],
  );

  const chain = chainIdToChain(data.chainId?.toString() ?? '');
  const chainName = apiChainDisplayName(chain ?? '');

  const ChainComponent = useCallback(() => {
    if (chain) {
      return (
        <View style={[t.flexRow, t.itemsCenter, t.justifyCenter, { gap: 4 }]}>
          <ChainImage chain={chain} />
          <Text2 color="primary" size="base" weight="medium">
            {chainName}
          </Text2>
        </View>
      );
    }

    return null;
  }, [chain, chainName, t]);

  return (
    <View style={[t.flex1]}>
      <ScrollView contentContainerStyle={[t.p3, { gap: 12 }]}>
        <View style={[t.itemsCenter]}>
          <CollectibleIcon
            imageUrl={imageUrl ?? ''}
            imageSize={screenWidth - HORIZONTAL_PADDING * 2}
            dangerouslyAllowAnimation={isPro}
          />
        </View>
        <View style={[t.wFull, t.bgSwap, t.roundedLg]}>
          <Datum name="Collection" value={data.collection.name} />
          <Datum name="Token ID" value={data.tokenId} />
          {data.usdPrice !== undefined && data.usdPrice > 0 ? (
            <Datum
              name="Floor Price"
              value={`${formatDecimal(data.usdPrice ?? 0)}`}
            />
          ) : null}
          {chain && <Datum name="Chain" value={<ChainComponent />} />}
        </View>
      </ScrollView>
      <WalletCollectibleIntents data={data} />
    </View>
  );
}
