import { QueryKey } from '@tanstack/react-query';

// Lodash's `compact` will remove any value that is falsey,
// including `''`, `false`, `0`, and `null`. When compacting query keys,
// we only want to remove `undefined` specifically, as other values could
// potentially be valid.
const compactQueryKey = (queryKey: QueryKey) =>
  queryKey.filter((key) => key !== undefined);

export { compactQueryKey };
