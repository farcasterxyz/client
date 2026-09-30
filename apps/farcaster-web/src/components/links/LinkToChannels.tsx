import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToChannelsProps = Omit<
  LinkProps<'channel'>,
  'to' | 'params' | 'searchParams'
>;

const LinkToChannels: FC<LinkToChannelsProps> = memo(({ ...props }) => {
  return <Link to="channels" params={{}} searchParams={{}} {...props} />;
});

LinkToChannels.displayName = 'LinkToChannels';

export { LinkToChannels };
