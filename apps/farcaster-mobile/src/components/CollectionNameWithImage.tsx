import { ApiAssetCollection } from 'farcaster-client-data';
import React, { FC } from 'react';
import { TextStyle, View } from 'react-native';

import { CollectionImage } from '~/components/CollectionImage';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type CollectionNameWithImageProps = {
  collection: Pick<ApiAssetCollection, 'imageUrl' | 'name'>;
  size?: 'default' | 'small' | 'tiny';
  textColorStyle?: TextStyle;
};

const CollectionNameWithImage: FC<CollectionNameWithImageProps> = ({
  collection,
  size = 'default',
  textColorStyle,
}) => {
  const t = useTheme();

  let textSizeClass;
  switch (size) {
    case 'small':
      textSizeClass = t.textSm;
      break;
    case 'tiny':
      textSizeClass = t.textXs;
      break;
    case 'default':
    default:
      textSizeClass = t.textBase;
  }

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter]}>
      <View
        style={[{ paddingBottom: 1 }, textColorStyle !== undefined && t.mR1]}
      >
        <CollectionImage collection={collection} size={size} />
      </View>
      <Text
        style={[
          textColorStyle ? textColorStyle : t.texts.primary,
          textSizeClass,
          t.flexShrink,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {collection.name}
      </Text>
    </View>
  );
};

CollectionNameWithImage.displayName = 'CollectionNameWithImage';

export { CollectionNameWithImage };
