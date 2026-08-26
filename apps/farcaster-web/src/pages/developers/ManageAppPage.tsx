import {
  AlertIcon,
  DownloadIcon,
  KebabHorizontalIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import {
  buildDomainManifestStateKey,
  useAnalyticsMiniAppRequestDownload,
  useAnalyticsMiniAppRollup,
  useDevToolsExportMiniAppUserData,
  useDevToolsUnregisterDomain,
  useDomainManifestState,
  useGloballyCachedFrame,
  useInvalidateAppsByAuthor,
  useInvalidateDevToolsManagedApps,
  useInvalidateFrameDetails,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import { TrashIcon } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { DateChartAreaInteractive } from '~/components/analytics/DateChartAreaInteractive';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DeveloperToolButton } from '~/components/devTools/DeveloperToolButton';
import { ManageAppKebabActions } from '~/components/devTools/ManageAppKebabActions';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameIconImage } from '~/components/images/FrameIconImage';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useCurrentUserHasMiniAppAdminRights } from '~/hooks/data/useCurrentUserHasMiniAppAdminRights';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import {
  ChartData,
  rollupBreakdownToChartData,
  rollupTotalsToChartData,
} from '~/lib/analytics/rollups';
import { toast } from '~/utils/toast';

const DEFAULT_START_DATE = '28daysago';

const ManageAppPage = React.memo(() => {
  const { domain } = useParams('developersManageApp');
  const { data } = useNonSuspenseFrameDetails({ domain });
  const frame = useGloballyCachedFrame(data);
  const hasAdminRights = useCurrentUserHasMiniAppAdminRights(domain);

  const [isAuthorized, setIsAuthorized] = useState<boolean | undefined>(
    undefined,
  );
  useEffect(() => {
    hasAdminRights().then(setIsAuthorized);
  }, [hasAdminRights]);

  return (
    <Page meta={{ title: 'Developers / Manage' }} className="max-w-[1000px]">
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          visibleOnMobile
          iconRight={<ManageAppKebabActions frame={frame} domain={domain} />}
        >
          <PageTitle>
            <BackButton />
            <span>Manage {domain}</span>
          </PageTitle>
        </PageHeader>
        {isAuthorized && <ManageAppContent domain={domain} />}
        {isAuthorized === false && (
          <div className="flex flex-col gap-2 p-4 pt-8 text-center text-muted">
            <span className="font-semibold">
              You do not have admin rights to manage this mini app.
            </span>
          </div>
        )}
      </BorderedMainContent>
    </Page>
  );
});

const ManageAppContent = React.memo(({ domain }: { domain: string }) => {
  const isAdmin = useIsAdmin();
  const {
    data: domainManifestState,
    isPending,
    isError,
    refetch,
  } = useDomainManifestState({
    domain,
  });

  const { data } = useNonSuspenseFrameDetails({
    domain,
  });
  const frameDetails = useGloballyCachedFrame(data);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!domain) {
      return;
    }
    onRefresh();
  }, [domain, onRefresh]);

  if (isPending) {
    return <FullScreenLoadingIndicator />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-8 text-center text-muted">
        <span className="font-semibold">
          Failed to load the manifest for {domain}.
        </span>
        <span className="text-sm">Please check the domain and try again.</span>
      </div>
    );
  }

  const manifestState = domainManifestState.state;
  const frameConfig = manifestState?.frameConfig;
  const hasCachedManifest = !!manifestState?.hasCachedManifest;

  if (
    isAdmin &&
    manifestState &&
    !manifestState.verified &&
    hasCachedManifest
  ) {
    return (
      <InvalidCachedManifestState
        domain={domain}
        message={manifestState.message}
        onDeleted={onRefresh}
      />
    );
  }

  if (!manifestState || !manifestState.manifest || !frameConfig) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-8 text-center text-muted">
        <span className="font-semibold">
          Unable to find registered manifest for {domain}.
        </span>
        <span className="text-sm">Please check the domain and try again.</span>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-row gap-4 border-b p-4 border-default">
        <FrameIconImage imageUrl={frameConfig.iconUrl} size={72} />
        <div className="flex flex-col">
          <div className="text-lg font-semibold">{frameConfig.name}</div>
          <div className="text-sm text-muted">{domain}</div>
          <div className="pt-[2px] text-xs text-muted">{frameDetails?.id}</div>
        </div>
      </div>
      <div className="border-defeault ml-auto flex flex-col gap-3 border-b p-3 bg-faint border-default lg:flex-row">
        <DeveloperToolButton
          toolName="embed"
          searchParams={{ url: frameConfig.homeUrl }}
        />
        <DeveloperToolButton toolName="manifest" searchParams={{ domain }} />
        <DeveloperToolButton toolName="manage" searchParams={{ domain }} />
      </div>
      <MiniAppAnalytics domain={domain} />
    </>
  );
});

const InvalidCachedManifestState = React.memo(
  ({
    domain,
    message,
    onDeleted,
  }: {
    domain: string;
    message?: string;
    onDeleted: () => void;
  }) => {
    const { fid } = useCurrentUser();
    const queryClient = useQueryClient();
    const unregisterDomain = useDevToolsUnregisterDomain();
    const invalidateAppsByAuthor = useInvalidateAppsByAuthor({ fid });
    const invalidateDevToolsManagedApps = useInvalidateDevToolsManagedApps();
    const invalidateFrameDetails = useInvalidateFrameDetails();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteCachedManifest = useCallback(async () => {
      try {
        setIsDeleting(true);
        await unregisterDomain({ domain });
        invalidateAppsByAuthor();
        invalidateDevToolsManagedApps();
        invalidateFrameDetails({ domain });
        await queryClient.invalidateQueries({
          queryKey: buildDomainManifestStateKey({ domain }),
        });
        onDeleted();
        setShowDeleteModal(false);
        toast({
          message: `Deleted cached manifest for ${domain}`,
          type: 'success',
        });
      } catch (error) {
        toast({
          message: `Failed to delete cached manifest for ${domain}, ${error}`,
          type: 'error',
        });
      } finally {
        setIsDeleting(false);
      }
    }, [
      domain,
      invalidateAppsByAuthor,
      invalidateDevToolsManagedApps,
      invalidateFrameDetails,
      onDeleted,
      queryClient,
      unregisterDomain,
    ]);

    return (
      <>
        <div className="flex flex-col items-center gap-3 p-4 pt-8 text-center text-muted">
          <span className="font-semibold">
            The cached manifest for {domain} is invalid.
          </span>
          {message && <span className="text-sm">{message}</span>}
          <DefaultButton
            variant="danger"
            size="sm-tall"
            disabled={isDeleting}
            isLoading={isDeleting}
            onClick={() => setShowDeleteModal(true)}
          >
            <span className="flex items-center gap-2">
              <TrashIcon size={16} />
              Delete cached manifest
            </span>
          </DefaultButton>
        </div>
        {showDeleteModal && (
          <ConfirmationModal
            onBackdropClose={() => {
              if (isDeleting) {
                return;
              }
              setShowDeleteModal(false);
            }}
            onCancel={() => {
              if (isDeleting) {
                return;
              }
              setShowDeleteModal(false);
            }}
            onConfirm={handleDeleteCachedManifest}
            title="Delete cached manifest"
            icon={({ size }) => <TrashIcon size={size} />}
            confirmText="Delete"
            destructive={true}
            isLoading={isDeleting}
            body={
              <>
                This will delete the cached manifest for{' '}
                <span className="font-semibold">{domain}</span> and remove it
                from Farcaster discovery until the domain is registered again.
              </>
            }
          />
        )}
      </>
    );
  },
);

const MiniAppAnalytics = React.memo(({ domain }: { domain: string }) => {
  // Context: some users are reporting that the analytics are not loading. Reducing
  // the timeseries data should help with this.
  const searchParams = useSearchParams('developersManageApp');
  const rawStartDate = searchParams.startDate ?? DEFAULT_START_DATE;
  const startDateRegex = /^\d+daysago$/;
  const startDate = startDateRegex.test(rawStartDate)
    ? rawStartDate
    : DEFAULT_START_DATE;

  const { data, isLoading, error } = useAnalyticsMiniAppRollup({
    request: {
      dateRange: {
        startDate,
        endDate: 'today',
      },
      measures: [
        'miniapp_opens',
        'miniapp_transactions',
        'miniapp_users_w_transaction',
        'miniapp_users_w_open',
        'miniapp_users_w_notifications_enabled',
        'miniapp_users_w_notifications_disabled',
        'miniapp_users_w_app_favorited',
        'miniapp_users_w_app_unfavorited',
        'miniapp_trending_rank',
      ],
      restrictions: [
        {
          dimension: 'miniapp_domain',
          values: [domain],
        },
      ],
      breakdownSettings: {
        dimensions: ['date'],
        order: 'asc',
      },
    },
  });

  const [breakdownChartData, setBreakdownChartData] = useState<ChartData[]>([]);
  const [totalsChartData, setTotalsChartData] = useState<ChartData>({});

  useEffect(() => {
    if (data) {
      setBreakdownChartData(rollupBreakdownToChartData(data));
      setTotalsChartData(rollupTotalsToChartData(data));
    }
  }, [data]);

  if (!data) {
    if (isLoading) {
      return <FullScreenLoadingIndicator />;
    }

    if (error) {
      return <div>{error.message}</div>;
    }

    return <div>No data</div>;
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="font-medium">Analytics</div>
        <AnalyticsKebabActions domain={domain} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <TotalMetricCard
          metricName="miniapp_trending_rank"
          data={totalsChartData}
          description="Rank on the Trending Mini Apps leaderboard"
          header="Trending Rank"
          zeroAsNull
          nullLabel="Unranked"
          unitPrefix="#"
        />
        <div className="col-span-3">
          <DateChartAreaInteractive
            measureName="miniapp_trending_rank"
            measureLabel="Trending Rank"
            chartStyle="line-with-dots"
            data={breakdownChartData}
            zeroAsNull
          />
        </div>
      </div>
      <div className="flex min-w-[422px] flex-col gap-3">
        <div className="flex w-full flex-col gap-2 lg:grid lg:grid-cols-4">
          <TotalMetricCard
            metricName="miniapp_users_w_open"
            data={totalsChartData}
            description="Total unique users in the last 28 days"
            header="Unique Users"
          />
          <TotalMetricCard
            metricName="miniapp_opens"
            data={totalsChartData}
            description="Total opens in the last 28 days"
            header="Total Opens"
          />
          <TotalMetricCard
            metricName="miniapp_transactions"
            data={totalsChartData}
            description="Total transactions submitted in the last 28 days"
            header="Total Transactions"
          />
          <TotalMetricCard
            metricName="miniapp_users_w_transaction"
            data={totalsChartData}
            description="Unique users with a transaction in the last 28 days"
            header="Users with a Transaction"
          />
          <TotalMetricCard
            metricName="miniapp_users_w_app_favorited"
            data={totalsChartData}
            description="Users that added the mini app in the last 28 days"
            header="Users that Added the Mini App"
          />
          <TotalMetricCard
            metricName="miniapp_users_w_app_unfavorited"
            data={totalsChartData}
            description="Users that removed the mini app in the last 28 days"
            header="Users that Removed the Mini App"
          />
          <TotalMetricCard
            metricName="miniapp_users_w_notifications_enabled"
            data={totalsChartData}
            description="Users that enabled notifications in the last 28 days"
            header="Users that Enabled Notifications"
          />
          <TotalMetricCard
            metricName="miniapp_users_w_notifications_disabled"
            data={totalsChartData}
            description="Users that disabled notifications in the last 28 days"
            header="Users that Disabled Notifications"
          />
        </div>
        <DateChartAreaInteractive
          measureName="miniapp_users_w_open"
          measureLabel="DAUs"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_opens"
          measureLabel="Opens per day"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_users_w_transaction"
          measureLabel="Transaction DAUs"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_transactions"
          measureLabel="Transactions per day"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_users_w_app_favorited"
          measureLabel="Adds per day"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_users_w_app_unfavorited"
          measureLabel="Removes per day"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_users_w_notifications_enabled"
          measureLabel="Notifications Enabled per day"
          data={breakdownChartData}
        />
        <DateChartAreaInteractive
          measureName="miniapp_users_w_notifications_disabled"
          measureLabel="Notifications Disabled per day"
          data={breakdownChartData}
        />
      </div>
    </div>
  );
});

const AnalyticsKebabActions = React.memo(({ domain }: { domain: string }) => {
  const exportMiniAppUserData = useDevToolsExportMiniAppUserData();
  const [
    showDownloadExtendedDashboardModal,
    setShowDownloadExtendedDashboardModal,
  ] = useState(false);
  const { isPending: isDownloadingExtendedDashboard, mutate: requestDownload } =
    useAnalyticsMiniAppRequestDownload();
  const [showExportMiniAppUserDataModal, setShowExportMiniAppUserDataModal] =
    useState(false);
  const [showExtendedDashboardErrorModal, setShowExtendedDashboardErrorModal] =
    useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const handleExportMiniAppUserData = useCallback(() => {
    setIsExporting(true);
    setShowExportMiniAppUserDataModal(false);
    exportMiniAppUserData({ domain })
      .then((data) => {
        const blob = new Blob([data], { type: 'text/csv' });
        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        const filename = `${domain}-${formatDate(ninetyDaysAgo)}-${formatDate(today)}-user-data.csv`;
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          message: 'User data exported successfully',
          type: 'success',
        });
        setIsExporting(false);
      })
      .catch(() => {
        toast({
          message: 'Failed to export user data',
          type: 'error',
        });
        setIsExporting(false);
      });
  }, [domain, exportMiniAppUserData]);

  const handleDownloadExtendedDashboard = useCallback(() => {
    requestDownload(
      {
        domain,
      },
      {
        onSettled: () => {
          setShowDownloadExtendedDashboardModal(false);
        },
        onSuccess: () => {
          toast({
            message:
              'Extended dashboard request sent. You will receive an email when it is ready.',
            type: 'success',
          });
        },
        onError: () => {
          setShowExtendedDashboardErrorModal(true);
        },
      },
    );
  }, [domain, requestDownload]);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <div className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-faint">
            <KebabHorizontalIcon />
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={4}
          className="w-70 outline-hidden z-20 rounded-md p-1 shadow-lg bg-app border-default"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            name="Export user data"
            icon={<DownloadIcon size="small" />}
            onClick={() => setShowExportMiniAppUserDataModal(true)}
          />
          <DropdownMenuItem
            name="Download extended dataset"
            icon={<DownloadIcon size="small" />}
            onClick={() => setShowDownloadExtendedDashboardModal(true)}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {showDownloadExtendedDashboardModal && (
        <ConfirmationModal
          onBackdropClose={() => {
            setShowDownloadExtendedDashboardModal(false);
          }}
          onCancel={() => {
            setShowDownloadExtendedDashboardModal(false);
          }}
          onConfirm={handleDownloadExtendedDashboard}
          title="Download extended dashboard"
          icon={({ size }) => <DownloadIcon size={size} />}
          confirmText="Download"
          isLoading={isDownloadingExtendedDashboard}
          body={
            <>
              This will export analytics data for{' '}
              <span className="font-semibold">{domain}</span> for the last 365
              days. The data will be exported as a JSON file and sent to your
              email address.
            </>
          }
        />
      )}
      {showExportMiniAppUserDataModal && (
        <ConfirmationModal
          onBackdropClose={() => {
            setShowExportMiniAppUserDataModal(false);
          }}
          onCancel={() => {
            setShowExportMiniAppUserDataModal(false);
          }}
          onConfirm={handleExportMiniAppUserData}
          title="Export user data"
          icon={({ size }) => <DownloadIcon size={size} />}
          confirmText="Download"
          isLoading={isExporting}
          body={
            <>
              This will download a CSV file with all{' '}
              <span className="font-semibold">{domain}</span> user data for the
              last 90 days.
            </>
          }
        />
      )}
      {showExtendedDashboardErrorModal && (
        <ConfirmationModal
          onBackdropClose={() => {
            setShowExtendedDashboardErrorModal(false);
          }}
          onCancel={() => {
            setShowExtendedDashboardErrorModal(false);
          }}
          onConfirm={() => {
            setShowExtendedDashboardErrorModal(false);
          }}
          title="Extended Dashboard Request Failed"
          icon={({ size }) => <AlertIcon size={size} />}
          confirmText="Got it"
          hideAreYouSure
          body={
            <div className="space-y-3">
              <p>We're sorry, something went wrong with your request.</p>
              <p>
                Please note that we only allow one export every 24 hours. If
                you've requested an upload or an existing download, you'll have
                to wait 24 hours or contact staff.
              </p>
              <p>
                If this error persists and it's causing you issues, please reach
                out to <span className="font-semibold">@pirosb3</span>.
              </p>
            </div>
          }
        />
      )}
    </>
  );
});

const TotalMetricCard = React.memo(
  ({
    metricName,
    data,
    description,
    header,
    zeroAsNull = false,
    nullLabel = 'N/A',
    unitPrefix,
  }: {
    metricName: string;
    data: ChartData;
    description: string;
    header: string;
    zeroAsNull?: boolean;
    nullLabel?: string;
    unitPrefix?: string;
  }) => {
    const isEmpty = zeroAsNull && Number(data[metricName]) === 0;

    return (
      <Card className="w-full">
        <CardHeader className="relative">
          <CardDescription className="text-base font-medium">
            {header}
          </CardDescription>
          <CardTitle className="@[250p  x]/card:text-3xl text-2xl font-semibold tabular-nums">
            {isEmpty
              ? nullLabel
              : `${unitPrefix ?? ''}${Number(data[metricName]).toLocaleString()}`}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="tx-sm text-faint">{description}</div>
        </CardFooter>
      </Card>
    );
  },
);

ManageAppPage.displayName = 'ManageAppPage';

export { ManageAppPage };
