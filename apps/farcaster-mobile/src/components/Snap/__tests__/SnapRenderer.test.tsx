import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { SnapPageResponse } from '~/utils/snapUtils';

import { SnapRenderer } from '../SnapRenderer';

const mockOpenUrl = jest.fn();
const mockPush = jest.fn();
const mockTrackEvent = jest.fn();
const mockUpdateSnapCache = jest.fn();
const mockMarkInteracted = jest.fn();

type TestSnapCardHandlers = Record<string, (params: unknown) => void>;

jest.mock('farcaster-analytics', () => ({
  AnalyticsEvent: {
    HomeFeedSnapActivated: 'HomeFeedSnapActivated',
    SnapHandler: 'SnapHandler',
  },
}));

jest.mock('@farcaster/snap', () => ({
  validateSnapResponse: () => ({ valid: true, issues: [] }),
}));

jest.mock('@farcaster/snap/react-native', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');

  return {
    SnapCard: ({
      handlers,
      snap,
      onRenderStateChange,
    }: {
      handlers: TestSnapCardHandlers;
      snap: SnapPageResponse;
      onRenderStateChange?: (state: Record<string, unknown>) => void;
    }) => {
      const button = Object.values(snap.ui.elements).find(
        (element) => element.type === 'button',
      );

      if (!button || button.type !== 'button') {
        return null;
      }

      return React.createElement(
        TouchableOpacity,
        {
          onPress: () => {
            const press = button.on?.press;
            if (press && !Array.isArray(press)) {
              if (press.action === 'paginator_next') {
                onRenderStateChange?.({
                  ui: { paginator: { page: 1, pageCount: 2 } },
                });
              } else {
                handlers[press.action](press.params);
              }
            }
          },
        },
        React.createElement(Text, null, button.props.label),
      );
    },
  };
});

jest.mock('farcaster-client-data', () => ({
  apiChainToChainIdOrThrow: (chain: string) => {
    if (chain === 'eip155:8453') {
      return 8453;
    }

    throw new Error('Unsupported chain');
  },
  isAllowedSnapTargetUrl: () => true,
  parseCAIP19Token: (token: string) => {
    const [chain, ca] = token.split('/erc20:');
    if (!chain || !ca) {
      return null;
    }

    return {
      chain,
      ca: ca as `0x${string}`,
    };
  },
}));

jest.mock('farcaster-client-hooks', () => ({
  buildSnapActivationAnalyticsProps: ({
    activationTrigger,
    snapUrl,
    surface,
  }: {
    activationTrigger: string;
    snapUrl: string;
    surface: string;
  }) => ({
    activationTrigger,
    surface,
    snapDomain: 'example.com',
    snapSourceBucket: 'self_hosted',
    snapUrl,
  }),
  buildSnapHandlerAnalyticsProps: (url: string) => ({
    snapDomain: 'example.com',
    snapSourceBucket: 'self_hosted',
    snapUrl: url,
  }),
  getSnapPaginatorChangeAnalytics: () => ({
    handler: 'paginator_next',
    previousPage: 0,
    page: 1,
    pageCount: 2,
  }),
  isLocalhostUrl: () => false,
  snapUrlForAnalyticsEvent: (url: string) => url,
  useFarcasterApiClient: () => ({
    apiClient: {
      snapRequest: jest.fn(),
    },
  }),
  useFetchEvmScanAction: () => jest.fn(),
  useInteractedSnapUrls: () => ({
    markInteracted: mockMarkInteracted,
  }),
  useTrackEvent: () => ({
    defaultCastViewProps: {},
  }),
  useResolveMiniAppConfig: () => jest.fn(),
}));

jest.mock('farcaster-expo', () => ({
  useEmbeddedWallet: () => ({
    activeWalletId: undefined,
    evmAddress: undefined,
    evmMiniAppProvider: { request: jest.fn() },
    miniAppActiveWalletId: undefined,
    miniAppEvmAddress: undefined,
  }),
}));

jest.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

jest.mock('~/contexts/CreateCastComposerProvider', () => ({
  useOpenComposer: () => jest.fn(),
}));

jest.mock('~/contexts/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { text: { danger: 'red' } },
  }),
}));

jest.mock('~/hooks/data/useCurrentUser', () => ({
  useCurrentUser_UNSAFE: () => ({ fid: 1168110 }),
}));

jest.mock('~/hooks/navigation/usePush', () => ({
  usePush: () => mockPush,
}));

jest.mock('~/hooks/navigation/usePushToUserProfile', () => ({
  usePushToUserProfile: () => jest.fn(),
}));

jest.mock('~/hooks/useLaunchFrame', () => ({
  useLaunchFrame: () => jest.fn(),
}));

jest.mock('~/hooks/usePostHogFeatureFlag', () => ({
  usePostHogFeatureFlag: () => false,
}));

jest.mock('~/utils/LinkingUtils', () => ({
  usePossiblyNavigateOrOpenUrl: () => mockOpenUrl,
}));

jest.mock('../useFetchSnap', () => ({
  updateSnapCache: mockUpdateSnapCache,
}));

jest.mock('../useSnapThemeColors', () => ({
  useSnapThemeColors: () => ({
    appearance: 'light',
  }),
}));

describe('SnapRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes rendered view_channel actions through mobile channel navigation', () => {
    const onFirstInteraction = jest.fn();
    const onBeforeExternalAction = jest.fn();
    const onNavigateAway = jest.fn();
    const initialSnap: SnapPageResponse = {
      version: '2.0',
      ui: {
        root: 'root',
        elements: {
          root: {
            type: 'stack',
            children: ['open-channel'],
            props: {},
          },
          'open-channel': {
            type: 'button',
            props: {
              label: 'Open /fc-devs',
              variant: 'primary',
            },
            on: {
              press: {
                action: 'view_channel',
                params: {
                  channelKey: ' fc-devs ',
                },
              },
            },
          },
        },
      },
    };

    const { getByText } = render(
      <SnapRenderer
        snapUrl="https://example.com/snap"
        initialSnap={initialSnap}
        onFirstInteraction={onFirstInteraction}
        onBeforeExternalAction={onBeforeExternalAction}
        onNavigateAway={onNavigateAway}
      />,
    );

    fireEvent.press(getByText('Open /fc-devs'));

    expect(onFirstInteraction).toHaveBeenCalledTimes(1);
    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('Channel', {
      channelKey: 'fc-devs',
    });
    expect(mockOpenUrl).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith('SnapHandler', {
      handler: 'view_channel',
      surface: 'cast_embed_mobile',
      snapDomain: 'example.com',
      snapSourceBucket: 'self_hosted',
      snapUrl: 'https://example.com/snap',
    });
  });

  it('tracks rendered paginator state changes as snap handler events', () => {
    const onFirstInteraction = jest.fn();
    const initialSnap: SnapPageResponse = {
      version: '2.0',
      ui: {
        root: 'root',
        elements: {
          root: {
            type: 'stack',
            children: ['next-page'],
            props: {},
          },
          'next-page': {
            type: 'button',
            props: {
              label: 'Next page',
              variant: 'primary',
            },
            on: {
              press: {
                action: 'paginator_next',
              },
            },
          },
        },
      },
    };

    const { getByText } = render(
      <SnapRenderer
        snapUrl="https://example.com/snap"
        initialSnap={initialSnap}
        onFirstInteraction={onFirstInteraction}
      />,
    );

    fireEvent.press(getByText('Next page'));

    expect(onFirstInteraction).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith('SnapHandler', {
      handler: 'paginator_next',
      surface: 'cast_embed_mobile',
      previousPage: 0,
      page: 1,
      pageCount: 2,
      snapDomain: 'example.com',
      snapSourceBucket: 'self_hosted',
      snapUrl: 'https://example.com/snap',
    });
  });

  it('reseats rendered swap_token actions before navigating to wallet swap', () => {
    const onFirstInteraction = jest.fn();
    const onBeforeExternalAction = jest.fn();
    const onNavigateAway = jest.fn();
    const initialSnap: SnapPageResponse = {
      version: '2.0',
      ui: {
        root: 'root',
        elements: {
          root: {
            type: 'stack',
            children: ['swap-token'],
            props: {},
          },
          'swap-token': {
            type: 'button',
            props: {
              label: 'Swap',
              variant: 'primary',
            },
            on: {
              press: {
                action: 'swap_token',
                params: {
                  buyToken:
                    'eip155:8453/erc20:0x0000000000000000000000000000000000000001',
                },
              },
            },
          },
        },
      },
    };

    const { getByText } = render(
      <SnapRenderer
        snapUrl="https://example.com/snap"
        initialSnap={initialSnap}
        onFirstInteraction={onFirstInteraction}
        onBeforeExternalAction={onBeforeExternalAction}
        onNavigateAway={onNavigateAway}
      />,
    );

    fireEvent.press(getByText('Swap'));

    expect(onFirstInteraction).toHaveBeenCalledTimes(1);
    expect(onBeforeExternalAction).toHaveBeenCalledTimes(1);
    expect(onNavigateAway).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('WalletSwap', {
      platformType: 'mobile',
      swapIntent: {
        buy: {
          chainId: 8453,
          address: '0x0000000000000000000000000000000000000001',
        },
        sell: undefined,
      },
    });
  });
});
