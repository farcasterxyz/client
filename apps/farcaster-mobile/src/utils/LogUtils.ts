import { stringifyError } from 'farcaster-client-data';

import { isDev, isTest } from '~/constants/Env';

const logInDevOnly = (...args: unknown[]) => {
  if (isDev && !isTest) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

const logErrorInDevOnly = (...error: unknown[]) => {
  if (isDev && !isTest) {
    // eslint-disable-next-line no-console
    console.error(stringifyError(error));
  }
};

let lastTimedLogAt: number;

const logTimePassed = (...args: unknown[]) => {
  const now = Date.now();
  let timePassed = 0;

  if (lastTimedLogAt) {
    timePassed = now - lastTimedLogAt;
  }

  lastTimedLogAt = now;

  // eslint-disable-next-line no-console
  console.log(timePassed, 'ms –', ...args);
};

export { logErrorInDevOnly, logInDevOnly, logTimePassed };
