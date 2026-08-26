import { FC, memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

type LoginErrorProps = {
  message: string;
  restart: () => void;
};

const LoginError: FC<LoginErrorProps> = memo(({ message, restart }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="mb-2 text-center  text-base text-danger">{message}</div>
      <div className="mb-4 text-sm text-muted">
        Make sure you've updated your Farcaster mobile app.
      </div>
      <DefaultButton className="min-w-[140px]" onClick={restart}>
        Try again
      </DefaultButton>
    </div>
  );
});

LoginError.displayName = 'LoginError';

export { LoginError };
