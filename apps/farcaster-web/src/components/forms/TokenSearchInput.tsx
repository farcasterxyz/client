import * as Portal from '@radix-ui/react-portal';
import {
  ApiProfileToken,
  ApiTokenLink,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import {
  formatShorthandNumber,
  useDebouncedValue,
  useNonSuspenseTokenLinks,
} from 'farcaster-client-hooks';
import { Search } from 'lucide-react';
import * as React from 'react';

import { TokenIcon } from '~/components/tokens/TokenIcon';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { cn } from '~/lib/utils';

type TokenSearchInputProps = {
  value: ApiProfileToken | undefined;
  onTokenChange: (token: ApiProfileToken | undefined) => void;
  className?: string;
  autoFocus?: boolean;
};

type TokenPredictionsDropdownProps = {
  tokens: ApiTokenLink[];
  onSelect: (token: ApiTokenLink) => void;
  position: { top: number; left: number; width: number };
};

const TokenPredictionsDropdown = React.forwardRef<
  HTMLDivElement,
  TokenPredictionsDropdownProps
>(({ tokens, onSelect, position }, ref) => {
  if (tokens.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 max-h-[300px] overflow-y-auto rounded-lg border shadow-lg bg-app border-default"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      {tokens.map((token) => (
        <div
          key={`${token.chain}:${token.ca}`}
          className="flex w-full cursor-pointer flex-row items-center p-2 text-left hover:bg-overlay-faint"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(token);
          }}
          role="button"
          tabIndex={0}
        >
          <TokenIcon
            iconUrl={token.imageUrl}
            symbol={token.ticker}
            diameter={40}
            chain={token.chain}
            chainImageSize={14}
            imageBordered
          />
          <div className="ml-1 flex flex-1 flex-row items-center justify-between">
            <div className="flex flex-col">
              <div className="font-semibold">{token.ticker}</div>
              {typeof token.holderCount !== 'undefined' &&
                token.holderCount !== 0 && (
                  <div className="text-sm text-muted">
                    {token.holderCount.toLocaleString()} holders
                  </div>
                )}
            </div>
            {typeof token.marketCap !== 'undefined' && (
              <div className="text-sm text-default">
                ${formatShorthandNumber(token.marketCap)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

TokenPredictionsDropdown.displayName = 'TokenPredictionsDropdown';

export function TokenSearchInput({
  value,
  onTokenChange,
  className,
  autoFocus,
}: TokenSearchInputProps) {
  const placeholder = 'Search by ticker';
  const [query, setQuery] = React.useState(
    value?.token?.ticker?.replace(/^\$/, '') || '',
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue({
    value: query.trim().replace(/^\$/, ''),
    debounceDuration: 150,
  });

  const queryMatchesSelectedToken = React.useMemo(() => {
    return value?.token && query === value.token.ticker?.replace(/^\$/, '');
  }, [query, value?.token]);

  const viewerFid = useCachedCurrentUser()?.fid;

  const { data } = useNonSuspenseTokenLinks({
    ticker: debouncedQuery,
    intent: 'typeahead',
    contextFid: viewerFid,
    enabled:
      debouncedQuery.length > 0 &&
      hasUserInteracted &&
      !queryMatchesSelectedToken,
  });

  const tokens = React.useMemo(() => {
    return data?.tokens || [];
  }, [data?.tokens]);

  const updateDropdownPosition = React.useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  React.useEffect(() => {
    if (!hasUserInteracted || queryMatchesSelectedToken) {
      return;
    }

    if (tokens.length > 0 && query.trim()) {
      setIsOpen(true);
      updateDropdownPosition();
    } else {
      setIsOpen(false);
    }
  }, [
    tokens,
    query,
    hasUserInteracted,
    queryMatchesSelectedToken,
    updateDropdownPosition,
  ]);

  const handleTokenSelect = React.useCallback(
    (token: ApiTokenLink) => {
      const profileToken: ApiProfileToken = {
        tokenUri: buildCaip19TokenUri(token.chain, token.ca),
        token: {
          name: token.name,
          ticker: token.ticker,
          imageUrl: token.imageUrl,
          chain: token.chain,
          ca: token.ca,
        },
      };
      const tickerWithoutDollar = token.ticker.replace(/^\$/, '');
      setQuery(tickerWithoutDollar);
      onTokenChange(profileToken);
      setIsOpen(false);
    },
    [onTokenChange],
  );

  const handleClear = React.useCallback(() => {
    setQuery('');
    onTokenChange(undefined);
    setIsOpen(false);
  }, [onTokenChange]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInContainer = containerRef.current?.contains(target);
      const clickedInDropdown = dropdownRef.current?.contains(target);

      if (!clickedInContainer && !clickedInDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  React.useEffect(() => {
    const handleScroll = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updateDropdownPosition);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [updateDropdownPosition]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg border px-3 py-2 pr-8 text-sm bg-app',
          'border-default',
          'focus-within:outline-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
          className,
        )}
      >
        {value?.token && query === value.token.ticker?.replace(/^\$/, '') && (
          <TokenIcon
            iconUrl={value.token.imageUrl}
            symbol={value.token.ticker}
            diameter={14}
            className="shrink-0"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query ? `$${query}` : ''}
          onFocus={() => setHasUserInteracted(true)}
          onChange={(e) => {
            setHasUserInteracted(true);
            // Strip the $ prefix if user types it
            const newValue = e.target.value.replace(/^\$/, '');
            setQuery(newValue);
            // Clear the selected token if user is typing something different
            if (value && newValue !== value.token?.ticker?.replace(/^\$/, '')) {
              onTokenChange(undefined);
            }
          }}
          onKeyDown={(e) => {
            // Clear entire field when backspace is pressed with a selected token
            if (e.key === 'Backspace' && value && query) {
              e.preventDefault();
              handleClear();
            }
          }}
          placeholder={placeholder}
          className="focus:outline-hidden w-full border-0 bg-transparent p-0 text-sm placeholder:text-muted"
        />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {query ? (
          <div
            onClick={handleClear}
            className="cursor-pointer text-muted hover:text-default"
            role="button"
            tabIndex={0}
          >
            ×
          </div>
        ) : (
          <Search className="size-4 text-muted" />
        )}
      </div>

      {isOpen && tokens.length > 0 && (
        <Portal.Root>
          <TokenPredictionsDropdown
            ref={dropdownRef}
            tokens={tokens.slice(0, 3)}
            onSelect={handleTokenSelect}
            position={dropdownPosition}
          />
        </Portal.Root>
      )}
    </div>
  );
}
