import { useEffect } from 'react';

import { useUpdateHeaderOptions } from './useUpdateHeaderOptions';

const useSyncHeaderDisableCancel = (disableCancel: boolean) => {
  const updateHeaderOptions = useUpdateHeaderOptions();

  useEffect(() => {
    updateHeaderOptions({ disableCancel });
  }, [disableCancel, updateHeaderOptions]);
};

export { useSyncHeaderDisableCancel };
