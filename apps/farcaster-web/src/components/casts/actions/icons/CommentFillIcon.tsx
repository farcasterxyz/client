import React, { FC } from 'react';

const CommentFillIcon: FC = () => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.75 2.125C0.75 1.64175 1.14175 1.25 1.625 1.25H10.375C10.8582 1.25 11.25 1.64175 11.25 2.125V8.375C11.25 8.85825 10.8582 9.25 10.375 9.25H5.53033L3.74372 11.0366C3.60709 11.1732 3.42178 11.25 3.22855 11.25C2.82618 11.25 2.5 10.9238 2.5 10.5214V9.25H1.625C1.14175 9.25 0.75 8.85825 0.75 8.375V2.125Z"
        fill="currentColor"
      />
    </svg>
  );
};
CommentFillIcon.displayName = 'CommentFillIcon';

export { CommentFillIcon };
