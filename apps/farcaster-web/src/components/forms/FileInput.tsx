import cn from 'classnames';
import { FC, InputHTMLAttributes, memo } from 'react';

type FileInputProps = InputHTMLAttributes<HTMLInputElement>;

const FileInput: FC<FileInputProps> = memo(({ className, ...props }) => {
  return (
    <input
      type="file"
      className={cn(
        'w-full rounded border bg-input p-2 text-sm border-default text-default',
        className,
      )}
      {...props}
    />
  );
});

FileInput.displayName = 'FileInput';

export { FileInput };
