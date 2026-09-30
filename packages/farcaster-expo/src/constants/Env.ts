const env = __DEV__ ? 'development' : 'production';

const isDev = env === 'development';
const isProd = env === 'production';

const isTest = isDev && typeof jest !== 'undefined';

export { env, isDev, isProd, isTest };
