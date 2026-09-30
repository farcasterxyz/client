import { useMemo } from 'react';

import { useCurrentUser_UNSAFE } from './useCurrentUser';

const superAdminFids = new Set([]);

const useIsSuperAdmin = () => {
  const { fid } = useCurrentUser_UNSAFE();

  return useMemo(() => superAdminFids.has(fid), [fid]);
};

export { useIsSuperAdmin };
