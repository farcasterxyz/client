import cn from 'classnames';
import {
  isLocalhostUrlOrPrivateIpUrl,
  toHttpsUrl,
} from 'farcaster-client-data';
import { useDebouncedValue } from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { ExternalLink } from '~/components/links/ExternalLink';

const validateDomain = (domain: string) => {
  if (!domain) {
    return false;
  }
  // Match valid domains with TLD and subdomains, or localhost with optional port
  const domainRegex =
    /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};

const MiniAppDomainInput = React.memo(
  ({
    domain,
    onDomainChange,
    buttonText,
    onButtonClick,
    isLoading = false,
  }: {
    domain: string | null;
    onDomainChange: (domain: string | null) => void;
    buttonText: string;
    onButtonClick: () => void;
    isLoading?: boolean;
  }) => {
    const [inputDomain, setInputDomain] = useState<string | null>(domain);

    const isValidDomain = inputDomain ? validateDomain(inputDomain) : true;
    const debouncedDomain = useDebouncedValue({
      value: inputDomain,
      debounceDuration: 1000,
    });

    useEffect(() => {
      if (!debouncedDomain || validateDomain(debouncedDomain)) {
        onDomainChange(debouncedDomain);
      }
    }, [debouncedDomain, onDomainChange]);

    const handleDomainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newDomain = event.target.value.trim();
      setInputDomain(newDomain);
    };

    const invalidMessage = useMemo(() => {
      if (
        inputDomain &&
        isLocalhostUrlOrPrivateIpUrl(toHttpsUrl(inputDomain))
      ) {
        return (
          <div className="flex flex-row gap-1">
            <span>localhost is not supported.</span>
            <ExternalLink
              href="https://miniapps.farcaster.xyz/docs/guides/sharing#using-localhost"
              title="Learn more in the docs"
            >
              Learn more in the docs
            </ExternalLink>
          </div>
        );
      }
      return 'The domain is not valid. Please enter a valid domain.';
    }, [inputDomain]);

    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Domain</div>
        <div className="flex flex-row items-center gap-2">
          <TextInput
            className={cn('flex-1', {
              '!border-action-red focus:!border-action-red focus:!ring-action-red !bg-red-50 dark:!bg-red-950':
                !isValidDomain && inputDomain,
            })}
            onChange={handleDomainChange}
            value={inputDomain ?? ''}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="e.g. example.com"
          />
          <DefaultButton
            className="min-w-[128px]"
            onClick={onButtonClick}
            isLoading={isLoading}
            disabled={!domain || !isValidDomain || isLoading}
          >
            {buttonText}
          </DefaultButton>
        </div>
        <div className="text-sm text-danger">
          {!isValidDomain && inputDomain && <div>{invalidMessage}</div>}
        </div>
      </div>
    );
  },
);

export { MiniAppDomainInput };
