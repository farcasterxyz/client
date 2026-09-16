import { Buffer } from 'buffer';

const initPolyfills = () => {
  window.Buffer = Buffer;
};

export { initPolyfills };
