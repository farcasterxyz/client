import {
  ApiDomainFrameConfig,
  ApiFrame,
  isPublicUrl,
} from 'farcaster-client-data';
import { useMemo } from 'react';

import { TopFramesFrameCard } from '~/components/frames/TopFramesFrameCard';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { ImageFactsTable } from './ImageFactsTable';

const PreviewMiniApp = ({
  domain,
  manifest,
}: {
  domain?: string;
  manifest?: ApiDomainFrameConfig;
}) => {
  const currentUser = useCurrentUser();

  const config = useMemo(() => {
    const config =
      manifest ??
      ({
        homeUrl: `https://${domain}`,
        iconUrl: `https://${domain}/icon.png`,
        name: domain,
        buttonTitle: 'Open',
      } as ApiDomainFrameConfig);
    return config;
  }, [domain, manifest]);

  const disabled = useMemo(() => {
    return !config.homeUrl || !isPublicUrl(config.homeUrl);
  }, [config.homeUrl]);

  const resolvedDomain = useMemo(() => {
    if (domain) {
      return domain;
    }
    try {
      return new URL(config.homeUrl).hostname;
    } catch (error) {
      return '';
    }
  }, [config.homeUrl, domain]);

  return (
    <div className="w-full space-y-3">
      <div>
        <div className="text-base font-medium">Mini App Preview</div>
      </div>
      {manifest ? (
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex h-[210px] w-full flex-col items-center justify-center gap-2 rounded-lg bg-faint lg:w-[470px]">
            <div className="min-h-[40px] min-w-[336px] rounded-lg shadow-lg bg-app">
              <TopFramesFrameCard
                frame={
                  {
                    domain: resolvedDomain,
                    name: config.name,
                    iconUrl: config.iconUrl,
                    homeUrl: config.homeUrl,
                    imageUrl: config.imageUrl,
                    buttonTitle: config.buttonTitle,
                    splashImageUrl: config.splashImageUrl,
                    splashBackgroundColor: config.splashBackgroundColor,
                    author: currentUser,
                    supportsNotifications: false,
                    viewerContext: undefined,
                  } as ApiFrame
                }
                launchContext={{
                  type: 'dev_preview',
                }}
                disabled={disabled}
              />
            </div>
          </div>
          {manifest?.iconUrl && (
            <ImageFactsTable imageUrl={manifest?.iconUrl} />
          )}
        </div>
      ) : (
        <div className="text-sm text-muted">
          Fix your configuration to see how a preview of your Mini App.
        </div>
      )}
    </div>
  );
};

export { PreviewMiniApp };
