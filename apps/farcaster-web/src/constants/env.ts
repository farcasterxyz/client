const env = import.meta.env.MODE;
const isDev = env === 'development';
const isProd = !isDev;

// Replaced at build time
const releaseId = import.meta.env.VITE_RELEASE_ID || 'dev';

export { env, isDev, isProd, releaseId };
