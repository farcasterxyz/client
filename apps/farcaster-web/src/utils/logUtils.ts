import { isDev } from '~/constants/env';

const logError: typeof console.error = (...args) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

const logInDevOnly: typeof console.log = (...args) => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export { logError, logInDevOnly };
