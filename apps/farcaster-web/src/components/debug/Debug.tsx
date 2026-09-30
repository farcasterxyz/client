import { FC, memo, ReactNode } from 'react';

import { useDebug } from '~/contexts/DebugProvider';

type DebugProps = {
  children: ReactNode;
};

const Debug: FC<DebugProps> = memo(({ children }) => {
  const { isEnabled } = useDebug();

  if (!isEnabled) {
    return null;
  }

  return <>{children}</>;
});

Debug.displayName = 'Debug';

export { Debug };
