import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTrendingTopic, ApiUser } from 'farcaster-client-data';
import {
  EventingProvider,
  formatShorthandNumber,
  useNonSuspenseTrendingTopics,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { LinkToTrendingTopic } from '~/components/links/LinkToTrendingTopic';

type TrendingTopicsResultsProps = {
  topics: ApiTrendingTopic[];
};

const TrendingTopicsResults: FC<TrendingTopicsResultsProps> = memo(
  ({ topics }) => {
    const { trackEvent } = useTrackEvent();

    return (
      <EventingProvider on="trending-topics">
        <div className="flex flex-col gap-4 px-2">
          {topics.map((item) => {
            return (
              <LinkToTrendingTopic
                title={item.displayName}
                key={item.id}
                topicId={item.id}
                displayName={item.displayName}
              >
                <div
                  className="flex flex-col"
                  onClick={() => {
                    trackEvent(AnalyticsEvent.PressTrendingTopic);
                  }}
                >
                  <div className="text-base font-semibold text-default">
                    {item.displayName}
                  </div>
                  <div className="mt-1 flex flex-row">
                    <div className="mr-2 flex flex-row items-center">
                      {item.users
                        .flatMap((user: ApiUser) => (user.pfp ? [user] : []))
                        .slice(0, 3)
                        .map((user, index) => {
                          return (
                            <div
                              key={user.fid}
                              style={{
                                marginLeft: index > 0 ? -8 : 0,
                              }}
                            >
                              <Avatar user={user} size="xs" disabled={true} />
                            </div>
                          );
                        })}
                      <div className="pl-1 text-faint">
                        and {item.userCount - item.users.length} others ·{' '}
                        {formatShorthandNumber(item.castCount)} casts
                      </div>
                    </div>
                  </div>
                </div>
              </LinkToTrendingTopic>
            );
          })}
        </div>
      </EventingProvider>
    );
  },
);
const TrendingTopics: FC = memo(() => {
  const { data, isLoading } = useNonSuspenseTrendingTopics();

  if (isLoading || !data || data.topics.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 hidden rounded-xl px-2 py-3 pt-1.5 bg-surface-secondary mdlg:block">
      <div className="p-2 pb-4 text-lg font-semibold">Trending</div>
      <TrendingTopicsResults topics={data.topics} />
    </div>
  );
});

TrendingTopics.displayName = 'TrendingTopics';

export { TrendingTopics };
