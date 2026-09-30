import { FlashList } from '@shopify/flash-list';
import { CheckIcon } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { onEndReachedThreshold } from '~/constants/FlatList';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

export type MultipleSelectListProps<T> = {
  options: T[];
  keyExtractor: (item: T) => string;
  onEndReached: () => unknown;
  selectedOptions: T[];
  setSelectedOptions: (options: T[]) => void;
  renderOption(option: T): React.ReactNode;
};

const MultipleSelectList = <T,>({
  options,
  selectedOptions,
  setSelectedOptions,
  onEndReached,
  renderOption,
  keyExtractor,
}: MultipleSelectListProps<T>) => {
  const t = useTheme();

  // Pass selectedOptions as extraData otherwise we don't get re-renders when selectedOptions changes
  const renderItem = useCallback(
    ({ item, extraData }: { item: T; extraData?: T[] }) => {
      const isSelected = (extraData ?? []).includes(item);

      return (
        <Pressable
          onPress={() => {
            const key = keyExtractor(item);

            if (isSelected) {
              setSelectedOptions(
                selectedOptions.filter(
                  (option) => keyExtractor(option) !== key,
                ),
              );
            } else {
              setSelectedOptions([...selectedOptions, item]);
            }
          }}
        >
          <View
            style={[
              t.flexRow,
              t.justifyBetween,
              t.mL2,
              t.itemsCenter,
              t.borderBHairline,
              t.borderDefault,
            ]}
          >
            <View>{renderOption(item)}</View>
            <View style={[t.pX2, t.pY1, t.flex0]}>
              <View
                style={[
                  isSelected ? t.bgActionPrimary : t.bgHover,
                  { height: 24, width: 24 },
                  t.flex,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.roundedLg,
                ]}
              >
                {isSelected && (
                  <CheckIcon size={16} color={t.colors.text.light} />
                )}
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [keyExtractor, renderOption, selectedOptions, setSelectedOptions, t],
  );

  return (
    <FlashList
      keyExtractor={keyExtractor}
      data={options}
      extraData={selectedOptions}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      contentContainerStyle={{ paddingRight: sizes.s2, paddingLeft: sizes.s2 }}
      {...STANDARD_FLASHLIST_PERF_PROPS}
      renderItem={renderItem}
    />
  );
};

MultipleSelectList.displayName = 'MultipleSelectList';

export { MultipleSelectList };
