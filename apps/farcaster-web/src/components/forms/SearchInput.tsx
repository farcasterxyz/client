import { SearchIcon, SlidersIcon, XIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  forwardRef,
  InputHTMLAttributes,
  memo,
  useCallback,
  useState,
} from 'react';

import { AdvancedSearchModal } from '~/components/modals/AdvancedSearchModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  onClear: () => void;
  PrefixComponent?: React.ReactNode;
  showModSelectorHint?: boolean;
  placeholder?: string;
  showFilterIcon?: boolean;
  showSearchIcon?: boolean;
  showClearIcon?: boolean;
  variant?: 'default' | 'muted';
};

function canUseCmd() {
  return (
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  );
}

const SearchInput = memo(
  forwardRef<HTMLInputElement, SearchInputProps>(
    (
      {
        className,
        PrefixComponent,
        onFocus,
        onBlur,
        onClear,
        placeholder,
        showModSelectorHint,
        showFilterIcon = false,
        showSearchIcon = true,
        showClearIcon = true,
        variant = 'default',
        ...props
      },
      ref,
    ) => {
      const { trackEvent } = useAnalytics();

      const [isFocused, setIsFocused] = useState(false);
      const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
      const [searchQuery, setSearchQuery] = useState(
        (props.value as string) || '',
      );

      const handleFilterApply = useCallback(
        (newQuery: string) => {
          setSearchQuery(newQuery);
          if (props.onChange) {
            const event = {
              target: { value: newQuery },
            } as React.ChangeEvent<HTMLInputElement>;
            props.onChange(event);
          }
        },
        [props],
      );

      const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchQuery(e.target.value);
          if (props.onChange) {
            props.onChange(e);
          }
        },
        [props],
      );

      const inputPadding = showSearchIcon ? 'pl-10 pr-10' : 'px-4';
      return (
        <>
          <div className="relative flex min-h-8 flex-row flex-wrap items-center gap-1">
            {PrefixComponent ||
              (showSearchIcon && (
                <SearchIcon
                  className={cn(
                    'absolute left-[14px] top-[9px] text-faint',
                    isFocused && 'text-focused-search-icon',
                  )}
                />
              ))}
            <input
              type="search"
              ref={ref}
              {...props}
              onChange={handleInputChange}
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
              placeholder={placeholder ?? 'Search casts, channels and users'}
              className={cn(
                variant === 'muted'
                  ? 'bg-[#F3F3F3] dark:bg-[#342942]'
                  : 'bg-input',
                'outline-hidden w-full rounded-full border py-2 text-sm text-default',
                inputPadding,
                isFocused
                  ? 'border-focused-search'
                  : variant === 'muted'
                    ? 'border-transparent'
                    : 'border-default',
                className,
              )}
            />
            {showModSelectorHint &&
              !showFilterIcon &&
              !isFocused &&
              props.value === '' && (
                <div className="absolute inset-y-0 right-0 hidden py-1.5 pr-1.5 mdlg:flex">
                  <kbd className="inline-flex items-center rounded border px-1 font-sans text-xs border-faint text-faint">
                    {!canUseCmd() ? 'Ctrl+K' : 'Cmd+K'}
                  </kbd>
                </div>
              )}
            <div className="absolute right-2 top-2 flex items-center space-x-3">
              {props.value !== '' && showClearIcon && (
                <div
                  className={cn(
                    'cursor-pointer justify-center rounded-full p-0.5 bg-overlay',
                    'flex items-center',
                  )}
                  onClick={onClear}
                >
                  <XIcon size={16} className="font-semibold text-white" />
                </div>
              )}
              {showFilterIcon && (
                <div
                  className="flex cursor-pointer items-center p-0.5"
                  onClick={() => {
                    trackEvent(AnalyticsEvent.ClickStartAdvancedSearch, {});
                    setShowAdvancedSearch(true);
                  }}
                >
                  <SlidersIcon
                    size={16}
                    className={cn(
                      isFocused && 'text-focused-search-icon',
                      'rotate-90 transform',
                    )}
                  />
                </div>
              )}
            </div>
          </div>
          {showAdvancedSearch && (
            <AdvancedSearchModal
              onClose={() => setShowAdvancedSearch(false)}
              onApply={handleFilterApply}
              currentQuery={searchQuery}
            />
          )}
        </>
      );
    },
  ),
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
