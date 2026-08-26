type PaginatedResponse = {
  next: { cursor: string };
};

type TypedGetPreviousPageParamFunction<TQueryFnData, TPageParam> = (
  firstPage: TQueryFnData,
  allPages: TQueryFnData[],
) => TPageParam | undefined;

type TypedGetNextPageParamFunction<TQueryFnData, TPageParam> = (
  lastPage: TQueryFnData,
  allPages: TQueryFnData[],
) => TPageParam | undefined;

function isPaginatedResponse(response: unknown): response is PaginatedResponse {
  return !!(response && (response as PaginatedResponse).next?.cursor);
}

/**
 * Tries to extract a pagination cursor from the given paginated response.
 * @param lastPage - A `PaginatedResponse` object for the last page.
 * @returns The cursor or undefined.
 */
function getNextPageCursor(lastPage: unknown): string | undefined {
  if (isPaginatedResponse(lastPage)) {
    return lastPage.next.cursor;
  }
  return undefined;
}

/**
 * Tries to extract a pagination cursor from the given paginated response.
 * @param lastPage - A `PaginatedResponse` object for the last page.
 * @returns The cursor or undefined.
 */
const getPreviousPageCursor = getNextPageCursor;

/**
 * Tries to extract a pagination page from the given paginated response.
 * Note that this is an old pattern and unlikely what you want.
 * See `getNextPageCursor` instead.
 * @param lastPage - A `PaginatedResponse` object for the last page.
 * @param pages - An array of page response objects.
 * @returns The page or undefined.
 */
function getNextPageParamDeprecated(
  _lastPage: unknown,
  pages: unknown[],
): number | undefined {
  if (Array.isArray(pages)) {
    return pages.length + 1;
  }
  return undefined;
}

export {
  getNextPageCursor,
  getNextPageParamDeprecated,
  getPreviousPageCursor,
  type TypedGetNextPageParamFunction,
  type TypedGetPreviousPageParamFunction,
};
