import { FarcasterApiClient } from 'farcaster-client-data';

import { MergeIntoGloballyCachedUser } from '../../../../types';

const buildUserByUsernameFetcher =
  ({
    apiClient,
    username,
    mergeIntoGloballyCachedUser,
  }: {
    apiClient: FarcasterApiClient;
    username: string;
    mergeIntoGloballyCachedUser: MergeIntoGloballyCachedUser;
  }) =>
  async () => {
    try {
      const response = await apiClient.getUserByUsername({
        // API endpoint is case-sensitive and won't accept
        // uppercased usernames as they are technically invalid
        // at the protocol layer.
        username: username.toLowerCase(),
      });
      mergeIntoGloballyCachedUser({ updates: response.data.result.user });
      return response.data;
    } catch {
      return null;
    }
  };

export { buildUserByUsernameFetcher };
