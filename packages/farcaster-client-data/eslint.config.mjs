import customConfig from 'eslint-config-custom';

export default [
  ...customConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'farcaster-client-data',
              message: 'Prefer relative paths instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/__tests__/*'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/types/api.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
