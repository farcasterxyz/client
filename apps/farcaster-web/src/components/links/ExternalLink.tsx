import React, { FC, ReactNode } from 'react';

export type ExternalLinkProps = {
  children?: ReactNode;
  className?: string;
  href: string;
  stopPropagation?: boolean;
  title: string;
  onClick?: () => void;
  externalLinkRef?: React.RefObject<HTMLAnchorElement>;
  rel?: string;
};

const ExternalLink: FC<ExternalLinkProps> = ({
  children,
  className,
  href,
  stopPropagation = true,
  title,
  onClick,
  externalLinkRef,
  rel,
}) => {
  return (
    <a
      ref={externalLinkRef}
      className={className}
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
        }

        if (onClick) {
          onClick();
        }
      }}
      title={title}
      href={href}
      target={'_blank'}
      rel={rel ? `${rel} noopener noreferrer` : 'noopener noreferrer'}
    >
      {children}
    </a>
  );
};

export { ExternalLink };
