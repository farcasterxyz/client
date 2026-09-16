import reactNativePlugin from 'eslint-plugin-react-native';
import { fixupPluginRules } from '@eslint/compat';
import reactConfig from './react.js';

const reactNativeConfig = [
  ...reactConfig,
  {
    files: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'],
    plugins: {
      'react-native': fixupPluginRules(reactNativePlugin),
    },
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
      },
    },
    rules: {
      'react-native/no-color-literals': 'warn',
    },
  },
];

export default reactNativeConfig;
