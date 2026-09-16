import classNames from 'classnames';
import React from 'react';

type WarpProps = {
  size?: number;
  className?: string;
};

const Warp: React.FC<WarpProps> = ({ size = 20, className }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill={'none'}>
      <path
        className={classNames('fill-current', className)}
        fillRule="evenodd"
        d="M14.804.333a1.137 1.137 0 0 0-1.608 0L.333 13.196a1.137 1.137 0 0 0 0 1.608l12.863 12.863a1.137 1.137 0 0 0 1.608 0l12.863-12.863a1.137 1.137 0 0 0 0-1.608L14.804.333ZM14 5.159c0-.89-1.077-1.337-1.707-.707l-8.134 8.134a2 2 0 0 0 0 2.828l8.134 8.134c.63.63 1.707.184 1.707-.707V5.159Z"
        clipRule="nonzero"
      />
    </svg>
  );
};

Warp.displayName = 'Warp';

export { Warp };
