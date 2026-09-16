import debounce from 'lodash/debounce';
import { useCallback, useRef, useState } from 'react';

export function useDebouncedState<T>(
  initialValue: T,
  {
    debounceDuration = 300,
  }: Partial<{
    debounceDuration?: number;
  }> = {},
) {
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [value, setValue] = useState(initialValue);

  const wrappedSetDebouncedValue = useRef(
    debounce(
      (newValue: T) => {
        setDebouncedValue(newValue);
      },
      debounceDuration,
      {
        leading: false,
        trailing: true,
      },
    ),
  ).current;

  const wrappedSetValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      wrappedSetDebouncedValue(newValue);
    },
    [wrappedSetDebouncedValue],
  );

  const forceSetValue = useCallback(
    (newValue: T) => {
      wrappedSetDebouncedValue.cancel();
      setValue(newValue);
      setDebouncedValue(newValue);
    },
    [wrappedSetDebouncedValue],
  );

  return [debouncedValue, wrappedSetValue, forceSetValue, value] as const;
}
