import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ReferralsOverviewScreen } from '../ReferralsOverviewScreen';

const mockUseAnalytics = jest.fn();
const mockUseXPRewards = jest.fn();
const mockUseNonSuspenseGetOrCreateReferralCode = jest.fn();
const mockUseNonSuspenseXPClaimableSummary = jest.fn();
const mockUseTimeAgo = jest.fn();
const mockUseClaimReferralRewards = jest.fn();
const mockUseReferralsEnabled = jest.fn();
const mockUseXPNewEntrypoint = jest.fn();
const mockUsePullToRefreshInfinite = jest.fn();
const mockUseUnmediatedNavigate = jest.fn();
const mockUsePushToUserProfile = jest.fn();
const mockUseCurrentUserUnsafe = jest.fn();
const mockUseCurrentUser = jest.fn();
const mockUseHaptics = jest.fn();
const mockUseRootToast = jest.fn();
const mockGetNotionLinkTarget = jest.fn();
const mockSetOptions = jest.fn();
const mockOpenBrowserAsync = jest.fn();
const mockShareUrl = jest.fn();

const sanitizeTree = (node: unknown, depth = 0): unknown => {
  if (node === null || node === undefined) {
    return node;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return node;
  }

  if (Array.isArray(node)) {
    return node
      .map((child) => sanitizeTree(child, depth))
      .filter((child) => child !== null && child !== undefined);
  }

  if (typeof node === 'object') {
    if (depth >= 3) {
      return '…';
    }

    const {
      type,
      props = {},
      children,
    } = node as {
      type?: unknown;
      props?: Record<string, unknown>;
      children?: unknown;
    };

    const filteredProps: Record<string, unknown> = {};
    const keysToKeep = [
      'testID',
      'title',
      'accessibilityRole',
      'accessibilityLabel',
    ];

    keysToKeep.forEach((key) => {
      if (props[key] !== undefined) {
        filteredProps[key] = props[key];
      }
    });

    if (typeof props.children === 'string') {
      filteredProps.children = props.children;
    }

    return {
      type,
      props: filteredProps,
      children: sanitizeTree(children, depth + 1),
    };
  }

  return null;
};

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 0,
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn(),
  useRoute: jest.fn(),
  useNavigation: () => ({
    setOptions: mockSetOptions,
  }),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
}));

jest.mock('~/components/Screen', () => ({
  buildScreen: (_options: unknown, Content: React.FC) => Content,
}));

jest.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => mockUseAnalytics(),
}));

jest.mock('~/contexts/ThemeProvider', () => {
  const baseStyle = {};
  const theme = new Proxy(
    {
      colors: {
        text: {
          primary: '#000',
          secondary: '#666',
          tertiary: '#444',
          light: '#fff',
          brand: '#123',
        },
        background: {
          brand: '#123',
        },
      },
      iconSizes: {
        $16: 16,
        $20: 20,
      },
      borderRadiuses: {
        $16: 16,
      },
    },
    {
      get(target, prop: string) {
        if (prop in target) {
          return (target as Record<string, unknown>)[prop];
        }

        return baseStyle;
      },
    },
  );

  return {
    useTheme: () => theme,
  };
});

jest.mock('~/hooks/data/useCurrentUser', () => ({
  useCurrentUser_UNSAFE: () => mockUseCurrentUserUnsafe(),
}));

jest.mock('~/hooks/useXPNewEntrypoint', () => ({
  useXPNewEntrypoint: () => mockUseXPNewEntrypoint(),
}));

jest.mock('~/hooks/data/usePullToRefreshInfinite', () => ({
  usePullToRefreshInfinite: () => mockUsePullToRefreshInfinite(),
}));

jest.mock('~/hooks/navigation/methods/navigate', () => ({
  useUnmediatedNavigate: () => mockUseUnmediatedNavigate(),
}));

jest.mock('~/hooks/navigation/usePushToUserProfile', () => ({
  usePushToUserProfile: () => mockUsePushToUserProfile(),
}));

jest.mock('~/utils/SharingUtils', () => ({
  shareUrl: (...args: unknown[]) => mockShareUrl(...args),
}));

jest.mock('~/components/icons/ShareIcon', () => ({
  ShareIcon: ({ size }: { size: number }) => {
    const { Text } = require('react-native');
    return <Text>{`ShareIcon-${size}`}</Text>;
  },
}));

jest.mock('farcaster-analytics', () => ({
  AnalyticsEvent: {
    ViewReferralsOverviewScreen: 'ViewReferralsOverviewScreen',
    ViewReferralsInfo: 'ViewReferralsInfo',
    ViewXpRewardDetails: 'ViewXpRewardDetails',
    ShareReferralLink: 'ShareReferralLink',
    ClaimXPReward: 'ClaimXPReward',
    ClaimXPRewardSuccess: 'ClaimXPRewardSuccess',
    ClaimXPRewardError: 'ClaimXPRewardError',
    ViewReferralsListPressed: 'ViewReferralsListPressed',
  },
}));

jest.mock('farcaster-client-hooks', () => ({
  formatDisplayDollars: (value: number) => `$${value}`,
  getNotionLinkTarget: (...args: unknown[]) => mockGetNotionLinkTarget(...args),
  useClaimReferralRewards: () => mockUseClaimReferralRewards(),
  useNonSuspenseGetOrCreateReferralCode: (...args: unknown[]) =>
    mockUseNonSuspenseGetOrCreateReferralCode(...args),
  useNonSuspenseXPClaimableSummary: () =>
    mockUseNonSuspenseXPClaimableSummary(),
  useTimeAgo: (args: unknown) => mockUseTimeAgo(args),
  useXPRewards: () => mockUseXPRewards(),
}));

jest.mock('farcaster-expo', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  const AnimatedPressable = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable onPress={onPress} testID="animated-pressable">
      {children}
    </Pressable>
  );

  const SkeletonPlaceholder = ({
    children,
    testID = 'skeleton-placeholder',
  }: {
    children?: React.ReactNode;
    testID?: string;
  }) => <View testID={testID}>{children}</View>;

  const BottomSheetModal = React.forwardRef(
    (
      { children }: { children: React.ReactNode },
      ref: React.Ref<{ present: () => void; dismiss: () => void }>,
    ) => {
      const controls = React.useMemo(
        () => ({
          present: jest.fn(),
          dismiss: jest.fn(),
        }),
        [],
      );

      React.useImperativeHandle(ref, () => controls);

      return <View>{children}</View>;
    },
  );

  BottomSheetModal.displayName = 'MockBottomSheetModal';

  return {
    __esModule: true,
    AnimatedPressable,
    Avatar: ({ diameter }: { diameter: number }) => (
      <View testID="avatar">
        <Text>{`Avatar-${diameter}`}</Text>
      </View>
    ),
    BottomSheetContentContainer: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <View>{children}</View>,
    BottomSheetModal,
    ButtonV2: ({
      title,
      onPress,
      children,
    }: {
      title: string;
      onPress?: () => void;
      children?: React.ReactNode;
    }) => (
      <Pressable onPress={onPress} testID={`button-${title}`}>
        <Text>{title}</Text>
        {children}
      </Pressable>
    ),
    Card: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    CurrencyDisplay: ({ amount }: { amount: number }) => (
      <Text>{`$${amount}`}</Text>
    ),
    InfoIcon: ({ size }: { size: number }) => <Text>{`InfoIcon-${size}`}</Text>,
    SkeletonPlaceholder,
    Table: ({ rows }: { rows: { label: string; value: string }[] }) => (
      <View>
        {rows.map((row, index) => (
          <Text
            key={`${row.label}-${index}`}
          >{`${row.label}-${row.value}`}</Text>
        ))}
      </View>
    ),
    Text2: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
    Typography: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
    useBottomSheetModalRef: () =>
      React.useRef({
        present: jest.fn(),
        dismiss: jest.fn(),
      }),
    useCurrentUser: () => mockUseCurrentUser(),
    useHaptics: () => mockUseHaptics(),
    useRootToast: () => mockUseRootToast(),
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');

  const createIcon =
    (label: string) =>
    ({ size }: { size: number }) => <Text>{`${label}-${size}`}</Text>;

  return {
    BanIcon: createIcon('BanIcon'),
    CalendarOffIcon: createIcon('CalendarOffIcon'),
    ChevronRightIcon: createIcon('ChevronRightIcon'),
    CircleCheckIcon: createIcon('CircleCheckIcon'),
    CircleDashedIcon: createIcon('CircleDashedIcon'),
    TimerIcon: createIcon('TimerIcon'),
  };
});

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');

  const createIcon =
    (label: string) =>
    ({ size }: { size: number }) => <Text>{`${label}-${size}`}</Text>;

  return {
    Ionicons: createIcon('Ionicons'),
  };
});

jest.mock('@noble/hashes/sha2.js', () => ({
  sha256: jest.fn(),
}));

jest.mock('@scure/bip39', () => ({
  mnemonicToSeedWebcrypto: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  return {
    ...Reanimated,
    useSharedValue: (value: number) => ({ value }),
    withSpring: (value: number) => value,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));

const defaultProps = {
  navigation: {} as never,
  route: {
    key: 'ReferralsOverview',
    name: 'ReferralsOverview',
    params: undefined,
  } as never,
};

type SetupOptions = {
  referralsEnabled?: boolean;
  xpRewards?: Array<Record<string, unknown>> | undefined;
  isLoading?: boolean;
  totalUsdc?: number;
  totalReferrals?: number;
  claimableSummary?: {
    eligibleToClaim?: boolean;
    totalClaimableUsdc?: number;
  };
  referralCode?: string | null;
  xpNewEntrypointSeen?: boolean;
};

const setupMocks = ({
  referralsEnabled = true,
  xpRewards = [],
  isLoading = false,
  totalUsdc = 0,
  totalReferrals = 0,
  claimableSummary = {
    eligibleToClaim: false,
    totalClaimableUsdc: 0,
  },
  referralCode = 'ABCDEFGH',
  xpNewEntrypointSeen = true,
}: SetupOptions = {}) => {
  const trackEvent = jest.fn();
  const analyticsValue = { trackEvent };

  mockUseAnalytics.mockReturnValue(analyticsValue);

  mockUseReferralsEnabled.mockReturnValue(referralsEnabled);

  mockUseXPRewards.mockReturnValue({
    flatData: xpRewards,
    totalUsdc,
    totalReferrals,
    isLoading,
    onEndReached: jest.fn(),
    refetch: jest.fn(),
  });

  mockUseNonSuspenseGetOrCreateReferralCode.mockReturnValue(
    referralCode
      ? {
          data: {
            code: referralCode,
          },
        }
      : { data: undefined },
  );

  mockUseNonSuspenseXPClaimableSummary.mockReturnValue({
    data: claimableSummary,
    refetch: jest.fn(),
  });

  mockUseXPNewEntrypoint.mockReturnValue({
    xpNewEntrypointSeen,
  });

  const triggerImpactAsync = jest.fn();
  mockUseHaptics.mockReturnValue({ triggerImpactAsync });

  const toastShow = jest.fn();
  mockUseRootToast.mockReturnValue({ show: toastShow });

  const mutateAsync = jest.fn().mockResolvedValue(undefined);
  mockUseClaimReferralRewards.mockReturnValue({
    mutateAsync,
    isPending: false,
  });

  const currentUser = {
    fid: 123,
    username: 'tester',
    displayName: 'Test User',
    pfp: { url: 'https://example.com/pfp.png' },
  };

  mockUseCurrentUserUnsafe.mockReturnValue(currentUser);
  mockUseCurrentUser.mockReturnValue(currentUser);

  mockUsePullToRefreshInfinite.mockReturnValue({ refreshControl: null });

  const navigate = jest.fn();
  mockUseUnmediatedNavigate.mockReturnValue(navigate);

  const pushToUserProfile = jest.fn();
  mockUsePushToUserProfile.mockReturnValue(pushToUserProfile);

  mockUseTimeAgo.mockImplementation(() => '1h');

  mockGetNotionLinkTarget.mockReturnValue('https://example.com/guide');

  mockOpenBrowserAsync.mockResolvedValue(undefined);
  mockShareUrl.mockResolvedValue(undefined);

  return {
    trackEvent,
    triggerImpactAsync,
    mutateAsync,
    toastShow,
    navigate,
    pushToUserProfile,
  };
};

describe('<ReferralsOverviewScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalytics.mockReset();
    mockUseXPRewards.mockReset();
    mockUseNonSuspenseGetOrCreateReferralCode.mockReset();
    mockUseNonSuspenseXPClaimableSummary.mockReset();
    mockUseTimeAgo.mockReset();
    mockUseClaimReferralRewards.mockReset();
    mockUseReferralsEnabled.mockReset();
    mockUseXPNewEntrypoint.mockReset();
    mockUsePullToRefreshInfinite.mockReset();
    mockUseUnmediatedNavigate.mockReset();
    mockUsePushToUserProfile.mockReset();
    mockUseCurrentUserUnsafe.mockReset();
    mockUseCurrentUser.mockReset();
    mockUseHaptics.mockReset();
    mockUseRootToast.mockReset();
    mockGetNotionLinkTarget.mockReset();
    mockSetOptions.mockReset();
    mockOpenBrowserAsync.mockReset();
    mockShareUrl.mockReset();
  });

  it('renders loading state while XP rewards are loading', () => {
    setupMocks({
      xpRewards: undefined,
      isLoading: true,
    });

    const { getByTestId, toJSON } = render(
      <ReferralsOverviewScreen {...defaultProps} />,
    );

    expect(getByTestId('skeleton-placeholder')).toBeTruthy();
    expect(sanitizeTree(toJSON())).toMatchSnapshot('loading state');
  });

  it('renders empty state when XP rewards array is empty', () => {
    setupMocks({
      xpRewards: [],
      totalUsdc: 0,
      totalReferrals: 0,
      claimableSummary: {
        eligibleToClaim: false,
        totalClaimableUsdc: 0,
      },
      referralCode: 'ABCDEFGH',
    });

    const { toJSON, getByText } = render(
      <ReferralsOverviewScreen {...defaultProps} />,
    );

    expect(getByText('Invite your friends and earn')).toBeTruthy();
    expect(sanitizeTree(toJSON())).toMatchSnapshot('empty state');
  });

  it('renders overview content when XP rewards are available', async () => {
    const xpReward = {
      id: 1,
      type: 'swap',
      status: 'completed',
      usdc: 42,
      timestamp: Date.now(),
      user: {
        fid: 456,
        username: 'referrer',
        displayName: 'Referrer',
        pfp: { url: 'https://example.com/avatar.png' },
      },
    };

    const { trackEvent } = setupMocks({
      xpRewards: [xpReward],
      totalUsdc: 123,
      totalReferrals: 3,
      claimableSummary: {
        eligibleToClaim: true,
        totalClaimableUsdc: 50,
      },
      referralCode: 'ABCDEFGH',
    });

    const { getByText, toJSON } = render(
      <ReferralsOverviewScreen {...defaultProps} />,
    );

    await waitFor(() => {
      expect(getByText('Total earned')).toBeTruthy();
    });

    expect(getByText('Referral Code')).toBeTruthy();
    expect(getByText('ABCD-EFGH')).toBeTruthy();

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        'ViewReferralsOverviewScreen',
        {},
      );
    });

    expect(mockSetOptions).toHaveBeenCalled();
    expect(sanitizeTree(toJSON())).toMatchSnapshot('data state');
  });
});
