import { IncomingMessage } from 'http';

// https://github.com/vercel/next.js/discussions/21488
// https://stackoverflow.com/questions/65871390/how-to-determine-http-vs-https-in-nodejs-nextjs-api-handler
const getHost = ({ req }: { req: IncomingMessage }) => {
  const { host } = req.headers;

  if (!host) {
    return '';
  }

  const rawProto = req.headers['x-forwarded-proto'];
  const forwardedProto =
    typeof rawProto === 'string' ? rawProto.split(',')[0].trim() : null;
  let proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : 'https';

  if (host.startsWith('localhost')) {
    proto = `http://${host}`;
  }

  return `${proto}://farcaster.xyz`;
};

export { getHost };
