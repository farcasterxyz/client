/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['farcaster-client-data', 'farcaster-web'],
  experimental: {
    largePageDataBytes: 5 * 1024 * 1000,
  },
  // redirects: async () => {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/w/feed/home',
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
