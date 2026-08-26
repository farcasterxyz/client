import { KeyboardEvent, useEffect, useMemo, useState } from 'react';

const useSelectInputKeyboardShortcuts = <T>({
  data,
  onEnter,
}: {
  data: T[] | undefined;
  onEnter?: (params: {
    index: number;
    item: T | undefined;
    event: KeyboardEvent;
  }) => void;
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    // Undefined data means a new query
    if (!data) {
      setFocusedIndex(-1);
    }
  }, [data]);

  return useMemo(() => {
    return {
      focusedIndex,
      onKeyDown: (e: KeyboardEvent) => {
        if (!data) {
          return;
        }

        switch (e.key) {
          case 'ArrowUp':
            setFocusedIndex(Math.max(0, focusedIndex - 1));
            break;
          case 'ArrowDown':
            setFocusedIndex(Math.min(data.length - 1, focusedIndex + 1));
            break;
          case 'Enter':
            if (onEnter) {
              onEnter({
                index: focusedIndex,
                item: data[focusedIndex],
                event: e,
              });
            }
            break;
        }
      },
    };
  }, [data, focusedIndex, onEnter]);
};

export { useSelectInputKeyboardShortcuts };
