import customConfig from 'eslint-config-custom/next';

export default [
  ...customConfig,
  {
    files: ['src/pages/**/*.ts', 'src/pages/**/*.tsx'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];