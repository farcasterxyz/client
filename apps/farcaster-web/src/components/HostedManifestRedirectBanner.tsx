import { CheckIcon, CodeIcon, LinkExternalIcon } from '@primer/octicons-react';
import React, { useCallback, useState } from 'react';

import { DefaultButton } from './forms/buttons/DefaultButton';
import { CopyIcon } from './icons/CopyIcon';
import { InfoBanner } from './InfoBanner';
import { ExternalLink } from './links/ExternalLink';

interface HostedManifestRedirectBannerProps {
  manifestId: string;
}

export function HostedManifestRedirectBanner({
  manifestId,
}: HostedManifestRedirectBannerProps) {
  const [urlCopied, setUrlCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const [showVercelConfig, setShowVercelConfig] = useState(false);

  const hostedManifestUrl = `https://api.farcaster.xyz/miniapps/hosted-manifest/${manifestId}`;

  const vercelConfig = JSON.stringify(
    {
      redirects: [
        {
          source: '/.well-known/farcaster.json',
          destination: hostedManifestUrl,
          permanent: false,
        },
      ],
    },
    null,
    2,
  );

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(hostedManifestUrl);
    setUrlCopied(true);
    setTimeout(() => {
      setUrlCopied(false);
    }, 2000);
  }, [hostedManifestUrl]);

  const handleCopyConfig = useCallback(() => {
    navigator.clipboard.writeText(vercelConfig);
    setConfigCopied(true);
    setTimeout(() => {
      setConfigCopied(false);
    }, 2000);
  }, [vercelConfig]);

  return (
    <InfoBanner
      variant="emerald"
      className="mt-6 dark:border-gray-700 dark:bg-gray-800"
    >
      <h3 className="mb-3 text-lg font-semibold text-emerald-800 dark:text-gray-200">
        Next Step: Configure Redirect
      </h3>
      <div className="space-y-4 text-emerald-700 dark:text-gray-300">
        <p className="text-sm">
          Set your server to temporarily redirect (307) requests for{' '}
          <code className="rounded bg-emerald-100 px-1 py-0.5 text-sm text-emerald-900 dark:bg-gray-800 dark:text-gray-200">
            /.well-known/farcaster.json
          </code>{' '}
          to the following Farcaster Hosted Manifest URL:
        </p>

        <div className="flex items-center gap-2">
          <div className="font-mono flex-1 break-all rounded bg-emerald-100 p-3 text-sm text-emerald-900 dark:bg-gray-900 dark:text-gray-200">
            {hostedManifestUrl}
          </div>
          <DefaultButton
            variant="secondary"
            size="sm"
            onClick={handleCopyUrl}
            className="!border-emerald-300 !bg-emerald-200 !text-emerald-800 hover:!bg-emerald-300 dark:!border-gray-600 dark:!bg-gray-700 dark:!text-gray-200 dark:hover:!bg-gray-600"
            aria-label="Copy hosted manifest URL"
          >
            {urlCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          </DefaultButton>
        </div>

        <p className="text-sm">
          Most web frameworks support setting up redirects. Here are some common
          ones:
        </p>

        <ul className="list-inside list-disc space-y-2 text-sm">
          <li>
            <ExternalLink
              href="https://nextjs.org/docs/app/api-reference/next-config-js/redirects"
              title="Next.js Redirects Documentation"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
            >
              Next.js <LinkExternalIcon size={12} className="ml-1" />
            </ExternalLink>
          </li>
          <li>
            <ExternalLink
              href="https://expressjs.com/en/starter/basic-routing.html"
              title="Express Redirects Documentation"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
            >
              Express <LinkExternalIcon size={12} className="ml-1" />
            </ExternalLink>
          </li>
          <li>
            <ExternalLink
              href="https://hono.dev/guides/examples/redirect"
              title="Hono Redirects Documentation"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
            >
              Hono <LinkExternalIcon size={12} className="ml-1" />
            </ExternalLink>
          </li>
          <li>
            <ExternalLink
              href="https://remix.run/docs/en/main/utils/redirect"
              title="Remix Redirects Documentation"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
            >
              Remix <LinkExternalIcon size={12} className="ml-1" />
            </ExternalLink>
          </li>
          <li>
            <DefaultButton
              variant="link"
              onClick={() => setShowVercelConfig(!showVercelConfig)}
              className="!p-0 !text-emerald-600 hover:!text-emerald-800 hover:underline dark:!text-gray-300 dark:hover:!text-gray-100"
            >
              Vercel (Generate <code className="text-xs">vercel.json</code>){' '}
              <CodeIcon size={12} className="ml-1" />
            </DefaultButton>
            <ExternalLink
              href="https://vercel.com/docs/project-configuration#redirects"
              title="Learn more about Vercel redirects"
              className="ml-2 inline-flex items-center text-xs text-emerald-600 hover:text-emerald-800 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Learn more about Vercel redirects"
            >
              (Vercel redirect docs{' '}
              <LinkExternalIcon size={10} className="ml-0.5" />)
            </ExternalLink>
          </li>
        </ul>

        {showVercelConfig && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold text-emerald-800 dark:text-gray-200">
                Vercel Configuration (
                <code className="text-xs">vercel.json</code>)
              </h4>
              <DefaultButton
                variant="secondary"
                size="sm"
                onClick={handleCopyConfig}
                className="!border-emerald-300 !bg-emerald-200 !text-emerald-800 hover:!bg-emerald-300 dark:!border-gray-600 dark:!bg-gray-700 dark:!text-gray-200 dark:hover:!bg-gray-600"
                aria-label="Copy Vercel config"
              >
                {configCopied ? (
                  <div className="flex items-center gap-1">
                    <CheckIcon size={16} className="mr-1" />
                    <span className="text-sm">Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <CopyIcon size={16} />
                    <span className="text-sm">Copy Config</span>
                  </div>
                )}
              </DefaultButton>
            </div>
            <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              {vercelConfig}
            </pre>
            <DefaultButton
              variant="link"
              onClick={() => setShowVercelConfig(false)}
              className="!mt-2 !p-0 !text-sm !text-emerald-600 hover:!text-emerald-800 hover:underline dark:!text-gray-300 dark:hover:!text-gray-100"
            >
              Hide Config
            </DefaultButton>
          </div>
        )}
      </div>
    </InfoBanner>
  );
}
