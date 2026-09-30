import React from 'react';

import { cn } from '~/lib/utils';

type CardVariant = 'default' | 'secondary' | 'primary-gradient';

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
};

const OuterContainer = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant: CardVariant;
  className?: string;
}) => {
  const sharedClassNames = `p-3 rounded-[20px] `;
  if (variant === 'primary-gradient') {
    return (
      <div
        className={cn(
          sharedClassNames,
          `border 
    border-primary 
    bg-[linear-gradient(80deg,rgba(98,126,234,0.08)_7.78%,rgba(220,31,255,0.01)_82.77%)]
    dark:border-primary
    dark:bg-[linear-gradient(80deg,rgba(98,126,234,0.15)_7.78%,rgba(220,31,255,0.08)_82.77%)]`,
          className,
        )}
      >
        {children}
      </div>
    );
  }
  const backgroundClassNames =
    variant === 'default'
      ? 'bg-default'
      : variant === 'secondary'
        ? 'bg-surface-secondary'
        : '';
  return (
    <div className={cn(sharedClassNames, backgroundClassNames, className)}>
      {children}
    </div>
  );
};

const Card = ({ children, variant = 'default' }: CardProps) => {
  return <OuterContainer variant={variant}>{children}</OuterContainer>;
};

Card.OuterContainer = OuterContainer;

export { Card };
