import cn from 'classnames';
import { InfoIcon, SignatureIcon } from 'lucide-react';
import React, { useMemo } from 'react';

import { BlueBanner } from '~/components/BlueBanner';
import { HostedManifestsButton } from '~/components/devTools/HostedManifestsButton';
import { ViewDocsButton } from '~/components/devTools/ViewDocsButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useNavigate } from '~/hooks/navigation/useNavigate';

export const MANIFEST_ASSOCIATION_STATES = [
  'invalid',
  'missing',
  'registered-current-user',
  'registered-another-user',
  'unregistered',
] as const;

export type ManifestStatus = (typeof MANIFEST_ASSOCIATION_STATES)[number];

interface ManifestNoticeOverwrites {
  text?: string;
  subtext?: string;
  button?: React.ReactNode;
}

interface ManifestNoticeProps {
  domain: string;
  manifestStatus: ManifestStatus;
  overwrites?: Partial<Record<ManifestStatus, ManifestNoticeOverwrites>>;
}

const NoticeButton = React.memo(
  ({
    domain,
    manifestStatus,
    overwrites,
  }: {
    domain: string;
    manifestStatus: ManifestStatus;
    overwrites: Partial<Record<ManifestStatus, ManifestNoticeOverwrites>>;
  }) => {
    const navigate = useNavigate();
    if (overwrites[manifestStatus]?.button) {
      return <>{overwrites[manifestStatus]?.button}</>;
    }

    const canViewHostedManifests = true;

    if (manifestStatus === 'missing' && canViewHostedManifests) {
      return (
        <HostedManifestsButton title="Create Hosted Manifest" domain={domain} />
      );
    }
    if (manifestStatus === 'missing' && !canViewHostedManifests) {
      return (
        <ViewDocsButton href="https://miniapps.farcaster.xyz/docs/guides/loading" />
      );
    }

    if (manifestStatus === 'unregistered' || manifestStatus === 'invalid') {
      return (
        <DefaultButton
          variant="secondary"
          onClick={() => {
            navigate({
              to: 'developersMiniAppManifest',
              params: {},
              searchParams: {
                domain: domain,
              },
            });
          }}
        >
          <div className="flex flex-row items-center gap-2">
            <SignatureIcon className="size-4" />
            Manifest Tool
          </div>
        </DefaultButton>
      );
    }
    return null;
  },
);

export const ManifestNotice = React.memo(
  ({ domain, manifestStatus, overwrites = {} }: ManifestNoticeProps) => {
    const noticeText = useMemo(() => {
      if (overwrites[manifestStatus]?.text) {
        return overwrites[manifestStatus]?.text;
      }

      let croppedDomain = domain;
      if (domain.length > 32) {
        croppedDomain = 'This domain';
      }

      if (manifestStatus === 'invalid') {
        return `${croppedDomain} has an invalid manifest.`;
      }
      if (manifestStatus === 'missing') {
        return `${croppedDomain} does not have a valid manifest setup.`;
      }
      if (manifestStatus === 'registered-current-user') {
        return `${croppedDomain} is associated with your account.`;
      }
      if (manifestStatus === 'registered-another-user') {
        return `${croppedDomain} is associated with another account.`;
      }
      return `${croppedDomain} is not associated with an account.`;
    }, [domain, manifestStatus, overwrites]);

    const noticeSubtext = useMemo(() => {
      if (overwrites[manifestStatus]?.subtext) {
        return overwrites[manifestStatus]?.subtext;
      }

      if (manifestStatus === 'invalid') {
        return 'Please fix the manifest.';
      }
      if (manifestStatus === 'unregistered') {
        return 'To publish it navigate to the manifest tool and verify authorship.';
      }
      return undefined;
    }, [manifestStatus, overwrites]);

    return (
      <BlueBanner
        height={226}
        variant={manifestStatus === 'invalid' ? 'error' : 'info'}
      >
        <div className="flex flex-row gap-3 lg:items-center">
          <InfoIcon
            className={cn('h-6 w-6 lg:h-4 lg:w-4', {
              'text-informative': manifestStatus !== 'invalid',
              'text-danger': manifestStatus === 'invalid',
            })}
          />
          <div className="flex flex-col">
            <div
              className={cn('text-sm font-semibold', {
                'text-informative': manifestStatus !== 'invalid',
                'text-danger': manifestStatus === 'invalid',
              })}
            >
              {noticeText}
            </div>
            {noticeSubtext && (
              <div className="text-sm text-muted">{noticeSubtext}</div>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <div className="inline-flex self-end">
          <NoticeButton
            domain={domain}
            manifestStatus={manifestStatus}
            overwrites={overwrites}
          />
        </div>
      </BlueBanner>
    );
  },
);
