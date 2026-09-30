import { AlertIcon } from '@primer/octicons-react';
import cn from 'classnames';
import React, { ReactNode } from 'react';

export type AlertType = 'warning' | 'danger';
export type AlertSize = 'sm' | 'base';

const bgColorCN: Record<AlertType, string> = {
  warning: 'bg-yellow-50 dark:bg-yellow-100',
  danger: 'bg-[#d51338]/[.07]',
};

const iconColorCN: Record<AlertType, string> = {
  warning: 'text-yellow-400 dark:text-yellow-500',
  danger: 'text-[#D51338]/50',
};

const titleColorCN: Record<AlertType, string> = {
  warning: 'text-yellow-800 dark:text-yellow-900',
  danger: 'text-[#D51338]',
};

const textColorCN: Record<AlertType, string> = {
  warning: 'text-yellow-700 dark:text-yellow-800',
  danger: 'text-[#D51338]/90',
};

const textSizeCN: Record<AlertSize, string> = {
  sm: 'text-sm',
  base: '',
};

const paddingCN: Record<AlertSize, string> = {
  sm: 'px-4 py-[6px]',
  base: 'px-4 py-3',
};

export function Alert({
  title,
  message,
  children,
  type,
  size = 'sm',
}: {
  title?: string;
  message?: string;
  children?: (options: {
    textColorCN: string;
    titleColorCN: string;
  }) => ReactNode;
  type: AlertType;
  size?: AlertSize;
}) {
  return (
    <div className={cn('rounded-md', paddingCN[size], bgColorCN[type])}>
      {children ? (
        children({
          textColorCN: textColorCN[type],
          titleColorCN: titleColorCN[type],
        })
      ) : (
        <div className="flex">
          {title ? (
            <div className="flex">
              <div className="flex-none">
                <AlertIcon size={16} className={iconColorCN[type]} />
              </div>
              <div className="ml-3">
                <h3
                  className={cn(
                    'mb-2 mt-0.5 font-medium',
                    titleColorCN[type],
                    textSizeCN[size],
                  )}
                >
                  {title}
                </h3>
                {!!message && (
                  <div className={cn(textColorCN[type], textSizeCN[size])}>
                    <p>{message}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {!!message && (
                <div className={cn(textColorCN[type], textSizeCN[size])}>
                  <p>{message}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
