import { LocationIcon } from '@primer/octicons-react';
import * as Portal from '@radix-ui/react-portal';
import cn from 'classnames';
import { ApiLocation } from 'farcaster-client-data';
import { useNonSuspenseFindLocation } from 'farcaster-client-hooks';
import React, {
  forwardRef,
  InputHTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import googleOnNonWhite from '~/assets/google/google_on_non_white.png';
import googleOnWhite from '~/assets/google/google_on_white.png';
import { Image } from '~/components/images/Image';

type LocationSearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> & {
  value: ApiLocation | undefined;
  onLocationChange: (location: ApiLocation | undefined) => void;
  autoFocus?: boolean;
};

const LocationSearchInput = memo(
  forwardRef<HTMLInputElement, LocationSearchInputProps>(
    ({ className, value, onLocationChange, autoFocus, ...props }, _) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const inputRef = useRef<HTMLInputElement>(null);
      const [query, setQuery] = useState(value?.description || '');
      const [isFocused, setIsFocused] = useState(false);
      const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
      });

      useEffect(() => {
        if (autoFocus && inputRef.current) {
          inputRef.current.focus();
        }
      }, [autoFocus]);

      const shouldSearch =
        isFocused && query.length > 0 && query !== value?.description;

      const { data: locationsData } = useNonSuspenseFindLocation({
        q: shouldSearch ? query : '',
      });
      const predictions = locationsData?.result.predictions;

      const shouldShowDropdown =
        shouldSearch && predictions && predictions.length > 0;

      useEffect(() => {
        if (shouldShowDropdown && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      }, [shouldShowDropdown]);

      const handlePredictionClick = useCallback(
        (prediction: ApiLocation) => {
          setQuery(prediction.description);
          onLocationChange(prediction);
          inputRef.current?.blur();
        },
        [onLocationChange],
      );

      const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const newQuery = e.target.value;
          setQuery(newQuery);
          if (value && newQuery !== value.description) {
            onLocationChange(undefined);
          }
        },
        [value, onLocationChange],
      );

      return (
        <div className="relative" ref={containerRef}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className={cn(
              'w-full rounded border bg-input p-2 text-sm border-default text-default',
              className,
            )}
            placeholder="Enter your metro area"
            {...props}
          />
          {shouldShowDropdown && (
            <Portal.Root>
              <LocationPredictionsDropdown
                predictions={predictions}
                onSelect={handlePredictionClick}
                position={dropdownPosition}
              />
            </Portal.Root>
          )}
        </div>
      );
    },
  ),
);

LocationSearchInput.displayName = 'LocationSearchInput';

interface LocationPredictionsDropdownProps {
  predictions: ApiLocation[];
  onSelect: (prediction: ApiLocation) => void;
  position: { top: number; left: number; width: number };
}

const LocationPredictionsDropdown: React.FC<LocationPredictionsDropdownProps> =
  memo(({ predictions, onSelect, position }) => {
    const limitedPredictions = predictions.slice(0, 5);

    return (
      <div
        className="fixed z-50 mt-1 rounded-lg border shadow-lg bg-app border-default"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
      >
        {limitedPredictions.map((prediction) => (
          <div
            key={prediction.placeId}
            role="button"
            tabIndex={0}
            className="flex w-full cursor-pointer items-center justify-between border-b px-4 py-3 text-left border-default last:border-b-0 hover:bg-overlay-medium"
            onClick={() => onSelect(prediction)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(prediction);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <LocationIcon size={14} className="text-muted" />
              <span className="text-sm text-default">
                {prediction.description}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-end px-2 py-1">
          <span className="text-xs text-muted">via </span>
          <Image
            src={googleOnWhite}
            alt="Google"
            className="ml-1 h-[18px] w-[60px] object-contain dark:hidden"
          />
          <Image
            src={googleOnNonWhite}
            alt="Google"
            className="ml-1 hidden h-[18px] w-[60px] object-contain dark:block"
          />
        </div>
      </div>
    );
  });

LocationPredictionsDropdown.displayName = 'LocationPredictionsDropdown';

export { LocationSearchInput };
