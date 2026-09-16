import customConfig from 'eslint-config-custom/react-native';

const NOTION_RE = String.raw`/notion\.(?:so|site)/i`;

export default [
  ...customConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-restricted-syntax': [
        'error',
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
        {
          selector:
            'JSXAttribute[name.name="tintColor"][value.value="transparent"], JSXAttribute[name.name="tintColor"] Literal[value="transparent"]',
          message:
            'Avoid tintColor="transparent", this crashes on Android. Make sure to wrap your caller with Platform check if you have to use the prop.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Prefer absolute imports using the `~` alias.',
            },
            {
              group: [
                'farcaster-client-hooks/src',
                'farcaster-client-hooks/src/**',
                '../../farcaster-client-hooks/src/**',
                '**/farcaster-client-hooks/src/**',
              ],
              message: 'Always import from farcaster-client-hooks.',
            },
          ],
          paths: [
            {
              name: 'date-fns',
              message:
                'Please import from a subpath, e.g. `date-fns/formatDistinceStrict`.',
            },
            {
              name: 'ox',
              message: 'Import [module] from ox/[module] instead',
            },
            {
              name: 'react-native',
              importNames: ['Text'],
              message: 'Please use Text from ~/components/Text instead.',
            },
            {
              name: 'react-native-easy-markdown',
              message:
                'Please use Markdown from ~/components/Markdown instead.',
            },
            {
              name: 'react-native-tab-view',
              importNames: ['TabBar'],
              message:
                'Please use buildTabBar from ~/components/TabBar instead.',
            },
            {
              name: '@tanstack/react-query',
              importNames: ['useMutation'],
              message:
                'Please write a memoized async function that handles optimistic updates and invalidations.',
            },
            {
              name: '@react-navigation/native',
              importNames: ['useTheme', 'useScrollToTop'],
              message: 'Please use hook from ~/hooks instead.',
            },
            {
              name: 'farcaster-client-hooks',
              importNames: ['useUserAppContext', 'useFeatureGate'],
              message:
                'Please use hooks that are relative to the mobile context tree instead.',
            },
            {
              name: 'farcaster-client-data',
              importNames: ['ApiDirectCast'],
              message: 'Please use types from ~/types instead.',
            },
            {
              name: 'farcaster-cryptography',
              importNames: [
                'ConversationParticipant',
                'DirectCast',
                'DirectCastConversation',
                'ensureUserKeys',
                'getConversation',
                'getConversationForParticipants',
                'getConversationPage',
                'getInbox',
                'getUnseenConversations',
                'getUnseenConversations',
                'InboxDirectCast',
                'sendDirectCast',
                'sync',
              ],
              message: 'Please use local ~/hooks or ~/types exports instead.',
            },
            {
              name: 'expo-haptics',
              message: 'Please use useHaptics instead.',
            },
            {
              name: '@gorhom/bottom-sheet',
              importNames: ['default', 'BottomSheetModal'],
              message: 'Import [module] from ~/components/BottomSheet instead',
            },
            {
              name: 'react-native',
              importNames: ['Share'],
              message: 'Please use shareUrl from ~/utils/SharingUtils instead.',
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
];
