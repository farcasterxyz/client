import { DeviceMobileIcon, ShieldLockIcon } from '@primer/octicons-react';
import { FC, memo, ReactNode } from 'react';

import { LoginStrategy } from '~/types/login';

type SelectLoginStrategyProps = {
  setLoginStrategy: (strategy: LoginStrategy) => void;
};

const SelectLoginStrategy: FC<SelectLoginStrategyProps> = memo(
  ({ setLoginStrategy }) => {
    return (
      <div className="flex min-h-[264px] w-full flex-col">
        <div className="mt-4 text-center text-xl font-semibold">
          Choose a login strategy
        </div>
        <div className="flex grow flex-row gap-10 p-6">
          <LoginStrategyOption
            text="Companion"
            icon={<ShieldLockIcon size="medium" />}
            onClick={() => {
              setLoginStrategy('wallet');
            }}
          />
          <LoginStrategyOption
            text="Mobile"
            icon={<DeviceMobileIcon size="medium" />}
            onClick={() => {
              setLoginStrategy('mobile');
            }}
          />
        </div>
      </div>
    );
  },
);

SelectLoginStrategy.displayName = 'SelectLoginStrategy';

type LoginStrategyOptionProps = {
  icon: ReactNode;
  onClick: () => void;
  text: string;
};

const LoginStrategyOption: FC<LoginStrategyOptionProps> = memo(
  ({ icon, onClick, text }) => {
    return (
      <div
        className="flex grow basis-0 cursor-pointer flex-col items-center justify-center rounded-lg border text-center border-default"
        onClick={onClick}
      >
        {icon}
        <div className="mt-2 text-base">{text}</div>
      </div>
    );
  },
);

export { SelectLoginStrategy };
