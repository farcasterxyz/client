import cn from 'classnames';
import {
  forwardRef,
  InputHTMLAttributes,
  memo,
  useMemo,
  useState,
} from 'react';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  withCharCounter?: boolean;
};

const TextInput = memo(
  forwardRef<HTMLInputElement, TextInputProps>(
    ({ className, value, withCharCounter = false, ...props }, ref) => {
      const [isFocused, setIsFocused] = useState<boolean>(false);

      const valueByteLen = useMemo(() => {
        return value !== undefined
          ? Buffer.byteLength(value.toString(), 'utf-8')
          : 0;
      }, [value]);

      const charCounter = useMemo(() => {
        if (!isFocused) {
          return null;
        }

        if (!withCharCounter) {
          return null;
        }

        if (typeof props.maxLength === 'undefined') {
          return null;
        }

        const diff = props.maxLength - valueByteLen;

        return (
          <div
            className={cn(
              'absolute right-1.5 top-2 m-auto flex h-5 w-5 items-center justify-center rounded-full border text-xs',
              diff >= 25 ? 'hidden' : '',
              diff < 25 && diff > 10
                ? 'border-action-brown text-action-brown'
                : '',
              diff <= 10 ? 'border-action-red text-danger' : '',
            )}
          >
            {diff}
          </div>
        );
      }, [isFocused, props.maxLength, valueByteLen, withCharCounter]);

      const input = useMemo(
        () => (
          <input
            type="text"
            ref={ref}
            className={cn(
              'w-full rounded border bg-input p-2 text-sm border-default text-default',
              withCharCounter && 'pr-4',
              className,
            )}
            value={value ?? ''}
            onFocus={(e) => {
              if (props.onFocus) {
                props.onFocus(e);
              }
              setIsFocused(true);
            }}
            onBlur={(e) => {
              if (props.onBlur) {
                props.onBlur(e);
              }
              setIsFocused(false);
            }}
            {...props}
          />
        ),
        [className, props, ref, value, withCharCounter],
      );

      // Keeping the wrapping div separate to limit the
      // impact on non-char counter calls minimum.
      if (withCharCounter) {
        return (
          <div className={cn('relative', className)}>
            {input}
            {charCounter}
          </div>
        );
      }

      return <>{input}</>;
    },
  ),
);

TextInput.displayName = 'TextInput';

export { TextInput };
