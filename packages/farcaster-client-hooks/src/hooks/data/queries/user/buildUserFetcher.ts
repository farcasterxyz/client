import { FarcasterApiClient } from 'farcaster-client-data';

import { MergeIntoGloballyCachedUser } from '../../../../types';

const buildUserFetcher =
  ({
    apiClient,
    fid,
    mergeIntoGloballyCachedUser,
  }: {
    apiClient: FarcasterApiClient;
    fid: number;
    mergeIntoGloballyCachedUser: MergeIntoGloballyCachedUser;
  }) =>
  async () => {
    const response = await apiClient.getUser({ fid });
    mergeIntoGloballyCachedUser({ updates: response.data.result.user });
    return response.data;
  };

export { buildUserFetcher };
