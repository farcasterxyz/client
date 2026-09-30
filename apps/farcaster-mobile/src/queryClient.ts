import { QueryClient } from '@tanstack/react-query';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'farcaster-client-hooks';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Failed network requests are the most common reason for errors in our
      // clients. Retry up to three times.
      retry: 3,

      // Real-time data flows in via WebSocket / explicit invalidation, so
      // the staleTime is only the floor for refetch-on-mount/-reconnect. 3s
      // was tight enough to drive cache churn that ran the JS-thread MMKV
      // persister continuously on Android; 10s keeps things effectively
      // real-time while halving persist pressure.
      staleTime: 10 * MILLIS_PER_SECOND,
      gcTime: MILLIS_PER_MINUTE * 10, // How long until inactive queries are removed from the cache (1 min for testing)
      refetchOnWindowFocus: false, // This relies on events that are not supported by React Native https://github.com/tannerlinsley/react-query/blob/3981f5219a1e3d8f48d13108b55673dcaea46319/src/core/focusManager.ts#L20-L27
      refetchOnReconnect: true,
      refetchInterval: false,
    },
  },
});
