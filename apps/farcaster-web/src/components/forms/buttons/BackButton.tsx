import { ArrowLeftIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { FC, memo } from 'react';

import { useCanGoBack } from '~/hooks/navigation/useCanGoBack';
import { useGoBack } from '~/hooks/navigation/useGoBack';

type BackButtonProps = {
  className?: string;
  shouldHideIfCannotGoBack?: boolean;
};

const BackButton: FC<BackButtonProps> = memo(
  ({ className, shouldHideIfCannotGoBack = true }) => {
    const canGoBack = useCanGoBack();
    const goBack = useGoBack();

    return (
      <div
        className={cn(
          'mr-1 flex cursor-pointer flex-col items-center justify-center rounded-full p-2 hover:bg-overlay-faint',
          !canGoBack && shouldHideIfCannotGoBack && 'hidden',
          className,
        )}
        onClick={goBack}
      >
        <ArrowLeftIcon size="small" />
      </div>
    );
  },
);

BackButton.displayName = 'BackButton';

export { BackButton };
