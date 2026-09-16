import {
  ApiDevToolsMiniAppUrlFacts,
  ApiFrameActionLaunchFrame,
  ApiFrameEmbedNext,
  domainFromUrl,
} from 'farcaster-client-data';
import {
  useDevToolsMetaTags,
  useDomainManifestState,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ManifestNotice } from '~/components/devTools/ManifestNotice';
import { MiniAppUrlFactsTable } from '~/components/devTools/MiniAppUrlFactsTable';
import { MiniAppUrlInput } from '~/components/devTools/MiniAppUrlInput';
import { PreviewMiniAppEmbed } from '~/components/devTools/PreviewMiniAppEmbed';
import { PropertySchemaTable } from '~/components/devTools/PropertySchemaTable';
import { ViewDocsButton } from '~/components/devTools/ViewDocsButton';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import {
  useFrameEmbedActionJsonSchema,
  useFrameEmbedActionLaunchMiniAppJsonSchema,
  useFrameEmbedButtonJsonSchema,
  useFrameEmbedJsonSchema,
} from '~/hooks/devTools/useFrameEmbedJsonSchema';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { PropertySchema } from '~/utils/schemaValidationUtils';

const MiniAppEmbedPage = React.memo(() => {
  const { url: initialUrl } = useSearchParams('developersMiniAppEmbed');
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [urlButtonText, setUrlButtonText] = useState<string>('Submit');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    if (!url) {
      setUrlButtonText('Submit');
      return;
    }
    setUrlButtonText('Refetch');
  }, [url]);

  const handleButtonClick = () => {
    if (!url) {
      return;
    }
    setIsDirty(true);
  };

  return (
    <Page
      meta={{ title: 'Developers / Embed Tool' }}
      className="max-w-[1000px]"
    >
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          visibleOnMobile
          iconRight={
            <ViewDocsButton href="https://miniapps.farcaster.xyz/docs/guides/sharing" />
          }
        >
          <PageTitle>
            <BackButton />
            <span>Embed Tool</span>
          </PageTitle>
        </PageHeader>
        <div className="flex flex-col gap-10 p-4">
          <MiniAppUrlInput
            url={url}
            onUrlChange={setUrl}
            buttonText={urlButtonText}
            onButtonClick={handleButtonClick}
            isLoading={isDirty}
          />
          <MiniAppEmbedContent
            url={url}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
          />
        </div>
      </BorderedMainContent>
    </Page>
  );
});

const MiniAppEmbedContent = React.memo(
  ({
    url,
    isDirty,
    setIsDirty,
  }: {
    url: string | undefined;
    isDirty: boolean;
    setIsDirty: (isDirty: boolean) => void;
  }) => {
    const { fid } = useCurrentUser();
    const [frameEmbedConfig, setFrameEmbedConfig] = useState<
      ApiFrameEmbedNext | undefined
    >(undefined);
    const {
      data: metaTags,
      refetch: refetchMetaTags,
      isFetching: isFetchingMetaTags,
      isError: isErrorFetchingMetaTags,
    } = useDevToolsMetaTags({
      url: url ?? '',
      enabled: !!url,
    });

    const { data: domainManifestState } = useDomainManifestState({
      domain: url ? domainFromUrl(url) : '',
      enabled: !!url,
    });

    const [showManifestNotice, setShowManifestNotice] =
      useState<boolean>(false);

    const [manifestNoticeType, setManifestNoticeType] = useState<
      | 'missing'
      | 'registered-current-user'
      | 'registered-another-user'
      | 'unregistered'
      | undefined
    >(undefined);

    useEffect(() => {
      const searchParams = new URLSearchParams(window.location.search);
      if (url) {
        searchParams.set('url', url);
      } else {
        searchParams.delete('url');
      }
      const queryParams = searchParams.toString()
        ? `?${searchParams.toString()}`
        : '';
      const newUrl = `${window.location.pathname}${queryParams}`;
      window.history.replaceState({}, '', newUrl);
    }, [url]);

    useEffect(() => {
      if (isDirty) {
        refetchMetaTags();
      }
    }, [isDirty, refetchMetaTags, setIsDirty]);

    useEffect(() => {
      setIsDirty(isFetchingMetaTags);
    }, [isFetchingMetaTags, setIsDirty]);

    useEffect(() => {
      if (!domainManifestState) {
        return;
      }
      if (!domainManifestState.state.manifest) {
        setManifestNoticeType('missing');
      } else if (
        !domainManifestState.state.decodedManifest?.accountAssociation
      ) {
        setManifestNoticeType('unregistered');
      } else if (
        domainManifestState.state.decodedManifest?.accountAssociation?.fid ===
        fid
      ) {
        setManifestNoticeType('registered-current-user');
      } else {
        setManifestNoticeType('registered-another-user');
      }
    }, [domainManifestState, fid]);

    useEffect(() => {
      if (metaTags) {
        const frameEmbed = metaTags['fc:frame'] ?? metaTags['fc:miniapp'];
        if (typeof frameEmbed === 'string') {
          try {
            const parsedConfig = JSON.parse(frameEmbed);
            setFrameEmbedConfig(parsedConfig);
          } catch (e) {
            setFrameEmbedConfig(undefined);
          }
        } else {
          setFrameEmbedConfig(undefined);
        }
      } else {
        setFrameEmbedConfig(undefined);
      }
    }, [metaTags]);

    const handleFactsRead = useCallback(
      (facts: ApiDevToolsMiniAppUrlFacts) => {
        if (
          facts.miniAppEmbedPresent &&
          facts.miniAppManifestValid &&
          !domainManifestState?.state.manifest
        ) {
          setManifestNoticeType('unregistered');
        }
        setShowManifestNotice(true);
      },
      [domainManifestState?.state.manifest],
    );

    if (!url || isDirty) {
      if (isFetchingMetaTags) {
        return <FullScreenLoadingIndicator />;
      }
      if (isErrorFetchingMetaTags) {
        return (
          <div className="flex size-full min-h-screen flex-col items-center justify-start pt-48">
            <span className="text-sm text-muted">
              Failed to fetch data, please check the URL and try again.
            </span>
          </div>
        );
      }
      return (
        <div className="flex flex-col">
          {url && <EmbedUrlDetails url={url} />}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-10">
        {showManifestNotice && manifestNoticeType && url && (
          <ManifestNotice
            domain={domainFromUrl(url)}
            manifestStatus={manifestNoticeType}
          />
        )}
        <EmbedUrlDetails url={url} onFactsRead={handleFactsRead} />
        <PreviewMiniAppEmbed appUrl={url} frameEmbedConfig={frameEmbedConfig} />
        {frameEmbedConfig && (
          <EmbedConfigurationDetails config={frameEmbedConfig} />
        )}
      </div>
    );
  },
);

const EmbedUrlDetails = React.memo(
  ({
    url,
    onFactsRead,
  }: {
    url: string | undefined;
    onFactsRead?: (facts: ApiDevToolsMiniAppUrlFacts) => void;
  }) => {
    if (!url) {
      return null;
    }

    return (
      <div className="w-full">
        <MiniAppUrlFactsTable url={url} onFactsRead={onFactsRead} />
      </div>
    );
  },
);

const EmbedConfigurationDetails = React.memo(
  ({ config }: { config: ApiFrameEmbedNext }) => {
    const frameEmbedConfig = useFrameEmbedJsonSchema();
    const frameEmbedButtonConfig = useFrameEmbedButtonJsonSchema();
    const frameEmbedActionConfig = useFrameEmbedActionJsonSchema();
    const frameEmbedActionLaunchMiniAppConfig =
      useFrameEmbedActionLaunchMiniAppJsonSchema();

    // We are still keeping `launch_frame` for backwards compatibility
    const propertySchema:
      | PropertySchema<ApiFrameActionLaunchFrame>[]
      | undefined = useMemo(() => {
      if (config.button?.action.type === 'launch_miniapp') {
        return frameEmbedActionLaunchMiniAppConfig();
      }
      if (config.button?.action.type === 'launch_frame') {
        return frameEmbedActionConfig();
      }
    }, [config, frameEmbedActionConfig, frameEmbedActionLaunchMiniAppConfig]);

    return (
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-3 pb-4">
          <div className="text-base font-medium">Embed Data</div>
          <PropertySchemaTable schema={frameEmbedConfig()} data={config} />
        </div>
        <div className="flex flex-col gap-3 py-4">
          <div className="text-base font-medium">Button</div>
          {config.button ? (
            <PropertySchemaTable
              schema={frameEmbedButtonConfig()}
              data={config.button}
            />
          ) : (
            <div className="text-sm text-muted">No button configuration</div>
          )}
        </div>
        <div className="flex flex-col gap-3 py-4">
          <div className="text-base font-medium">Action</div>
          {config.button?.action && propertySchema ? (
            <PropertySchemaTable
              schema={propertySchema}
              data={config.button.action}
            />
          ) : (
            <div className="text-sm text-muted">No action configuration</div>
          )}
        </div>
      </div>
    );
  },
);

export { MiniAppEmbedPage };
