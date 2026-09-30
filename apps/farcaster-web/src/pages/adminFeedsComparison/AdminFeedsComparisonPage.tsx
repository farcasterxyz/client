import {
  FarcasterApiClient,
  FarcasterApiClientMetaOptions,
  OnError,
  OnFetchStart,
} from 'farcaster-client-data';
import { FarcasterApiClientProvider } from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { ToastContainer } from 'react-toastify';

import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { baseApiUrl, wsUrl } from '~/constants/api';
import { AuthProvider } from '~/contexts/AuthProvider';
import { toastOptions } from '~/utils/toast';

import { AdminFeedConfig, AdminFeedConfigPanel } from './AdminFeedConfigPanel';
import { AdminFeedComparisonContent } from './AdminFeedContent';

const apiClient = new FarcasterApiClient();

const AdminFeedsComparisonPage: FC = memo(() => {
  const meta = useMemo((): FarcasterApiClientMetaOptions => ({}), []);

  const onFetchStart: OnFetchStart = useCallback(() => {}, []);

  const onError: OnError = useCallback(() => {}, []);

  return (
    <FarcasterApiClientProvider
      apiClient={apiClient}
      address={undefined}
      baseUrl={baseApiUrl}
      wsUrl={wsUrl}
      debug={false}
      meta={meta}
      onError={onError}
      onFetchStart={onFetchStart}
      readTimeout={120000}
    >
      <AuthProvider>
        <AdminFeedsComparisonContent />
      </AuthProvider>
    </FarcasterApiClientProvider>
  );
});

const AdminFeedsComparisonContent: React.FC = React.memo(() => {
  const [leftConfig, setLeftConfig] = useState<AdminFeedConfig>({
    updateTimestamp: 0,
    demoteViewedCasts: true,
    includeReplies: false,
    includeTrendingCasts: false,
  });

  const [rightConfig, setRightConfig] = useState<AdminFeedConfig>({
    updateTimestamp: 0,
    demoteViewedCasts: true,
    includeReplies: false,
    includeTrendingCasts: false,
  });

  const [leftRefetch, setLeftRefetch] = useState<(() => void) | undefined>(
    undefined,
  );
  const [leftIsLoading, setLeftIsLoading] = useState(true);

  const [rightRefetch, setRightRefetch] = useState<(() => void) | undefined>(
    undefined,
  );
  const [rightIsLoading, setRightIsLoading] = useState(true);

  return (
    <Page meta={{ title: 'Compare Feeds' }}>
      <div className="flex h-screen flex-col">
        <div className="flex flex-row">
          <div className="w-1/2 border-r border-default">
            <AdminFeedConfigPanel
              onConfigChange={setLeftConfig}
              refetch={leftRefetch}
              isLoading={leftIsLoading}
            />
          </div>
          <div className="w-1/2">
            <AdminFeedConfigPanel
              onConfigChange={setRightConfig}
              refetch={rightRefetch}
              isLoading={rightIsLoading}
            />
          </div>
        </div>
        <div className="flex-1">
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <FullScreenErrorBoundary>
              <AdminFeedComparisonContent
                leftConfig={leftConfig}
                setLeftRefetch={(newRefetch) => {
                  // Need to set via a 2nd function, because passing a function to set triggers it
                  setLeftRefetch(() => newRefetch);
                }}
                setLeftIsLoading={setLeftIsLoading}
                rightConfig={rightConfig}
                setRightRefetch={(newRefetch) => {
                  // Need to set via a 2nd function, because passing a function to set triggers it
                  setRightRefetch(() => newRefetch);
                }}
                setRightIsLoading={setRightIsLoading}
              />
            </FullScreenErrorBoundary>
          </Suspense>
        </div>
        <ToastContainer {...toastOptions} />
      </div>
    </Page>
  );
});

AdminFeedsComparisonPage.displayName = 'AdminFeedsComparisonPage';

export { AdminFeedsComparisonPage };
