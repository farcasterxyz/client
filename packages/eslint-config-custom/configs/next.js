import reactConfig from './react.js';
import nextPlugin from '@next/eslint-plugin-next';
import { fixupPluginRules } from '@eslint/compat';

const nextConfig = [
  ...reactConfig,
  {
    files: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'],
    plugins: {
      '@next/next': fixupPluginRules(nextPlugin),
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default nextConfig;
