import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

export function useDebouncedValue<T>({
  value,
  debounceDuration = 500,
}: {
  /**
   * Must be a stable value. Memoize if needed.
   */
  value: T;
  debounceDuration?: number;
}): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const debounceValue = useMemo(() => {
    return debounce(
      (newValue: T) => {
        setDebouncedValue(newValue);
      },
      debounceDuration,
      {
        leading: false,
        trailing: true,
      },
    );
  }, [debounceDuration]);

  useEffect(() => {
    debounceValue(value);
  }, [debounceValue, value]);

  return debouncedValue;
}
