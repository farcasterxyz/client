import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { FC, memo, useCallback } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToFollowersYouKnowWithoutUsername } from '~/components/links/LinkToFollowersYouKnowWithoutUsername';
import { LinkToFollowersYouKnowWithUsername } from '~/components/links/LinkToFollowersYouKnowWithUsername';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type LinkToFollowersYouKnowProps = Omit<
  LinkProps<'followersYouKnowWithoutUsername' | 'followersYouKnowWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
  source: 'follows' | 'profile';
};

const LinkToFollowersYouKnow: FC<LinkToFollowersYouKnowProps> = memo(
  ({ user, source, onClick, ...props }) => {
    const { trackEvent } = useAnalytics();

    const wrappedOnClick = useCallback(
      (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        trackEvent(AnalyticsEvent.ClickFollowersYouKnow, {
          source,
        });
        onClick?.(event);
      },
      [trackEvent, onClick, source],
    );

    if (user.username) {
      return (
        <LinkToFollowersYouKnowWithUsername
          params={{ username: user.username }}
          fid={user.fid}
          onClick={wrappedOnClick}
          {...props}
        />
      );
    } else {
      return (
        <LinkToFollowersYouKnowWithoutUsername
          params={{ fid: user.fid }}
          onClick={wrappedOnClick}
          {...props}
        />
      );
    }
  },
);

LinkToFollowersYouKnow.displayName = 'LinkToFollowersYouKnow';

export { LinkToFollowersYouKnow };
