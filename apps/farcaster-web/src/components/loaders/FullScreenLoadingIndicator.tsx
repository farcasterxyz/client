import { FC, memo } from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

const FullScreenLoadingIndicator: FC = memo(() => (
  <div className="flex size-full min-h-screen flex-col items-center justify-start pt-48">
    <LoadingIndicator />
  </div>
));

export { FullScreenLoadingIndicator };
