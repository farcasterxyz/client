import { Octicons } from '@expo/vector-icons';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ApiFrame } from 'farcaster-client-data';
import { Text2 } from 'farcaster-expo';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import { MiniAppShareExtensionRow } from './MiniAppShareExtensionRow';

interface MiniAppShareExtensionListProps {
  apps: ApiFrame[];
  onPress: (frame: ApiFrame, row: number) => void;
  onClose: () => void;
}

export const MiniAppShareExtensionList: React.FC<MiniAppShareExtensionListProps> =
  React.memo(({ apps, onPress, onClose }) => {
    const t = useTheme();

    const keyExtractor = React.useCallback(
      (item: ApiFrame) => item.domain || item.name,
      [],
    );

    const renderItem = React.useCallback(
      ({ item, index }: { item: ApiFrame; index: number }) => (
        <MiniAppShareExtensionRow
          item={item}
          index={index}
          onPress={onPress}
          numItems={apps.length}
        />
      ),
      [onPress, apps],
    );

    const ListHeaderComponent = React.useCallback(
      () => (
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.pX4,
            { paddingVertical: 7 },
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Octicons
              name="chevron-left"
              size={24}
              color={t.colors.text.primary}
            />
          </TouchableOpacity>
          <Text2 weight="semibold" style={[t.flex1, t.textCenter]}>
            Mini Apps
          </Text2>
        </View>
      ),
      [
        onClose,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.pX4,
        t.flex1,
        t.textCenter,
        t.colors.text.primary,
      ],
    );

    return (
      <View style={[t.flex, t.flexCol]}>
        <BottomSheetFlatList
          data={apps}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          stickyHeaderIndices={[0]}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={[t.p4]}
        />
      </View>
    );
  });

MiniAppShareExtensionList.displayName = 'MiniAppShareExtensionList';
