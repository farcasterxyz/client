import { ApiAsset } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { Pressable } from 'react-native';

import { RemoteImage } from '~/components/RemoteImage';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';

type SelectableNftProps = {
  nft: ApiAsset;
  index: number;
  selectedIndex: number | undefined;
  setSelectedIndex: (index: number | undefined) => void;
};

const nftLength = defaultThumbnailDiameter;

const SelectableNft: FC<SelectableNftProps> = memo(
  ({ nft, index, selectedIndex, setSelectedIndex }) => {
    const t = useTheme();

    return (
      <Pressable
        style={[
          t.mB3, // We add bottom margin to create some space between nfts and the scroll bar.
          index > 0 ? t.mL2 : null,
          index === selectedIndex
            ? [t.borderSelectionHighlight]
            : t.borderTransparent,
          t.roundedFull,
          { borderWidth: 2 },
        ]}
        onPress={() => {
          setSelectedIndex(index === selectedIndex ? undefined : index);
        }}
      >
        <RemoteImage
          contentFit="contain"
          uri={nft.imageUrl}
          width={nftLength}
          height={nftLength}
          style={[
            t.roundedFull,
            {
              width: nftLength,
              height: nftLength,
            },
          ]}
        />
      </Pressable>
    );
  },
);

SelectableNft.displayName = 'SelectableNft';

export { nftLength, SelectableNft };
