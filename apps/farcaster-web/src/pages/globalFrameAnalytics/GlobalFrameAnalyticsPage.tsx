import { useGlobalFrameAnalytics } from 'farcaster-client-hooks';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';

import { DailyGlobalFrameAnalytics } from './DailyGlobalFrameAnalytics';
import { DailyGlobalFrameAnalyticsDetails } from './DailyGlobalFrameAnalyticsDetails';

const GlobalFrameAnalyticsPage = React.memo(() => {
  const { data } = useGlobalFrameAnalytics({});
  const pageTitle = `Farcaster / Mini App Analytics`;

  return (
    <Page meta={{ title: pageTitle }}>
      <BorderedMainContent>
        <PageHeader hideBorderBottom={true} hideCastButton={true}>
          <PageTitle>
            <BackButton />
            Mini App analytics
          </PageTitle>
        </PageHeader>
        <div className="flex flex-col gap-5 p-2 pl-4 pt-3 text-sm">
          {data && <DailyGlobalFrameAnalytics data={data?.result.data} />}
          {data && (
            <DailyGlobalFrameAnalyticsDetails data={data?.result.data} />
          )}
        </div>
      </BorderedMainContent>
    </Page>
  );
});

GlobalFrameAnalyticsPage.displayName = 'GlobalFrameAnalyticsPage';

export { GlobalFrameAnalyticsPage };
