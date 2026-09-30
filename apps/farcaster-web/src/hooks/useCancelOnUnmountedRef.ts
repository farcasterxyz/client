import { useEffect, useRef } from 'react';

const gracePeriodDuration = 250;

const useCancelOnUnmountRef = () => {
  const cancelControllerRef = useRef({ cancel: false });
  cancelControllerRef.current.cancel = false;

  const now = Date.now();
  const lastRenderedAtRef = useRef(now);
  lastRenderedAtRef.current = now;

  const lastUnmountedAtRef = useRef(0);

  useEffect(() => {
    const controller = cancelControllerRef.current;

    return () => {
      lastUnmountedAtRef.current = Date.now();

      setTimeout(() => {
        if (controller) {
          controller.cancel =
            lastRenderedAtRef.current + gracePeriodDuration <
            lastUnmountedAtRef.current;
        }
      }, gracePeriodDuration);
    };
  }, []);

  return cancelControllerRef;
};

export { useCancelOnUnmountRef };
