import { useQuery } from '@tanstack/react-query';
import { ApiVerificationProtocol } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletSendSuggestionsFetcher } from './buildWalletSendSuggestionsFetcher';
import { buildWalletSendSuggestionsKey } from './buildWalletSendSuggestionsKey';

export const useWalletSendSuggestionsQuery = ({
  protocol,
}: {
  protocol: ApiVerificationProtocol;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildWalletSendSuggestionsKey({ protocol }),
    queryFn: buildWalletSendSuggestionsFetcher({ apiClient, protocol }),
  });
};
