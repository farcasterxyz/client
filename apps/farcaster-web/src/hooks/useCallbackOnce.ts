import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useCallbackOnce = <Callback extends (...args: any) => any>(
  callback: Callback,
) => {
  const hasPerformedRef = useRef(false);

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: any) => {
      if (!hasPerformedRef.current) {
        hasPerformedRef.current = true;
        return callback(params);
      }
    },
    [callback],
  ) as Callback;
};

export { useCallbackOnce };
