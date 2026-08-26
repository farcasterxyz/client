import { ApiFrame, domainFromUrl } from 'farcaster-client-data';
import { useDevToolsManagedApps } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { MiniAppUrlInput } from '~/components/devTools/MiniAppUrlInput';
import { ViewDocsButton } from '~/components/devTools/ViewDocsButton';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameIconImage } from '~/components/images/FrameIconImage';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

const MiniAppPreviewPage = React.memo(() => {
  const { url: initialUrl } = useSearchParams('developersMiniAppPreview');
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [urlButtonText, setUrlButtonText] = useState<string>('Submit');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const { flatData: ownedApps } = useDevToolsManagedApps();

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

  const handleSelectOwnedApp = useCallback((homeUrl: string) => {
    setUrl(homeUrl);
  }, []);

  return (
    <Page
      meta={{ title: 'Developers / Preview Tool' }}
      className="max-w-[1000px]"
    >
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          visibleOnMobile
          iconRight={
            <ViewDocsButton href="https://miniapps.farcaster.xyz/docs/guides/loading" />
          }
        >
          <PageTitle>
            <BackButton />
            <span>Preview Tool</span>
          </PageTitle>
        </PageHeader>
        <div className="flex flex-col gap-10 p-4">
          {ownedApps && ownedApps.length > 0 && (
            <OwnedAppsSection
              apps={ownedApps}
              onSelect={handleSelectOwnedApp}
            />
          )}
          <MiniAppUrlInput
            url={url}
            onUrlChange={setUrl}
            buttonText={urlButtonText}
            onButtonClick={handleButtonClick}
            isLoading={isDirty}
            hideRefetchButton
            allowLocalhost
          />
          {url && <MiniAppPreviewContent url={url} />}
        </div>
      </BorderedMainContent>
    </Page>
  );
});

const OwnedAppsSection = React.memo(
  ({
    apps,
    onSelect,
  }: {
    apps: ApiFrame[];
    onSelect: (homeUrl: string) => void;
  }) => {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm font-medium text-muted">Your apps</div>
        <div className="flex flex-wrap gap-4">
          {apps.map((app) => (
            <button
              key={app.domain}
              onClick={() => onSelect(app.homeUrl)}
              className="cursor-pointer flex-col items-center gap-1.5 rounded-lg p-2 hover:bg-faint"
              title={app.name}
            >
              <FrameIconImage imageUrl={app.iconUrl} size={40} />
              <span className="w-15 line-clamp-1 text-center text-xs text-muted">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  },
);

const MiniAppPreviewContent = React.memo(({ url }: { url: string }) => {
  const currentUser = useCurrentUser();
  const { launchMiniApp } = useMinimizableWindowContext();

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

  const handleLaunch = () => {
    if (!url) {
      return;
    }
    launchMiniApp({
      context: {
        type: 'dev_preview',
      },
      launchConfig: {
        type: 'standalone',
        name: `${domainFromUrl(url)} preview`,
        url,
        author: currentUser,
      },
      debug: true,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-base font-medium">Preview Mini App</div>
        <div className="text-sm text-muted">
          This preview opens the URL as a standalone Mini App ignoring the
          manifest and embed config.
        </div>
        <div className="text-sm text-muted">
          If no content is loaded after open, make sure you're calling{' '}
          <ExternalLink
            href="https://miniapps.farcaster.xyz/docs/guides/loading"
            title="ready"
          >
            ready
          </ExternalLink>{' '}
          from the SDK when your content is ready to be displayed.
        </div>
      </div>
      <div className="pt-4 text-muted">
        <DefaultButton onClick={handleLaunch}>
          Open URL as Mini App
        </DefaultButton>
      </div>
    </div>
  );
});

export { MiniAppPreviewPage };
