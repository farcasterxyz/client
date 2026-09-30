import customConfig from 'eslint-config-custom/react-native';

export default [
  ...customConfig,
  {
    ignores: ['lib/', 'vitest.config.js'],
  },
];
