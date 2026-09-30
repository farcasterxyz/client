import React from 'react';

import { UnauthedDataDogTracker } from './DataDogTracker';

type UnauthedInitializersProps = {
  children: React.ReactNode;
};

const UnauthedInitializers: React.FC<UnauthedInitializersProps> = React.memo(
  ({ children }) => {
    return <UnauthedDataDogTracker>{children}</UnauthedDataDogTracker>;
  },
);

UnauthedInitializers.displayName = 'UnauthedInitializers';

export { UnauthedInitializers };
