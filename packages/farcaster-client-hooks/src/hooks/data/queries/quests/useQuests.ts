import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useConnectedAccounts } from '../connectedAccounts/useConnectedAccounts';
import { buildPhoneVerificationFetcher } from './buildPhoneVerificationFetcher';
import { buildPhoneVerificationKey } from './buildPhoneVerificationKey';
import { buildQuestFetcher, buildQuestsFetcher } from './buildQuestsFetchers';
import { buildQuestKey, buildQuestsKey } from './buildQuestsKeys';

const useQuests = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildQuestsKey(),
    queryFn: buildQuestsFetcher({ apiClient }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

const useNonSuspendingQuests = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildQuestsKey(),
    queryFn: buildQuestsFetcher({ apiClient }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

const useGetQuest = (questId: string) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildQuestKey(questId),
    queryFn: buildQuestFetcher({ apiClient, questId }),
  });
};

const usePhoneVerification = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildPhoneVerificationKey(),
    queryFn: buildPhoneVerificationFetcher({ apiClient }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

const useUserCompletedVerification = () => {
  const { data: connectedAccounts } = useConnectedAccounts();
  const { data: phoneVerification } = usePhoneVerification();

  const connectedXAccount = React.useMemo(() => {
    return connectedAccounts!.pages
      .flatMap((o) => o.result.accounts)
      .find(({ platform }) => platform === 'x');
  }, [connectedAccounts]);

  return { connectedXAccount, phoneVerification };
};

export {
  useGetQuest,
  useNonSuspendingQuests,
  usePhoneVerification,
  useQuests,
  useUserCompletedVerification,
};
