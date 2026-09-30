import { useMemo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const useCurrentUserProfileCastsLinkProps = ({ title }: { title: string }) => {
  const { username, fid } = useCurrentUser();

  return useMemo(():
    | LinkProps<'profileCastsWithUsername'>
    | LinkProps<'profileCastsWithoutUsername'> => {
    if (username) {
      return {
        to: 'profileCastsWithUsername',
        params: { username },
        searchParams: {},
        title,
      };
    }

    return {
      to: 'profileCastsWithoutUsername',
      params: { fid },
      searchParams: {},
      title,
    };
  }, [username, fid, title]);
};

export { useCurrentUserProfileCastsLinkProps };
