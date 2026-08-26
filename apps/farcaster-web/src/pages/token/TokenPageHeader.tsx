import { CheckIcon, ShareIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';

import { BackButton } from '~/components/forms/buttons/BackButton';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type TokenPageHeaderProps = {
  ticker: string;
};

const TokenPageHeader: React.FC<TokenPageHeaderProps> = React.memo(
  ({ ticker }) => {
    const { trackEvent } = useAnalytics();

    const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

    const onCopyClick = React.useCallback(() => {
      trackEvent(AnalyticsEvent.PressShareToken, { ticker });

      navigator.clipboard.writeText(`https://farcaster.xyz/~/token/${ticker}`);

      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    }, [ticker, trackEvent]);

    return (
      <>
        <div className="border-default sm:border-x">
          <PageHeader
            hideCastButton={true}
            renderAlternateActionButton={() => {
              return (
                <div
                  className="group flex size-[30px] cursor-pointer flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium"
                  onClick={onCopyClick}
                >
                  {copiedLink ? <CheckIcon /> : <ShareIcon />}
                </div>
              );
            }}
          >
            <PageTitle>
              <BackButton /> <div>${ticker}</div>
            </PageTitle>
          </PageHeader>
        </div>
      </>
    );
  },
);

TokenPageHeader.displayName = 'TokenPageHeader';

export { TokenPageHeader };
