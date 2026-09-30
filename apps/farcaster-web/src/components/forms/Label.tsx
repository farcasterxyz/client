import cn from 'classnames';
import { FC, LabelHTMLAttributes, memo } from 'react';

import { defaultLabelWidth } from '~/constants/forms';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  width?: number;
};

const Label: FC<LabelProps> = memo(({ className, width, ...props }) => {
  return (
    <label
      className={cn(
        `mb-1 mt-[8.5px] shrink-0 text-sm font-semibold`,
        className,
      )}
      style={{ width: width || defaultLabelWidth }}
      {...props}
    />
  );
});

export { Label };
