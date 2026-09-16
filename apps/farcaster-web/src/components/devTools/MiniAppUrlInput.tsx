import cn from 'classnames';
import {
  isLocalhostUrlOrPrivateIpUrl,
  isPublicUrl,
  toHttpsUrl,
} from 'farcaster-client-data';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { ExternalLink } from '~/components/links/ExternalLink';

const validateUrl = (url: string) => {
  return isPublicUrl(url);
};

const MiniAppUrlInput = ({
  url,
  onUrlChange,
  buttonText,
  onButtonClick,
  isLoading = false,
  hideRefetchButton = false,
  allowLocalhost = false,
}: {
  url?: string | undefined;
  onUrlChange: (url: string | undefined) => void;
  buttonText: string;
  onButtonClick: () => void;
  isLoading?: boolean;
  hideRefetchButton?: boolean;
  allowLocalhost?: boolean;
}) => {
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);
  const [inputUrl, setInputUrl] = useState<string | undefined>(url);

  useEffect(() => {
    if (!url) {
      setIsValidUrl(true);
      return;
    }
    const isValid = validateUrl(url);
    setIsValidUrl(isValid);
    if (isValid) {
      onUrlChange(url);
    }
  }, [url, onUrlChange]);

  const debouncedSetAppUrl = useMemo(
    () =>
      debounce((value: string) => {
        if (value === '') {
          onUrlChange(undefined);
          setIsValidUrl(true);
          return;
        }

        if (isLocalhostUrlOrPrivateIpUrl(value) && allowLocalhost) {
          setIsValidUrl(true);
          onUrlChange(value);
          return;
        }

        value = toHttpsUrl(value);
        const isValid = validateUrl(value);
        setIsValidUrl(isValid);
        if (isValid) {
          onUrlChange(value);
        }
      }, 1000),
    [allowLocalhost, onUrlChange],
  );

  useEffect(() => {
    return () => {
      debouncedSetAppUrl.cancel();
    };
  }, [debouncedSetAppUrl]);

  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value.trim();
    setInputUrl(newUrl);
    debouncedSetAppUrl(newUrl);
  };

  const invalidMessage = useMemo(() => {
    if (
      inputUrl &&
      !allowLocalhost &&
      isLocalhostUrlOrPrivateIpUrl(toHttpsUrl(inputUrl))
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
    return 'The URL is not valid. Please enter a valid URL.';
  }, [allowLocalhost, inputUrl]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">URL</div>
      <div className="flex flex-row items-center gap-2">
        <TextInput
          className={cn('focus:outline-hidden flex-1', {
            '!border-action-red focus:!border-action-red focus:!ring-action-red !bg-red-50 dark:!bg-red-950':
              !isValidUrl && inputUrl,
          })}
          onChange={handleUrlChange}
          value={inputUrl}
          autoCapitalize="none"
          spellCheck={false}
          placeholder="e.g. https://example.com/launch"
        />
        {!hideRefetchButton && (
          <DefaultButton
            className="min-w-[128px]"
            onClick={onButtonClick}
            isLoading={isLoading}
            disabled={!url || !isValidUrl || isLoading}
          >
            {buttonText}
          </DefaultButton>
        )}
      </div>
      <div className="text-sm text-danger">
        {!isValidUrl && inputUrl && <div>{invalidMessage}</div>}
      </div>
    </div>
  );
};

export { MiniAppUrlInput };
