import { CheckIcon } from 'lucide-react';
import React from 'react';

import { cn } from '~/lib/utils';

export const CheckBox = ({
  isChecked,
  toggleIsChecked,
}: {
  isChecked: boolean;
  toggleIsChecked: () => void;
}) => {
  return (
    <div onClick={toggleIsChecked}>
      <div
        className={cn(
          'mr-3 h-6 w-6 rounded-md border border-default',
          isChecked ? 'bg-surface-secondary' : 'bg-primary',
          'flex items-center justify-center',
        )}
      >
        {isChecked && <CheckIcon size={16} />}
      </div>
    </div>
  );
};
