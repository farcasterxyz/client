import { stringifyError } from './ErrorUtils';

const logPrefix = 'FarcasterCryptography:';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logDebug(msg: string, obj: any) {
  // eslint-disable-next-line no-console
  console.debug(logPrefix + msg);

  if (obj) {
    // eslint-disable-next-line no-console
    console.debug(JSON.stringify(obj));
  }
}

export function logError(error: Error) {
  // eslint-disable-next-line no-console
  console.error(logPrefix + 'Encountered Error');
  // eslint-disable-next-line no-console
  console.error(stringifyError(error));
}
