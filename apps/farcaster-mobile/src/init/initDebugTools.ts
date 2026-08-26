import { debugSuspenseEnabled } from '~/constants/Debug';

const initDebugTools = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DEBUG_SUSPENSE_ENABLED = debugSuspenseEnabled;
};

export { initDebugTools };
