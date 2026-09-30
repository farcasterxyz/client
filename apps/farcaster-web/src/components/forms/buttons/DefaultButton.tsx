import cn from 'classnames';
import { ButtonHTMLAttributes, forwardRef, memo } from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

export type DefaultButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  size?: 'sm' | 'sm-tall' | 'md' | 'lg';
  variant?:
    | 'normal'
    | 'old-normal'
    | 'muted'
    | 'danger'
    | 'inverted'
    | 'secondary'
    | 'link'
    | 'tertiary';
};

const DefaultButton = memo(
  forwardRef<HTMLButtonElement, DefaultButtonProps>(
    (
      {
        children,
        className,
        isLoading = false,
        size = 'md',
        variant = 'normal',
        ...props
      },
      ref,
    ) => {
      return (
        <button
          ref={ref}
          className={cn(
            'rounded-full font-semibold',
            (variant === 'normal' || variant === 'old-normal') && [
              'border border-transparent bg-action-primary text-light',
              'active:border-action-primary-active',
              'disabled:bg-action-primary-disabled disabled:text-action-primary-disabled disabled:active:border-transparent',
            ],
            variant === 'muted' && [
              'border bg-action-tertiary border-action-tertiary',
              'hover:bg-action-tertiary-hover hover:border-action-tertiary-hover',
              'active:border-action-tertiary-active',
              'disabled:border-action-tertiary disabled:text-action-tertiary-disabled disabled:hover:bg-action-tertiary disabled:active:border-action-tertiary',
            ],

            variant === 'danger' &&
              'bg-action-danger text-light disabled:opacity-50',
            variant === 'inverted' &&
              'bg-action-inverted text-default disabled:opacity-50',
            variant === 'secondary' &&
              'border bg-action-secondary border-default text-default disabled:opacity-50',
            variant === 'link' && 'text-action-purple disabled:opacity-50',
            variant === 'tertiary' &&
              'bg-brand-light text-brand disabled:opacity-50',

            // Compensate for border in new design system
            variant === 'normal' && [
              size === 'sm' && 'px-[0.4333rem] py-[0.15333rem]',
              size === 'sm-tall' && 'px-[0.4333rem] py-[0.4333rem]',
              size === 'md' && 'px-[0.9333rem] py-[0.4333rem]',
              size === 'lg' && 'px-[0.9333rem] py-[0.2458rem]',
            ],
            // Old paddings (muted should likely have smaller padding to compensate for visible border but it will make
            // buttons smaller)
            variant !== 'normal' && [
              size === 'sm' && 'px-2 py-1',
              size === 'sm-tall' && 'px-2 py-2',
              size === 'md' && 'px-4 py-2',
              size === 'lg' && 'px-4 py-2.5',
            ],
            // TODO: remove text-action-purple from size and use secondary button instead
            size === 'sm' && 'text-sm',
            size === 'sm-tall' && 'text-sm',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-default',
            className,
          )}
          {...props}
        >
          {isLoading ? (
            <div className="items-center justify-center">
              <LoadingIndicator
                containerClassName={cn(
                  'opacity-75',
                  variant === 'muted' ? 'text-default' : 'text-light',
                )}
                size="sm"
              />
            </div>
          ) : (
            children
          )}
        </button>
      );
    },
  ),
);

DefaultButton.displayName = 'DefaultButton';

export { DefaultButton };
