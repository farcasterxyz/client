import { FC } from 'react';

import { CastActionIcon } from '~/components/icons/CastActionIcon';

type CastActionErrorToastProps = {
  message: string;
  iconName: string;
};

const CastActionErrorToast: FC<CastActionErrorToastProps> = ({
  message,
  iconName,
}) => {
  return (
    <div className="relative mb-1 flex flex-col rounded-lg border p-4 bg-cast-action-error-toast border-danger">
      <div className="flex flex-row items-center justify-center text-default">
        <span className="mr-4 text-danger">
          <CastActionIcon iconName={iconName} size={18} />
        </span>
        <div className="line-clamp-2">{message}</div>
      </div>
    </div>
  );
};

CastActionErrorToast.displayName = 'CastActionErrorToast';

export { CastActionErrorToast };
