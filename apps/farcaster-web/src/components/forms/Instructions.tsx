import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type InstructionsProps = {
  children: ReactNode;
  className?: string;
};

const Instructions: FC<InstructionsProps> = memo(({ children, className }) => {
  return (
    <div className={cn('pt-1 text-sm text-muted', className)}>{children}</div>
  );
});

Instructions.displayName = 'Instructions';

export { Instructions };
