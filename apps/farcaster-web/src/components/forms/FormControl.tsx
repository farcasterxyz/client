import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type FormControlProps = {
  className?: string;
  error?: ReactNode | undefined;
  label: ReactNode;
  input: ReactNode;
  instructions: ReactNode;
};

const FormControl: FC<FormControlProps> = memo(
  ({ className, error, input, instructions, label }) => {
    return (
      <div
        className={cn(
          'relative flex flex-col pb-6 md:flex-row md:items-start md:gap-0',
          className,
        )}
      >
        {label}
        <div className="flex w-full flex-col">
          {input}
          {instructions}
          {error}
        </div>
      </div>
    );
  },
);

FormControl.displayName = 'FormControl';

export { FormControl };
