import { FlashList } from '@shopify/flash-list';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import {
  MenuEntry,
  MenuEntryConfig,
} from '~/components/FullScreenMenu/MenuEntry';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

interface FullScreenMenuProps {
  items: MenuEntryConfig[];
}

const FullScreenMenu: FC<FullScreenMenuProps> = memo(({ items }) => {
  const t = useTheme();
  const extraData = useCommonFlatListExtraData();

  return (
    <View style={[t.hFull, t.borderDefault, t.borderTHairline]}>
      <FlashList
        data={items}
        keyExtractor={({ title }) => title}
        extraData={extraData}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderItem}
      />
    </View>
  );
});

const renderItem = ({ item }: { item: MenuEntryConfig }) => {
  return <MenuEntry {...item} />;
};

FullScreenMenu.displayName = 'FullScreenMenu';

export { FullScreenMenu };
