import { CheckCircleIcon } from '@primer/octicons-react';
import { FC } from 'react';

type ShareCastAsDirectCastToastProps = {
  message: string;
};

const ShareCastAsDirectCastToast: FC<ShareCastAsDirectCastToastProps> = ({
  message,
}) => {
  return (
    <div className="relative mb-1 flex flex-col rounded-lg border p-4 bg-cast-action-toast border-default">
      <div className="flex flex-row items-center justify-center text-default">
        <CheckCircleIcon size={18} className="mr-4 text-[#8a63d2]" />
        <div className="line-clamp-2">{message}</div>
      </div>
    </div>
  );
};

ShareCastAsDirectCastToast.displayName = 'ShareCastAsDirectCastToast';

export { ShareCastAsDirectCastToast };
