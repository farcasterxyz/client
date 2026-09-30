import { LinkExternalIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
type UnsupportedEmbedProps = {
  source: string;
};

const UnsupportedEmbed: React.FC<UnsupportedEmbedProps> = React.memo(
  ({ source }) => {
    const { trackEvent } = useAnalytics();

    const onViewSourceClick = React.useCallback(() => {
      trackEvent(AnalyticsEvent.VisitingExternalURL, { source });
    }, [source, trackEvent]);

    return (
      <div className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-2 text-sm text-muted border-default">
        <div className="flex flex-row items-center">
          <div className="text-sm">No preview found for shared link</div>
        </div>
        <ExternalLink
          className="flex cursor-pointer flex-row items-center text-sm text-link hover:underline"
          href={source}
          title="View source"
          onClick={onViewSourceClick}
        >
          <LinkExternalIcon size={10} className="mr-1" />
          View source
        </ExternalLink>
      </div>
    );
  },
);

UnsupportedEmbed.displayName = 'UnsupportedEmbed';

export { UnsupportedEmbed };
