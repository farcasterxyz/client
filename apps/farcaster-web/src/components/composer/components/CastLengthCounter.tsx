import classNames from 'classnames';
import React from 'react';

import { CircleProgressIndicator } from '~/components/loaders/CircleProgressIndicator';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';

type CastLengthCounterProps = {
  castTextByteLength: number;
};

const CastLengthCounter: React.FC<CastLengthCounterProps> = ({
  castTextByteLength,
}) => {
  const { longCastByteLimit, regularCastByteLimit } = useUserAppContext();

  const regularCastRemaining = regularCastByteLimit - castTextByteLength;
  const longCastRemaining = longCastByteLimit - castTextByteLength;

  if (regularCastRemaining > 0 && regularCastByteLimit !== longCastByteLimit) {
    const progress =
      100 - Math.max((regularCastRemaining / regularCastByteLimit) * 100, 0);

    const strokeAlternate = '#8565cb';

    return (
      <CircleProgressIndicator
        stroke={'#f8f8f8'}
        strokeAlternate={strokeAlternate}
        progress={progress}
      />
    );
  }

  if (longCastRemaining > 25) {
    const passedAlertThreshold = longCastRemaining < 75;

    const progress =
      100 - Math.max((longCastRemaining / longCastByteLimit) * 100, 0);

    const strokeAlternate = passedAlertThreshold ? '#ffb93e' : '#8565cb';

    return (
      <CircleProgressIndicator
        stroke={'#f8f8f8'}
        strokeAlternate={strokeAlternate}
        progress={progress}
      />
    );
  }

  return (
    <div
      className={classNames(
        'text-sm',
        longCastRemaining < 0 ? 'text-danger' : 'text-muted',
      )}
    >
      {longCastRemaining}
    </div>
  );
};

export { CastLengthCounter };
