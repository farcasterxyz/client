import React, { FC } from 'react';

const XTopHatIcon: FC<{ size?: number }> = ({ size = 12 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.12201 1.125H10.776L7.16251 5.255L11.4135 10.875H8.08501L5.47801 7.4665L2.49501 10.875H0.840014L4.70501 6.4575L0.627014 1.125H4.04001L6.39651 4.2405L9.12201 1.125ZM8.54151 9.885H9.45801L3.54201 2.063H2.55851L8.54151 9.885Z"
        fill="currentColor"
      />
    </svg>
  );
};
XTopHatIcon.displayName = 'XTopHatIcon';

export { XTopHatIcon };
