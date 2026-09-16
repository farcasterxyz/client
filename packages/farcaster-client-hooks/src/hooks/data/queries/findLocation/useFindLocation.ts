import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useEffect, useMemo } from 'react';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFindLocationFetcher } from './buildFindLocationFetcher';
import { buildFindLocationKey } from './buildFindLocationKey';

const gcTime = MILLIS_PER_MINUTE;
const debounceDuration = 500;

const useFindLocation = ({ q }: { q: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  const debouncedFetchFindLocation = useMemo(
    () =>
      debounce(
        buildFindLocationFetcher({
          apiClient,
          queryClient,
        }),
        debounceDuration,
        { leading: false, trailing: true },
      ),
    [apiClient, queryClient],
  );

  useEffect(() => {
    if (q) {
      debouncedFetchFindLocation({ q });
    }
  }, [debouncedFetchFindLocation, q]);

  return useSuspenseQuery({
    queryKey: buildFindLocationKey({ q }),

    queryFn: async () => {
      const response = await buildFindLocationFetcher({
        apiClient,
        queryClient,
      })({ q });

      return response;
    },

    gcTime,
  });
};

const useNonSuspenseFindLocation = ({ q }: { q: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  const debouncedFetchFindLocation = useMemo(
    () =>
      debounce(
        buildFindLocationFetcher({
          apiClient,
          queryClient,
        }),
        debounceDuration,
        { leading: false, trailing: true },
      ),
    [apiClient, queryClient],
  );

  useEffect(() => {
    if (q) {
      debouncedFetchFindLocation({ q });
    }
  }, [debouncedFetchFindLocation, q]);

  return useQuery({
    queryKey: buildFindLocationKey({ q }),

    queryFn: async () => {
      const response = await buildFindLocationFetcher({
        apiClient,
        queryClient,
      })({ q });

      return response;
    },

    gcTime,
  });
};

export { useFindLocation, useNonSuspenseFindLocation };
