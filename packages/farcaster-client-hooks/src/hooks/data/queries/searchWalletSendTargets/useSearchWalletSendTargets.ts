import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiSearchWalletSendTargetsQueryParamsCamelCase,
  ApiWalletSendTarget,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
} from '../../helpers';
import { buildSearchWalletSendTargetsFetcher } from './buildSearchWalletSendTargetsFetcher';
import { buildSearchWalletSendTargetsKey } from './buildSearchWalletSendTargetsKey';

export const apiWalletSendTargetKeyExtractor = (
  item: ApiWalletSendTarget,
): string => {
  switch (item.type) {
    case 'user':
      return 'fid:' + item.user.fid.toString();
    case 'address':
      return 'address:' + item.address;
  }
};

export const useSearchWalletSendTargets = ({
  params,
}: {
  params: ApiSearchWalletSendTargetsQueryParamsCamelCase;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchWalletSendTargetsKey(params),
    queryFn: buildSearchWalletSendTargetsFetcher({
      apiClient,
      params,
    }),

    getNextPageParam: getNextPageCursor,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: apiWalletSendTargetKeyExtractor,
  });

  return extendResult(result, { flatData });
};
