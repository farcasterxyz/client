import {
  usePrefetchStarterPack,
  usePrefetchStarterPackUsers,
} from 'farcaster-client-hooks';
import { FC, memo, useCallback } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToStarterPackProps = Omit<LinkProps<'starterPackWithUsername'>, 'to'>;

const LinkToStarterPack: FC<LinkToStarterPackProps> = memo((props) => {
  const prefetchStarterPack = usePrefetchStarterPack();
  const prfetchStarterPackUsers = usePrefetchStarterPackUsers();

  const onMouseOver = useCallback(() => {
    prefetchStarterPack({ id: props.params.id });
    prfetchStarterPackUsers({ id: props.params.id });
  }, [prefetchStarterPack, prfetchStarterPackUsers, props.params.id]);

  return (
    <Link to="starterPackWithUsername" onMouseOver={onMouseOver} {...props} />
  );
});

LinkToStarterPack.displayName = 'LinkToStarterPack';

export { LinkToStarterPack };
