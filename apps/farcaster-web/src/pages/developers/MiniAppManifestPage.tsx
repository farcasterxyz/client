import {
  ApiAccountAssociationValidation,
  ApiDecodedAccountAssociation,
  ApiDomainFrameConfig,
  ApiDomainManifest,
  ApiDomainManifestDebug,
  isPublicUrl,
} from 'farcaster-client-data';
import {
  useDebugDomainManifest,
  useDevToolsMetaTags,
} from 'farcaster-client-hooks';
import { CheckIcon, InfoIcon, SignatureIcon } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from 'react-router-dom';

import { BlueBannerCompact } from '~/components/BlueBannerCompact';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { HostedManifestsButton } from '~/components/devTools/HostedManifestsButton';
import { HttpResponseTable } from '~/components/devTools/HttpResponseTable';
import { ManifestNotice } from '~/components/devTools/ManifestNotice';
import { MiniAppAccountAssociationFactsTable } from '~/components/devTools/MiniAppAccountAssociationFactsTable';
import { MiniAppAccountAssociationWorkflowButton } from '~/components/devTools/MiniAppAccountAssociationWorkflowButton';
import { MiniAppDomainInput } from '~/components/devTools/MiniAppDomainInput';
import { PreviewMiniApp } from '~/components/devTools/PreviewMiniApp';
import { PreviewMiniAppEmbed } from '~/components/devTools/PreviewMiniAppEmbed';
import { PropertySchemaTable } from '~/components/devTools/PropertySchemaTable';
import { SchemaErrorsTable } from '~/components/devTools/SchemaErrorsTable';
import { ViewDocsButton } from '~/components/devTools/ViewDocsButton';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useFarcasterJsonSchema } from '~/hooks/devTools/useFarcasterJsonSchema';

const MiniAppManifestPage = React.memo(() => {
  const [searchParams, setSearchParams] = useSearchParams(
    'developersMiniAppManifest',
  );

  const domain = searchParams.get('domain');
  const domainButtonText = domain ? 'Refresh' : 'Fetch';

  const { data, refetch, isFetching, isError, isRefetching } =
    useDebugDomainManifest({
      params: { domain: domain as string },
      enabled: !!domain,
    });

  const setDomain = useCallback(
    (next: string | null) => {
      if (next) {
        setSearchParams({ domain: next });
      } else {
        setSearchParams(undefined);
      }
    },
    [setSearchParams],
  );

  const handleButtonClick = useCallback(() => {
    if (!domain) {
      return;
    }

    refetch();
  }, [domain, refetch]);

  const canViewHostedManifests = true;

  const Content = useMemo(() => {
    if (!domain) {
      return null;
    }

    if (isError) {
      return <div>Failed to retrieve debug information</div>;
    }

    if (isFetching) {
      return <FullScreenLoadingIndicator />;
    }

    if (data) {
      return <MiniAppManifestContent domain={domain} data={data} />;
    }

    // We don't ever expect to get here
    return null;
  }, [data, domain, isError, isFetching]);

  return (
    <Page meta={{ title: 'Mini App Manifest Tool' }} className="max-w-[1000px]">
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          visibleOnMobile
          iconRight={
            <div className="flex flex-row items-center gap-2">
              {canViewHostedManifests && (
                <>
                  <HostedManifestsButton
                    title="Manage"
                    manage
                    icon={<SignatureIcon className="size-4" />}
                  />
                  <HostedManifestsButton title="New" />
                </>
              )}
              <ViewDocsButton href="https://miniapps.farcaster.xyz/docs/guides/publishing" />
            </div>
          }
        >
          <PageTitle>
            <BackButton />
            <span>Manifests</span>
          </PageTitle>
        </PageHeader>
        <div className="flex flex-col gap-6 p-4">
          <MiniAppDomainInput
            domain={domain}
            onDomainChange={setDomain}
            buttonText={domainButtonText}
            onButtonClick={handleButtonClick}
            isLoading={isFetching || isRefetching}
          />
          {Content}
        </div>
      </BorderedMainContent>
    </Page>
  );
});

const resolvedHomeUrl = (
  manifest: ApiDomainFrameConfig | undefined,
  domain: string | null,
) => {
  if (manifest?.homeUrl && isPublicUrl(manifest.homeUrl)) {
    return manifest.homeUrl;
  }
  if (domain) {
    return `https://${domain}`;
  }
  return '';
};

const MiniAppManifestContent = React.memo(
  ({ domain, data }: { domain: string; data: ApiDomainManifestDebug }) => {
    const configData = useMemo(() => {
      if (
        typeof data.manifestHttpResponse.body === 'object' &&
        data.manifestHttpResponse.body !== null
      ) {
        if ('frame' in data.manifestHttpResponse.body) {
          return data.manifestHttpResponse.body.frame as Record<
            string,
            unknown
          >;
        }

        if ('miniapp' in data.manifestHttpResponse.body) {
          return data.manifestHttpResponse.body.miniapp as Record<
            string,
            unknown
          >;
        }
      }
    }, [data.manifestHttpResponse.body]);

    return (
      <>
        {!data.manifestValidation?.manifest && (
          <ManifestNotice domain={domain} manifestStatus="missing" />
        )}
        <div className="flex flex-col gap-10">
          <HttpResponseTable response={data.manifestHttpResponse} />
          <AccountAssociationSection
            domain={domain}
            manifest={data.manifestValidation?.manifest}
            accountAssociationValidation={
              data.manifestValidation?.accountAssociationValidation
            }
          />
          {configData !== undefined && (
            <MiniAppConfigurationSection
              config={configData}
              schemaValid={data.manifestValidation?.schemaValid}
              schemaErrors={data.manifestValidation?.schemaErrors}
            />
          )}
          <PreviewMiniApp
            domain={domain}
            manifest={data?.manifestValidation?.manifest?.frame}
          />
          <PreviewHomeUrlEmbed
            domain={domain}
            config={data?.manifestValidation?.manifest?.frame}
          />
        </div>
      </>
    );
  },
);

function PreviewHomeUrlEmbed({
  domain,
  config,
}: {
  domain: string;
  config?: ApiDomainFrameConfig;
}) {
  const homeUrl = resolvedHomeUrl(config, domain);

  const {
    data: metaTags,
    isFetching: isFetchingMetaTags,
    isError: isErrorFetchingMetaTags,
  } = useDevToolsMetaTags({
    url: homeUrl,
  });

  const frameEmbedConfig = useMemo(() => {
    if (metaTags) {
      const frameEmbed = metaTags['fc:frame'] ?? metaTags['fc:miniapp'];
      if (typeof frameEmbed === 'string') {
        try {
          const parsedConfig = JSON.parse(frameEmbed);
          return parsedConfig;
        } catch (e) {}
      }
    }
  }, [metaTags]);

  if (isFetchingMetaTags) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (isErrorFetchingMetaTags) {
    return (
      <div className="flex h-[61px] items-center justify-center rounded-lg border border-faint">
        <span className="text-sm text-muted">Error fetching meta tags</span>
      </div>
    );
  }

  return (
    <PreviewMiniAppEmbed
      title="Home URL Embed Preview"
      appUrl={homeUrl}
      frameEmbedConfig={frameEmbedConfig}
      disabled={!homeUrl || !isPublicUrl(homeUrl)}
    />
  );
}

const AccountAssociationSection = React.memo(
  ({
    domain,
    manifest,
    accountAssociationValidation,
  }: {
    domain: string | undefined;
    accountAssociationValidation: ApiAccountAssociationValidation | undefined;
    manifest: ApiDomainManifest | undefined;
  }) => {
    const { fid } = useCurrentUser();
    const [decodedAccountAssociation, setDecodedAccountAssociation] = useState<
      ApiDecodedAccountAssociation | undefined
    >(undefined);

    const NextSteps = useMemo(() => {
      if (
        !accountAssociationValidation ||
        !accountAssociationValidation.verified
      ) {
        return (
          <div className="flex flex-col gap-4 lg:min-w-[487px]">
            <div className="text-sm text-danger">
              No valid account association.
            </div>
            <MiniAppAccountAssociationWorkflowButton
              domain={domain}
              label="Generate account association"
            />
          </div>
        );
      }

      if (accountAssociationValidation.fid !== fid) {
        return (
          <div className="flex flex-col gap-4 lg:min-w-[487px]">
            <div className="text-sm text-muted">
              Account association is verified but to a user other than you.
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg p-2 bg-faint">
              <div className="text-sm ">{domain}</div>
              <BlueBannerCompact className="px-[6px] py-[4px]">
                <InfoIcon className="size-4 text-informative" />
                <div className="text-xs text-informative">
                  Associated with {decodedAccountAssociation?.username}
                </div>
              </BlueBannerCompact>
            </div>
            <MiniAppAccountAssociationWorkflowButton
              domain={domain}
              label="Transfer Ownership"
              targetFid={fid?.toString()}
            />
          </div>
        );
      }

      if (accountAssociationValidation.fid === fid) {
        return (
          <div className="flex flex-col gap-4 lg:min-w-[487px]">
            <div className="text-sm text-muted">
              Press the button below and follow the steps to transfer ownership
              of the domain to another account.
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg p-2 bg-faint">
              <div className="text-sm ">{domain}</div>
              <BlueBannerCompact
                variant="success"
                className="px-[6px] py-[4px]"
              >
                <CheckIcon className="size-4" />
                <div className="text-xs">Associated with your account</div>
              </BlueBannerCompact>
            </div>
            <MiniAppAccountAssociationWorkflowButton
              domain={domain}
              label="Transfer Ownership"
              isOwnershipTransfer
            />
          </div>
        );
      }

      return null;
    }, [
      accountAssociationValidation,
      fid,
      domain,
      decodedAccountAssociation?.username,
    ]);

    return (
      <div id="account-association" className="w-full space-y-3">
        <div className="text-base font-medium">Account Association</div>
        <div className="flex flex-col gap-4 lg:flex-row">
          {NextSteps}
          {manifest?.accountAssociation && accountAssociationValidation && (
            <MiniAppAccountAssociationFactsTable
              validation={accountAssociationValidation}
              accountAssociation={manifest.accountAssociation}
              expectedDomain={domain}
              hideHeader
              onDecode={setDecodedAccountAssociation}
            />
          )}
        </div>
      </div>
    );
  },
);

const MiniAppConfigurationSection = React.memo(
  ({
    config,
    schemaValid,
    schemaErrors,
  }: {
    config: ApiDomainFrameConfig | Record<string, unknown>;
    schemaValid?: boolean;
    schemaErrors?: string[];
  }) => {
    const farcasterJsonSchema = useFarcasterJsonSchema();

    return (
      <div className="w-full space-y-3">
        <div className="text-base font-medium">Mini App Configuration</div>
        {schemaValid === true && (
          <div className="text-sm text-success">
            Mini App configuration is valid.
          </div>
        )}
        {schemaValid === false && (
          <div className="space-y-2">
            <div className="text-sm text-danger">
              Mini App configuration is invalid and needs to be fixed.
            </div>
            <SchemaErrorsTable errors={schemaErrors} />
          </div>
        )}

        <PropertySchemaTable
          schema={farcasterJsonSchema()}
          data={config}
          hideValidation
        />
      </div>
    );
  },
);

export { MiniAppManifestPage };
