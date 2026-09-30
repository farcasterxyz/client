import customConfig from 'eslint-config-custom/react';

const NOTION_RE = String.raw`/notion\.(?:so|site)/i`;

export default [
  ...customConfig,
  {
    files: ['**/*.config.js', '**/*.config.mjs', '**/.prettierrc.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      curly: 'error',
      'no-restricted-globals': ['error', 'reportError'],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression'][left.object.type='MemberExpression'][left.object.object.name='window'][left.object.property.name='location'][left.property.name='href']",
          message:
            'Please use useExternalNavigate() instead to support proper navigation in the PWA mode.',
        },
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression'][left.object.name='location'][left.property.name='href']",
          message:
            'Please use useExternalNavigate() instead to support proper navigation in the PWA mode.',
        },
        {
          selector: `Literal[value=${NOTION_RE}]`,
          message:
            'Use getNotionLink() helper instead of hard-coding Notion URLs.',
        },
        {
          selector: `TemplateElement[value.raw=${NOTION_RE}]`,
          message:
            'Use getNotionLink() helper instead of hard-coding Notion URLs.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'farcaster-client-hooks/src',
                'farcaster-client-hooks/src/**',
                '../../farcaster-client-hooks/src/**',
                '**/farcaster-client-hooks/src/**',
              ],
              message: 'Always import from farcaster-client-hooks.',
            },
            {
              group: ['../*'],
              message: 'Prefer absolute imports using the `~` alias.',
            },
            {
              group: ['~/pages/*'],
              message: 'Always import from ~/lazy/pages.',
            },
            {
              group: [
                './LoginQRCode',
                '~/components/login/LoginQRCode',
                '~/components/composer/Composer',
                './Composer',
              ],
              message: 'Please import from ~/lazy/components',
            },
            {
              group: [
                '~/components/casts/UnfocusedCast',
                '~/components/casts/FocusedCast',
              ],
              message:
                'You probably want ~/components/casts/Cast so it uses the global cast cache',
            },
          ],
          paths: [
            {
              name: 'localforage',
              message: 'Prefer utils in ~/utils/StorageUitls instead',
            },
            {
              name: '@tanstack/react-query',
              importNames: ['useMutation'],
              message:
                'Please write a memoized async function that handles optimistic updates and invalidations.',
            },
            {
              name: 'react-router-dom',
              importNames: [
                'Link',
                'NavLink',
                'useNavigate',
                'useParams',
                'useSearchParams',
              ],
              message:
                'Prefer navigation components in ~/components and hooks in ~/hooks/navigation.',
            },
            {
              name: 'linkify-it',
              message:
                'Prefer useLinkifyText hook in ~/hooks or the singleton linkify instance in ~/utils.',
            },
            {
              name: 'farcaster-client-hooks',
              importNames: [
                'useOnboardingState',
                'useMarkWalletConversationRead',
                'useRefreshWalletConversationForParticipants',
                'useUserAppContext',
                'useFeatureGate',
              ],
              message: 'Please use the corresponding local hook instead.',
            },
            {
              name: 'react-toastify',
              importNames: ['toast'],
              message:
                'Do not use React Toastify directly. Use toast() in utils/toast.ts instead.',
            },
            {
              name: '@radix-ui/react-tooltip',
              message: 'Please use ~/components/Tooltip instead.',
            },
          ],
        },
      ],
    },
  },
];
