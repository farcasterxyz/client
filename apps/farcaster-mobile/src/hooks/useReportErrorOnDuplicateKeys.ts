import { QueryKey } from '@tanstack/react-query';
import { DuplicateKeyError } from 'farcaster-client-hooks';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

import { trackError } from '~/utils/ErrorUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';

const useReportErrorOnDuplicateKeys = <T>(
  context: string,
  data: T[] | undefined,
  keyExtractor: (item: T, index: number) => QueryKey[number],
) => {
  useEffect(() => {
    if (!data?.length) {
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      const seen = new Set<unknown>();
      const duplicates: unknown[] = [];

      data.forEach((item, index) => {
        const key = keyExtractor(item, index);

        if (seen.has(key)) {
          duplicates.push(key);
        } else {
          seen.add(key);
        }
      });

      if (duplicates.length) {
        trackError(new DuplicateKeyError({ context, duplicates }));
        logErrorInDevOnly(
          `Duplicate keys found in ${context}: ${JSON.stringify(duplicates)}`,
        );
      }
    });
  }, [context, data, keyExtractor]);
};

const useReportErrorOnDuplicateKeysWithIndexFallback = <T>(
  context: string,
  data: T[] | undefined,
  keyExtractor: (item: T, index: number) => string,
) => {
  useEffect(() => {
    if (!data?.length) {
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      const seen = new Set<string>();
      const duplicates: string[] = [];

      data.forEach((item, index) => {
        const key = keyExtractor(item, index);

        if (seen.has(key)) {
          duplicates.push(key);
        } else {
          seen.add(key);
        }
      });

      if (duplicates.length) {
        trackError(new DuplicateKeyError({ context, duplicates }));
        logErrorInDevOnly(
          `Duplicate keys found in ${context}: ${JSON.stringify(duplicates)}`,
        );
      }
    });
  }, [context, data, keyExtractor]);
};

export {
  useReportErrorOnDuplicateKeys,
  useReportErrorOnDuplicateKeysWithIndexFallback,
};
