import { useEffect, useRef } from 'react';

const useCancelOnUnmountRef = () => {
  const controllerRef = useRef({ cancel: false });
  controllerRef.current.cancel = false;

  useEffect(() => {
    const controller = controllerRef.current;

    return () => {
      if (controller) {
        controller.cancel = true;
      }
    };
  }, []);

  return controllerRef;
};

export { useCancelOnUnmountRef };
