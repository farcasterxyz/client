import { FC, memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { getErrorDescription } from '~/utils/errorUtils';

type PageErrorFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

const PageErrorFallback: FC<PageErrorFallbackProps> = memo(
  ({ error, resetErrorBoundary }) => {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <div className="mb-4">{getErrorDescription(error)}</div>
        <DefaultButton
          className="min-w-[140px]"
          onClick={() => {
            resetErrorBoundary();
          }}
        >
          Try again
        </DefaultButton>
      </div>
    );
  },
);

PageErrorFallback.displayName = 'PageErrorFallback';

export { PageErrorFallback };
