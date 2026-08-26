import { ApiCastChannelTag } from 'farcaster-client-data';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { CollectionNameWithImage } from '~/components/CollectionNameWithImage';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigateToFeed } from '~/hooks/navigation/useNavigateToFeed';

type ChannelRootCastProps = {
  channelTag: ApiCastChannelTag;
};

const ChannelRootCast = memo(({ channelTag }: ChannelRootCastProps) => {
  const t = useTheme();
  const navigateToFeed = useNavigateToFeed();

  const onPress = useCallback(() => {
    navigateToFeed(channelTag.id);
  }, [channelTag.id, navigateToFeed]);

  const styleView = useMemo(
    () => [
      t.itemsCenter,
      t.justifyCenter,
      t.textCenter,
      t.pY2,
      t.borderBHairline,
      t.borderDefault,
    ],
    [
      t.borderBHairline,
      t.borderDefault,
      t.itemsCenter,
      t.justifyCenter,
      t.pY2,
      t.textCenter,
    ],
  );

  const collection = useMemo(
    () => ({
      imageUrl: channelTag.imageUrl,
      name: channelTag.name,
    }),
    [channelTag.imageUrl, channelTag.name],
  );

  return (
    <Pressable onPress={onPress} style={[t.borderDefault]}>
      <View style={styleView}>
        <CollectionNameWithImage collection={collection} size="small" />
      </View>
    </Pressable>
  );
});
ChannelRootCast.displayName = 'ChannelRootCast';

export { ChannelRootCast };
