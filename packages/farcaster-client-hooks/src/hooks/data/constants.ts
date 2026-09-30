// The following is Tanstack Query docs recommendation on setting gcTime when using persistQueryClient
//
// gcTime should be set as the same value or higher than persistQueryClient's maxAge option.
// If lower than maxAge, garbage collection will kick in and discard the stored cache earlier than expected.
// https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
//
// Since we're only going to persist a subset of queries, we'll set a lower default gcTime for everything,
// and only the keys listed in STORED_CACHE_QUERY_KEYS_TO_KEEP should set gcTime to MAX_AGE;
export const MAX_AGE = 1000 * 60 * 60 * 24 * 14;
