/* eslint-disable no-undef */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
          disableImportExportTransform: false,
        },
      ],
    ],
    plugins: [
      [
        'babel-plugin-react-compiler',
        {
          sources: (filename) => {
            return (
              filename.indexOf('farcaster-client-hooks') !== -1 ||
              filename.indexOf('src/screens/Feed') !== -1 ||
              filename.indexOf('src/components/casts') !== -1 ||
              filename.indexOf('src/components/DirectCasts') !== -1 ||
              filename.indexOf('src/contexts/DirectCasts') !== -1 ||
              filename.indexOf('src/hooks/data/directCasts') !== -1 ||
              filename.indexOf('src/screens/DirectCast') !== -1 ||
              filename.indexOf('src/screens/PlaintextDirectCasts') !== -1
            );
          },
        },
      ],
      [
        'transform-inline-environment-variables',
        {
          include: ['FORCE_PROD_API'],
        },
      ],
      '@babel/plugin-transform-export-namespace-from',
      'farcaster-babel-plugins/named-arrow-funcs',
      // Uncomment to enable timing logging
      // 'farcaster-babel-plugins/with-timing',
      [
        'module-resolver',
        {
          alias: {
            '@noble/curves/bls12-381': './emptyModule.js',
            '@adraffy/ens-normalize': './emptyModule.js',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
