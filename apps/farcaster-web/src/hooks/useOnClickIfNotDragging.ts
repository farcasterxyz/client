import { MouseEvent, useMemo, useRef } from 'react';

const distanceThreshold = 5;

const useOnClickIfNotDragging = (onClick: (e: MouseEvent) => void) => {
  const startCoordsRef = useRef({ x: 0, y: 0 });

  return useMemo(
    () => ({
      onMouseDown: (e: MouseEvent) => {
        startCoordsRef.current = { x: e.clientX, y: e.clientY };
      },
      onClick: (e: MouseEvent) => {
        const { x: x1, y: y1 } = startCoordsRef.current;
        const { clientX: x2, clientY: y2 } = e;
        const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

        if (
          distance < distanceThreshold &&
          !window.getSelection()?.toString()
        ) {
          onClick(e);
        }
      },
    }),
    [onClick],
  );
};

export { useOnClickIfNotDragging };
