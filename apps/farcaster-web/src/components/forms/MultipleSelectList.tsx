import { CheckIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ReactNode, useCallback } from 'react';

import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';

export type MultipleSelectListProps<T> = {
  options: T[];
  keyExtractor: (channel: T) => string;
  onEndReached: () => unknown;
  isFetchingNextPage: boolean;
  selectedOptions: T[];
  setSelectedOptions: (options: T[]) => void;
  renderOption(option: T): ReactNode;
  height?: number;
};

const MultipleSelectList = <T,>({
  options,
  selectedOptions,
  setSelectedOptions,
  onEndReached,
  isFetchingNextPage,
  renderOption,
  keyExtractor,
  height,
}: MultipleSelectListProps<T>) => {
  const renderItem = useCallback(
    ({ item }: { item: T }) => {
      const isSelected = selectedOptions.includes(item);

      return (
        <div
          className="flex cursor-pointer flex-row items-center justify-between px-2 hover:bg-overlay-faint"
          onClick={() => {
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
          <div>{renderOption(item)}</div>
          <div className="flex-0 py-1 pl-2">
            <div
              className={cn(
                'flex h-[24px] w-[24px] items-center justify-center rounded-lg text-light',
                isSelected ? 'bg-action-primary' : 'bg-hover',
              )}
            >
              {isSelected && <CheckIcon size={16} />}
            </div>
          </div>
        </div>
      );
    },
    [keyExtractor, renderOption, selectedOptions, setSelectedOptions],
  );

  // We need the div with the scrolling to take max width but setting w-full interferes with the negative
  // right margin on hover, so we make it a full width flex item
  return (
    <div className="flex w-full flex-row">
      <div
        className="only-on-hover-scrollbar flex-1 overflow-y-auto"
        style={{ height }}
      >
        <FlatList
          data={options}
          emptyView={<DefaultEmptyListView message="No channels" />}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </div>
  );
};
MultipleSelectList.displayName = 'MultipleSelectList';

export { MultipleSelectList };
