import { isProd } from './Env';

const forceProdApi = true;

const useProdApi = isProd || forceProdApi;

const baseApiHost = useProdApi ? 'client.farcaster.xyz' : 'localhost:8080';

const baseUseHttps = useProdApi;

const baseApiUrl = baseUseHttps
  ? `https://${baseApiHost}`
  : `http://${baseApiHost}`;

const wsUrl =
  isProd || forceProdApi
    ? 'wss://ws.farcaster.xyz/stream'
    : `ws://${baseApiHost}/stream`;

const registryProxyAddress =
  isProd || forceProdApi
    ? '0xe3Be01D99bAa8dB9905b33a3cA391238234B79D1'
    : '0x7154655eE203d4700336f75384BC5D85dDa58f8A';

// eslint-disable-next-line no-console
console.log({ baseApiUrl, registryProxyAddress });

export { baseApiUrl, registryProxyAddress, wsUrl };
