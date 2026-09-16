import { InfiniteData } from '@tanstack/react-query';
import { ApiCast, ApiSearchCasts200Response } from 'farcaster-client-data';
import { useMemo } from 'react';

export function useFlatSearchCastsData({
  data,
}: {
  data: InfiniteData<ApiSearchCasts200Response> | undefined;
}): ApiCast[] | undefined {
  return useMemo(() => {
    // data being undefined means we haven't fetched anything
    // data.pages being empty is the placeholder value. If there are no results, we'd still have a
    // a page, but with no casts in it.
    if (!data || data.pages.length === 0) {
      return undefined;
    } else {
      return data.pages.flatMap((page) => page.result.casts);
    }
  }, [data]);
}
