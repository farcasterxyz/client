import cn from 'classnames';
import {
  forwardRef,
  memo,
  TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  autoSize?: boolean;
  hideResizeHandle?: boolean;
  onEnter?: () => void;
  withCharCounter?: boolean;
};

const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
      {
        autoFocus,
        autoSize,
        className,
        withCharCounter,
        hideResizeHandle,
        ...props
      },
      refParam,
    ) => {
      const fallbackRef = useRef<HTMLTextAreaElement>(null);
      const ref = refParam || fallbackRef;

      const [isFocused, setIsFocused] = useState<boolean>(false);

      const location = useLocation();

      const applyAutoSize = useCallback(() => {
        if (autoSize && ref && typeof ref === 'object' && ref.current) {
          ref.current.style.height = '0px';
          const scrollHeight = ref.current.scrollHeight;
          ref.current.style.height = scrollHeight + 4 + 'px'; // TODO: Avoid magic number accounting for padding
        }
      }, [autoSize, ref]);

      const valueByteLen = useMemo(() => {
        return props.value
          ? Buffer.byteLength(props.value.toString(), 'utf-8')
          : 0;
      }, [props.value]);

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

      useEffect(() => {
        applyAutoSize();
      }, [applyAutoSize, props.value]);

      useEffect(() => {
        if (autoFocus && typeof ref === 'object' && ref.current) {
          ref.current.focus();
        }
      }, [autoFocus, location, ref]);

      const textarea = useMemo(
        () => (
          <textarea
            ref={ref}
            className={cn(
              'w-full rounded border bg-input p-2 text-sm border-default text-default',
              hideResizeHandle && 'resize-none',
              className,
            )}
            autoFocus={autoFocus}
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
        [ref, hideResizeHandle, className, autoFocus, props],
      );

      // Keeping the wrapping div separate to limit the
      // impact on non-char counter calls minimum.
      if (withCharCounter) {
        return (
          <div className={cn('relative', className)}>
            <textarea
              ref={ref}
              className={cn(
                'w-full rounded border bg-input p-2 text-sm border-default text-default',
                hideResizeHandle && 'resize-none',
                className,
              )}
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
            {charCounter}
          </div>
        );
      }

      return <>{textarea}</>;
    },
  ),
);

Textarea.displayName = 'Textarea';

export { Textarea };
