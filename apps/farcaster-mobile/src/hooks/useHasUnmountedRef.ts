import { useEffect, useRef } from 'react';

const useHasUnmountedRef = () => {
  const hasUnmountedRef = useRef(false);

  useEffect(() => {
    return () => {
      hasUnmountedRef.current = true;
    };
  }, []);

  return hasUnmountedRef;
};

export { useHasUnmountedRef };
