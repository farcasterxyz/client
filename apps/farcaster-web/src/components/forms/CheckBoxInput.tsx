import cn from 'classnames';
import { FC, InputHTMLAttributes, memo } from 'react';

type CheckboxInputProps = InputHTMLAttributes<HTMLInputElement>;

const CheckboxInput: FC<CheckboxInputProps> = memo(
  ({ className, ...props }) => {
    return (
      <input
        type="checkbox"
        className={cn('rounded border bg-input p-2 border-default', className)}
        {...props}
      />
    );
  },
);

CheckboxInput.displayName = 'CheckboxInput';

export { CheckboxInput };
