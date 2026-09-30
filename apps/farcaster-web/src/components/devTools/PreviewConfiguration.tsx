import { CheckIcon } from '@primer/octicons-react';
import cn from 'classnames';
import {
  ApiDomainFrameConfig,
  ApiDomainManifest,
  ApiFrameEmbedNext,
} from 'farcaster-client-data';
import { CopyIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

const CopyToClipboardButton = ({ data }: { data: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(data);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [data]);

  return (
    <DefaultButton
      onClick={copyToClipboard}
      className="absolute right-3 top-3 flex size-8 items-center justify-center p-0"
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
      variant="secondary"
      size="sm"
    >
      {copied ? (
        <CheckIcon className="text-green-500" size={16} />
      ) : (
        <CopyIcon size={16} className="text-gray-500 dark:text-gray-400" />
      )}
    </DefaultButton>
  );
};

const PreviewFarcasterJson = ({
  hideHeader,
  header,
  description,
  manifest,
  isInvalid,
  className,
  disableCopy,
}: {
  hideHeader?: boolean;
  header?: string | React.ReactNode;
  description?: string | React.ReactNode;
  manifest: ApiDomainManifest | ApiDomainFrameConfig | undefined;
  isInvalid?: boolean;
  className?: string;
  disableCopy?: boolean;
}) => {
  const jsonData = manifest ? JSON.stringify(manifest, null, 2) : '';

  if (!header) {
    header = 'Manifest JSON';
  }

  if (!description) {
    description = (
      <span>
        Paste the following into <code>/.well-known/farcaster.json</code>
      </span>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-lg border border-faint">
        {!hideHeader && (
          <div className="border-b px-6 py-4 border-faint">
            <h3 className="text-xl font-semibold text-default">{header}</h3>
            {description && (
              <div className="mt-1 text-sm text-muted">{description}</div>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="text-sm">
            <div className="relative">
              <pre
                className={cn(
                  'max-h-[500px] overflow-auto rounded-md bg-gray-50 p-4 dark:bg-gray-900',
                  className,
                  isInvalid && 'flex items-center justify-center',
                )}
              >
                {isInvalid ? 'Invalid farcaster.json' : jsonData}
              </pre>
              {!isInvalid && !disableCopy && (
                <CopyToClipboardButton data={jsonData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewMiniAppEmbedJson = ({
  description,
  frameEmbed,
  isInvalid,
  className,
}: {
  description?: string | React.ReactNode;
  frameEmbed: ApiFrameEmbedNext;
  isInvalid?: boolean;
  className?: string;
}) => {
  const jsonData = JSON.stringify(frameEmbed, null, 2);
  const htmlData = `<meta name='fc:miniapp' content='${JSON.stringify(
    frameEmbed,
  )}' />`;

  if (!description) {
    description = (
      <span>
        Serve the following JSON from a <code>fc:miniapp</code> meta tag on your
        HTML <code>&lt;head&gt;</code>.
      </span>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div>
        <div className="relative text-base font-semibold">
          <div id="preview" className="absolute -mt-20" />
          Mini App Embed JSON
        </div>
        <div className="text-sm">
          <span className="text-muted">{description}</span>
        </div>
      </div>
      <div className="text-sm">
        <div className="relative">
          <pre
            className={cn(
              'max-h-[500px] overflow-auto rounded-md bg-gray-50 p-4 dark:bg-gray-900',
              className,
              isInvalid && 'flex items-center justify-center',
            )}
          >
            {isInvalid ? 'Invalid mini app embed' : jsonData}
          </pre>
          {!isInvalid && <CopyToClipboardButton data={jsonData} />}
        </div>
      </div>
      <div className="text-sm">
        <div className="text-muted">
          You can paste this meta tag into your HTML <code>&lt;head&gt;</code>.
        </div>
        <div className="relative">
          <pre
            className={cn(
              'max-h-[500px] overflow-auto rounded-md bg-gray-50 p-4 dark:bg-gray-900',
              isInvalid && 'flex items-center justify-center',
            )}
          >
            {isInvalid ? 'Invalid mini app embed' : htmlData}
          </pre>
          {!isInvalid && <CopyToClipboardButton data={htmlData} />}
        </div>
      </div>
    </div>
  );
};

export { CopyToClipboardButton, PreviewFarcasterJson, PreviewMiniAppEmbedJson };
