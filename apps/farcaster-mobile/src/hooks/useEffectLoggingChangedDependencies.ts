import { EffectCallback, useEffect, useRef } from 'react';

import { logInDevOnly } from '~/utils/LogUtils';

const useEffectLoggingChangedDependencies = (
  callback: EffectCallback,
  namedDeps: Record<string, unknown>,
) => {
  const prevNamedDepsRef = useRef(namedDeps);

  for (const key in namedDeps) {
    const currentValue = namedDeps[key];
    const prevValue = prevNamedDepsRef.current[key];

    if (currentValue !== prevValue) {
      logInDevOnly(
        `Dependency ${key} changed from ${prevValue} to ${currentValue}`,
      );
    }
  }
  prevNamedDepsRef.current = namedDeps;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useEffect(callback, Object.values(namedDeps));
};

export { useEffectLoggingChangedDependencies };
