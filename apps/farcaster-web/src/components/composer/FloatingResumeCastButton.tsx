import { PencilIcon } from '@primer/octicons-react';
import { memo } from 'react';

import { ComposeCastButton } from '~/components/forms/buttons/ComposeCastButton';
import { useCastComposerSession } from '~/contexts/CastComposerSessionProvider';
import { cn } from '~/lib/utils';

type FloatingResumeCastButtonProps = {
  className?: string;
};

const FloatingResumeCastButton = memo(
  ({ className }: FloatingResumeCastButtonProps) => {
    const { hasBackgroundedSession, resumeComposer } = useCastComposerSession();

    if (!hasBackgroundedSession) {
      return null;
    }

    return (
      <ComposeCastButton
        className={cn(
          'pointer-events-auto inline-flex items-center gap-1.5 shadow-[0px_4px_14px_rgba(0,0,0,0.16)]',
          className,
        )}
        onClick={resumeComposer}
      >
        <PencilIcon size={14} />
        <span>Resume Cast</span>
      </ComposeCastButton>
    );
  },
);

FloatingResumeCastButton.displayName = 'FloatingResumeCastButton';

export { FloatingResumeCastButton };
