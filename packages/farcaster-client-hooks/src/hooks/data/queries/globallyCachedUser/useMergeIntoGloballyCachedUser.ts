import { useQueryClient } from '@tanstack/react-query';
import { ApiUser, shouldUpdateCache } from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback } from 'react';

import { useTelemetry } from '../../../../providers/TelemetryProvider';
import {
  GloballyCachedUserCache,
  MergeIntoGloballyCachedUser,
  UserUpdates,
} from '../../../../types';
import { buildGloballyCachedUserKey } from './buildGloballyCachedUserKey';
import { useGetGloballyCachedUser } from './useGetGloballyCachedUser';

const useMergeIntoGloballyCachedUser = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}): MergeIntoGloballyCachedUser => {
  const queryClient = useQueryClient();
  const getCachedUser = useGetGloballyCachedUser();
  const telemetry = useTelemetry();

  return useCallback(
    ({ updates }: { updates: UserUpdates }) => {
      if (!enabled) return; // No-op when disabled

      const startTime = Date.now();
      const queryKey = buildGloballyCachedUserKey({
        fid: updates.fid,
      });

      const cachedUser = getCachedUser({
        fid: updates.fid,
      });

      if (shouldUpdateCache({ cache: cachedUser, updates })) {
        queryClient.setQueryData<GloballyCachedUserCache>(
          queryKey,
          (prevUser: ApiUser | undefined) => merge({}, prevUser, updates),
        );
      }
      telemetry.maybeAddFrameDroppingAction(
        'farcaster-client-hooks.useMergeIntoGloballyCachedUser',
        Date.now() - startTime,
      );
    },
    [enabled, getCachedUser, queryClient, telemetry],
  );
};

export { useMergeIntoGloballyCachedUser };
