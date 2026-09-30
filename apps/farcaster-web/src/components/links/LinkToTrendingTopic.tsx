import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToTrendingTopicProps = Omit<
  LinkProps<'trendingTopic'>,
  'to' | 'params' | 'searchParams'
> & {
  topicId: string;
  displayName: string;
};

const LinkToTrendingTopic: FC<LinkToTrendingTopicProps> = memo(
  ({ topicId, displayName, ...props }) => {
    return (
      <Link
        to="trendingTopic"
        searchParams={{ displayName }}
        params={{ topicId }}
        {...props}
      />
    );
  },
);

LinkToTrendingTopic.displayName = 'LinkToTrendingTopic';

export { LinkToTrendingTopic };
