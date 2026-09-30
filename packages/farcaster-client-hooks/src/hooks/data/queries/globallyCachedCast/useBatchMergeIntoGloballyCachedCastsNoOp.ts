import { useCallback } from 'react';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';

const useBatchMergeIntoGloballyCachedCastsNoOp =
  (): BatchMergeIntoGloballyCachedCasts => {
    return useCallback(() => {}, []);
  };

export { useBatchMergeIntoGloballyCachedCastsNoOp };
