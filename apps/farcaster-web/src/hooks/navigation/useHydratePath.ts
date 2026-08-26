import { useMemo } from 'react';

import { hydratePath } from '~/utils/navUtils';

const useHydratePath = ({
  path,
  params,
  searchParams,
}: {
  path: string;
  params: Record<string, unknown> | undefined;
  searchParams: Record<string, unknown> | undefined;
}) => {
  return useMemo(() => {
    return hydratePath({ path, params, searchParams });
  }, [params, path, searchParams]);
};

export { useHydratePath };
