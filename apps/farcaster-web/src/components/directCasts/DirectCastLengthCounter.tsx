import classNames from 'classnames';
import React from 'react';

import { MAX_DIRECT_CAST_TEXT_LENGTH } from '~/constants/casts';

type DirectCastLengthCounterProps = {
  directCastLength: number;
};

const DirectCastLengthCounter: React.FC<DirectCastLengthCounterProps> = ({
  directCastLength,
}) => {
  const remaining = MAX_DIRECT_CAST_TEXT_LENGTH - directCastLength;

  if (remaining < 0) {
    return <div className={classNames('text-sm text-danger')}>{remaining}</div>;
  }

  return <></>;
};

export { DirectCastLengthCounter };
