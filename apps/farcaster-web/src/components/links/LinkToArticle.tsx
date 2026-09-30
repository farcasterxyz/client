import { AnalyticsEvent } from 'farcaster-analytics';
import { usePrefetchArticle } from 'farcaster-client-hooks';
import React from 'react';

import { Link, LinkProps } from '~/components/links/Link';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type LinkToArticleProps = Omit<LinkProps<'news'>, 'to'>;

const LinkToArticle: React.FC<LinkToArticleProps> = React.memo((props) => {
  const { trackEvent } = useAnalytics();

  const prefetchArticle = usePrefetchArticle();

  const onMouseOver = React.useCallback(() => {
    prefetchArticle({ publicId: props.params.id });
  }, [prefetchArticle, props.params.id]);

  const onClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressArticleOnFeed, {
      publicId: props.params.id,
    });
  }, [props.params.id, trackEvent]);

  return (
    <Link to="news" onMouseOver={onMouseOver} onClick={onClick} {...props} />
  );
});

LinkToArticle.displayName = 'LinkToArticle';

export { LinkToArticle };
