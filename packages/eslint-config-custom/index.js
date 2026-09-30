import js from '@eslint/js';
import typescriptPlugin from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import banPlugin from 'eslint-plugin-ban';
import importPlugin from 'eslint-plugin-import';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import { fixupPluginRules } from '@eslint/compat';

const baseConfig = [
  js.configs.recommended,
  ...typescriptPlugin.configs.recommended,
  prettierConfig,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '**/jest.setup.js',
      '**/setupTests.js',
      '**/vite.config.js',
      '**/next.config.js',
      '**/metro.config.js',
      '**/babel.config.js',
      '**/tailwind.config.js',
      '**/postcss.config.js',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': typescriptPlugin.plugin,
      'prettier': prettierPlugin,
      'ban': fixupPluginRules(banPlugin),
      'import': fixupPluginRules(importPlugin),
      'simple-import-sort': simpleImportSortPlugin,
    },
    languageOptions: {
      parser: typescriptPlugin.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'eqeqeq': 'error',
      'import/no-default-export': 'error',
      'no-console': 'error',
      'no-duplicate-imports': 'error',
      'no-implicit-globals': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-catch': 'off',
      'ban/ban': [
        'error',
        {
          name: 'reportError',
          message:
            'Prefer another error reporting function name (e.g. `trackError`), which does not conflict with the global `reportError` function, which may or may not be present depending on the environment.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lodash',
              message: 'Import [module] from lodash/[module] instead',
            },
          ],
        },
      ],
      'valid-typeof': 'error',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
];

export default baseConfig;
