import {
  type DefaultError,
  type QueryKey,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { FarcasterError } from 'farcaster-client-data';

export type UseQueryParameters<
  queryFnData = unknown,
  error = FarcasterError | DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Partial<UseQueryOptions<queryFnData, error, data, queryKey>>;

export type UseSuspenseQueryParameters<
  queryFnData = unknown,
  error = FarcasterError | DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Partial<UseSuspenseQueryOptions<queryFnData, error, data, queryKey>>;
