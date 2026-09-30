import {
  FarcasterApiClient,
  FarcasterApiClientMetaOptions,
  OnError,
  OnFetchStart,
} from 'farcaster-client-data';
import {
  FarcasterApiClientProvider,
  useAdminFeed,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, {
  FC,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { Cast } from '~/components/casts/Cast';
import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { SelectInput } from '~/components/forms/SelectInput';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { baseApiUrl, wsUrl } from '~/constants/api';
import { AuthProvider } from '~/contexts/AuthProvider';
import { ApiCastWithContext } from '~/types';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';
import { toastOptions } from '~/utils/toast';

const apiClient = new FarcasterApiClient();

const DEFAULT_LABEL = 'evergreen-labeled';
const LABEL_CHOICES = [
  { name: 'Evergreen', value: 'evergreen-labeled' },
  { name: 'High Quality', value: 'high-quality-labeled' },
  { name: 'Low Quality', value: 'low-quality-labeled' },
] as const;

type AdminLabeledCastFeedType = (typeof LABEL_CHOICES)[number]['value'];

const isValidLabel = (
  label: string | null,
): label is AdminLabeledCastFeedType => {
  return LABEL_CHOICES.some((choice) => choice.value === label);
};

const AdminLabeledCastsPage: FC = memo(() => {
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
        <AdminLabeledCastsContent />
      </AuthProvider>
    </FarcasterApiClientProvider>
  );
});

const AdminLabeledCastsContent: React.FC = React.memo(() => {
  const [searchParams, setSearchParams] = useSearchParams('adminLabeledCasts');
  const rawLabel = searchParams.get('label');
  const selectedLabel = isValidLabel(rawLabel) ? rawLabel : DEFAULT_LABEL;

  useEffect(() => {
    if (!isValidLabel(rawLabel)) {
      setSearchParams({ label: DEFAULT_LABEL }, { replace: true });
    }
  }, [rawLabel, setSearchParams]);

  const onLabelChange = useCallback(
    (label: AdminLabeledCastFeedType) => {
      setSearchParams({ label });
    },
    [setSearchParams],
  );

  return (
    <Page meta={{ title: 'Labeled Casts' }}>
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-1 flex-col border-x border-default">
          <div className="flex flex-row flex-wrap items-center gap-3 border-b p-2 text-sm border-default">
            <div className="flex flex-row items-center gap-2">
              <span>Label:</span>
              <SelectInput
                className="w-48 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
                choices={LABEL_CHOICES.map(({ name, value }) => ({
                  name,
                  value,
                }))}
                value={selectedLabel}
                onChange={(e) =>
                  onLabelChange(e.target.value as AdminLabeledCastFeedType)
                }
              />
            </div>
          </div>
          <div className="flex-1">
            <Suspense fallback={<FullScreenLoadingIndicator />}>
              <FullScreenErrorBoundary>
                <AdminLabeledCastFeed selectedLabel={selectedLabel} />
              </FullScreenErrorBoundary>
            </Suspense>
          </div>
        </div>
        <ToastContainer {...toastOptions} />
      </div>
    </Page>
  );
});

interface AdminLabeledCastFeedProps {
  selectedLabel: AdminLabeledCastFeedType;
}

const AdminLabeledCastFeed: React.FC<AdminLabeledCastFeedProps> = ({
  selectedLabel,
}) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminFeed(
    {
      type: selectedLabel,
      limit: 20,
    },
  );

  const casts = useMemo(
    () =>
      uniqBy(
        buildCastsWithContext(data.pages.flatMap((page) => page.result.feed)),
        castWithContextKeyExtractor,
      ),
    [data.pages],
  );

  const description = useMemo(
    () => data.pages[0]?.result.description || '',
    [data.pages],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 border-b p-1 text-center text-sm text-muted border-default">
        {description}
      </div>
      <FlatList
        data={casts}
        emptyView={<DefaultEmptyListView message="No casts in this feed! 😮" />}
        renderItem={renderItem}
        keyExtractor={castWithContextKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
};

const renderItem = ({ item }: { item: ApiCastWithContext }) => {
  const labelReason = item.context.labelReason;

  return (
    <div>
      <Cast castWithContext={item} />
      {labelReason !== undefined && labelReason.length > 0 ? (
        <div className="border-t px-3 py-2 bg-elevated border-default">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Label reason
          </div>
          <div className="mt-0.5 break-words text-sm text-default">
            {labelReason}
          </div>
        </div>
      ) : null}
    </div>
  );
};

AdminLabeledCastsPage.displayName = 'AdminLabeledCastsPage';

export { AdminLabeledCastsPage };
