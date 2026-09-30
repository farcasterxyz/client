import { InfiniteData } from '@tanstack/react-query';
import { ApiSearchUsers200Response, ApiUser } from 'farcaster-client-data';
import { useMemo } from 'react';

export function useFlatSearchUsersData({
  data,
}: {
  data: InfiniteData<ApiSearchUsers200Response> | undefined;
}): ApiUser[] | undefined {
  return useMemo(() => {
    // data being undefined means we haven't fetched anything
    // data.pages being empty is the placeholder value. If there are no results, we'd still have a
    // a page, but with no users in it.
    if (!data || data.pages.length === 0) {
      return undefined;
    } else {
      return data.pages.flatMap((page) => page.result.users);
    }
  }, [data]);
}
