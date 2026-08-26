import { ApiCast } from 'farcaster-client-data';
import uniqBy from 'lodash/uniqBy';
import { useMemo } from 'react';

import { BuildCastWithContextOptions } from '~/types';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const useCastsWithContext = (
  casts: ApiCast[],
  options: BuildCastWithContextOptions = {},
) => {
  return useMemo(
    () =>
      uniqBy(
        buildCastsWithContext(
          casts.map((cast) => ({ cast })),
          options,
        ),
        castWithContextKeyExtractor,
      ),
    [casts, options],
  );
};

export { useCastsWithContext };
