import cn from 'classnames';
import { ApiLocation } from 'farcaster-client-data';
import { useNonSuspenseFindLocation } from 'farcaster-client-hooks';
import {
  FC,
  InputHTMLAttributes,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Location } from '~/components/location/Location';
import { useSelectInputKeyboardShortcuts } from '~/hooks/useSelectInputKeyboardShortcuts';
import { locationKeyExtractor } from '~/utils/keyExtractorUtils';

type LocationInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value'
> & {
  onValueChange: (location: ApiLocation) => void;
  value: ApiLocation;
};

const LocationInput: FC<LocationInputProps> = memo(
  ({
    className,
    onBlur,
    onChange,
    onFocus,
    onValueChange,
    value,
    ...props
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    const isExpanded = !!(value?.description && isFocused);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data } = useNonSuspenseFindLocation({
      q: value.description?.split(',')[0] || '',
    });

    const locations = useMemo(
      () => data?.result.predictions,
      [data?.result.predictions],
    );

    const onLocationSelected = useCallback(
      (location: ApiLocation) => {
        onValueChange(location);

        if (inputRef.current) {
          inputRef.current.blur();
        }
      },
      [onValueChange],
    );

    const { focusedIndex, onKeyDown } = useSelectInputKeyboardShortcuts({
      data: locations,
      onEnter: useCallback(
        ({ item }: { item: ApiLocation | undefined }) => {
          if (item) {
            onLocationSelected(item);
          }
        },
        [onLocationSelected],
      ),
    });

    return (
      <div className="relative">
        <input
          type="text"
          ref={inputRef}
          className={cn(
            'w-full rounded border bg-input p-2 text-sm border-default text-default',
            className,
          )}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            if (onChange) {
              onChange(e);
            }

            onValueChange({ description: e.target.value, placeId: '' });
          }}
          onFocus={(e) => {
            if (onFocus) {
              onFocus(e);
            }

            setIsFocused(true);
          }}
          onBlur={(e) => {
            if (onBlur) {
              onBlur(e);
            }

            setIsFocused(false);
          }}
          value={value?.description || ''}
          {...props}
        />
        {isExpanded && (
          <LocationSelectPlacesList
            focusedIndex={focusedIndex}
            locations={locations}
            onLocationSelected={onLocationSelected}
          />
        )}
      </div>
    );
  },
);

LocationInput.displayName = 'LocationInput';

type LocationSelectPlacesListProps = {
  focusedIndex: number;
  locations: ApiLocation[] | undefined;
  onLocationSelected: (location: ApiLocation) => void;
};

const LocationSelectPlacesList: FC<LocationSelectPlacesListProps> = memo(
  ({ focusedIndex, onLocationSelected, locations }) => {
    const renderItem = useCallback(
      ({ item, index }: { item: ApiLocation; index: number }) => {
        return (
          <Location
            className={cn(
              'cursor-pointer hover:bg-overlay-faint',
              index === focusedIndex && 'bg-overlay-faint',
            )}
            onClick={(e) => {
              e.preventDefault();
              onLocationSelected(item);
            }}
            location={item}
          />
        );
      },
      [focusedIndex, onLocationSelected],
    );

    if (!locations) {
      return (
        <div className="absolute mt-1 flex w-full items-center justify-center rounded-lg border p-4 bg-app border-default">
          <LoadingIndicator />
        </div>
      );
    }

    return (
      <div
        className="absolute z-10 w-full"
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <FlatList
          containerClassName="border-default mt-1 max-h-[320px] rounded-lg border-x border-t bg-app overflow-y-scroll"
          data={locations}
          renderItem={renderItem}
          keyExtractor={locationKeyExtractor}
          emptyView={
            <DefaultEmptyListView
              className="mt-1 rounded-lg border text-sm border-default"
              message="No locations match your query"
            />
          }
        />
      </div>
    );
  },
);

export { LocationInput };
