import {
  ApiChain,
  ApiPaymentMethod,
  CastHashPrefix,
} from 'farcaster-client-data';
import { match } from 'path-to-regexp';

import { MiniAppProps } from '~/components/MiniApp/types';
import { getLoginChannelIdFromUrl } from '~/constants/Params';
import { joinChannelViaInviteCodePrompt } from '~/constants/Storage';
import { GlobalPromptData } from '~/contexts/GlobalPromptsProvider';
import {
  AdvancedScreenSections,
  FullParamList,
  OnboardingParams,
  ScreenName,
} from '~/types';
import { createFeedParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { isEmailValid } from '~/utils/EmailUtils';

import { createFeedParamsWithMintPrompt } from './FeedPromptUtils';

const possiblyUsernameMatchingAppPathTilde = '~';
const appPathPrefix = `/${possiblyUsernameMatchingAppPathTilde}`;

// Routes that only exist on web and must be handed to a browser when they
// arrive as universal links (stale AASA caches on iOS, host-wide app links
// on Android). Without this guard they fall through to the /:username profile
// resolver and dead-end on the Not Found screen.
//
// Currently empty because /magic-link — the only route that previously
// needed this — is now handled natively by the mobile app for the email
// sign-in flow. Add entries here for any future web-only routes.
const webOnlyPathnames: string[] = [];

const resolveWebOnlyRoute = (pathname: string): boolean =>
  webOnlyPathnames.some(
    (webOnlyPathname) => !!match(webOnlyPathname)(pathname),
  );

// Strip ASCII control characters (except normal whitespace) and enforce a
// reasonable max length so deep-link text params can't inject hidden content.
const sanitizeDeepLinkText = (text: string | null): string | null => {
  if (!text) return text;
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 1024);
};

// Only allow https:// redirect URLs. This prevents dangerous protocol injections
// (javascript:, data:, file:, etc.) but does not restrict to specific domains —
// a domain allowlist would be too restrictive for the Farcaster Connect flow.
const isAllowedRedirectUrl = (url: string): boolean => {
  return isValidHttpsUrl(url.trim());
};

// Validate that a url param is a proper https URL before using it.
export const isValidHttpsUrl = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

type GlobalPromptResult =
  | { key: string; globalPromptData: GlobalPromptData; type: 'prompt' }
  | false;

type MiniAppResult = { type: 'mini_app'; props: MiniAppProps } | false;

type ResolveDeepLinkResult<Name extends ScreenName> =
  | { name: Name; params: FullParamList[Name]; type: 'navigate' | 'push' }
  | GlobalPromptResult
  | MiniAppResult
  | false;

const resolveUniversalFeed = (
  pathname: string,
): ResolveDeepLinkResult<'Feed'> => {
  const result = match('/')(pathname);

  return (
    result && {
      name: 'Feed',
      params: {},
      type: 'navigate',
    }
  );
};

const resolveUniversalChannel = (
  pathname: string,
): ResolveDeepLinkResult<'Channel'> => {
  const result = match<{ channelKey: string }>(
    `${appPathPrefix}/channel/:channelKey`,
  )(pathname);

  return (
    result && {
      name: 'Channel',
      params: { channelKey: result.params.channelKey },
      type: 'navigate',
    }
  );
};

const resolveUniversalChannelTopCasters = (
  pathname: string,
): ResolveDeepLinkResult<'Channel'> => {
  const result = match<{ channelKey: string }>(
    `${appPathPrefix}/channel/:channelKey/top-casters`,
  )(pathname);

  // We no longer have channel top casters so redirect to channel
  return (
    result && {
      name: 'Channel',
      params: { channelKey: result.params.channelKey },
      type: 'navigate',
    }
  );
};

// Obsolete, kept so we can render a nice preview
const resolveUniversalExploreApps = (pathname: string): boolean => {
  const result = match<{ slug: string }>(`${appPathPrefix}/explore/apps/:slug`)(
    pathname,
  );

  return Boolean(result);
};

const resolveUniversalExploreChannels = (
  pathname: string,
): ResolveDeepLinkResult<'Explore'> => {
  const result = match(`${appPathPrefix}/explore/channels`)(pathname);

  return (
    result && {
      name: 'Explore',
      params: {},
      type: 'navigate',
    }
  );
};

const resolveUniversalGroupDirectCastInvite = (
  pathname: string,
): ResolveDeepLinkResult<'DirectCastsGroupInvite'> => {
  const result = match<{ inviteCode: string }>(
    `${appPathPrefix}/group/:inviteCode`,
  )(pathname);
  return (
    result && {
      name: 'DirectCastsGroupInvite',
      params: { inviteCode: result.params.inviteCode },
      type: 'navigate',
    }
  );
};

const resolveUniversalDirectCastConversation = (
  pathname: string,
): ResolveDeepLinkResult<'PlaintextDirectCastsConversation'> => {
  const result = match<{ conversationId: string }>(
    `${appPathPrefix}/inbox/:conversationId`,
  )(pathname);
  return (
    result && {
      name: 'PlaintextDirectCastsConversation',
      params: {
        conversationId: result.params.conversationId,
        create: false,
        intentText: undefined,
      },
      type: 'navigate',
    }
  );
};

const resolveUniversalCompose = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'Feed'> => {
  const result = match(`${appPathPrefix}/compose`)(pathname);

  const textFromParams = sanitizeDeepLinkText(searchParams.get('text'));
  const embedsFromParams = searchParams.getAll('embeds[]');
  const channelKeyFromParams = searchParams.get('channelKey');
  const parentCastHashFromParams = searchParams.get('parentCastHash');

  return (
    result && {
      name: 'Feed',
      params: createFeedParamsWithIntent({
        text: textFromParams,
        embeds: embedsFromParams,
        channelKey: channelKeyFromParams || undefined,
        parentCastHash: parentCastHashFromParams || undefined,
      }),
      type: 'navigate',
    }
  );
};

const resolveUniversalDirectCastsCreate = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'DirectCastsIntent'> => {
  const result = match<{ fid: number }>(`${appPathPrefix}/inbox/create/:fid`)(
    pathname,
  );

  if (!result) {
    return false;
  }

  const fidFromParams = result.params.fid;

  if (typeof fidFromParams === 'undefined' || fidFromParams === null) {
    return false;
  }

  const textFromSearchParams = sanitizeDeepLinkText(searchParams.get('text'));

  return {
    name: 'DirectCastsIntent',
    params: {
      targetFid: fidFromParams,
      intentText: textFromSearchParams || undefined,
    },
    type: 'navigate',
  };
};

const resolveExploreScreen = (
  pathname: string,
  _searchParams: URLSearchParams,
): ResolveDeepLinkResult<'ExploreScreen'> => {
  const result = match(`${appPathPrefix}/explore`)(pathname);

  return (
    result && {
      name: 'ExploreScreen',
      params: {},
      type: 'navigate',
    }
  );
};

const resolveUniversalMint = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'Feed'> => {
  const result = match(`${appPathPrefix}/mint`)(pathname);

  const rawUrl = searchParams.get('url') || undefined;
  const url = rawUrl && isValidHttpsUrl(rawUrl) ? rawUrl : undefined;

  return (
    result && {
      name: 'Feed',
      params: createFeedParamsWithMintPrompt({ url }),
      type: 'navigate',
    }
  );
};

const resolveUniversalProfileWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'DeeplinkOnlyUserV2'> => {
  if (resolveWebOnlyRoute(pathname)) {
    return false;
  }

  // Prevent /magic-link from being matched as a username.
  // IMPORTANT: this guard is also load-bearing for authenticated users — the
  // authed deep-link path calls resolveUniversalLink which eventually reaches
  // here. Without this guard a signed-in user tapping a magic link would land
  // on a "not found" profile page for the username "magic-link".
  if (match('/magic-link')(pathname)) {
    return false;
  }

  const result = match<{ username: string }>('/:username')(pathname);

  return (
    result && {
      name: 'DeeplinkOnlyUserV2',
      params: { username: result.params.username },
      type: 'push',
    }
  );
};

const resolveUniversalProfileWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'UserV2'> => {
  const result = match<{ fid: string }>(`${appPathPrefix}/profiles/:fid`)(
    pathname,
  );

  return (
    result && {
      name: 'UserV2',
      params: { fid: Number(result.params.fid) },
      type: 'push',
    }
  );
};

const resolveUniversalConversationWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'Cast'> => {
  const result = match<{ username: string; castHashPrefix: CastHashPrefix }>(
    '/:username/:castHashPrefix',
  )(pathname);

  if (
    result &&
    result.params.username === possiblyUsernameMatchingAppPathTilde
  ) {
    return false;
  }

  return (
    result && {
      name: 'Cast',
      params: result.params,
      type: 'push',
    }
  );
};

const resolveUniversalConversationWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'Cast'> => {
  const result = match<{ castHash: string }>(
    `${appPathPrefix}/conversations/:castHash`,
  )(pathname);

  return (
    result && {
      name: 'Cast',
      params: result.params,
      type: 'push',
    }
  );
};

const resolveUniversalConversationReactionsWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'CastReactionUsers'> => {
  const result = match<{ username: string; castHashPrefix: CastHashPrefix }>(
    '/:username/:castHashPrefix/reactions',
  )(pathname);

  return (
    result && {
      name: 'CastReactionUsers',
      params: { headerTitle: 'Cast reactions', ...result.params },
      type: 'push',
    }
  );
};

const resolveUniversalConversationReactionsWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'CastReactionUsers'> => {
  const result = match<{ castHash: string }>(
    `${appPathPrefix}/conversations/:castHash/reactions`,
  )(pathname);

  return (
    result && {
      name: 'CastReactionUsers',
      params: { headerTitle: 'Cast reactions', ...result.params },
      type: 'push',
    }
  );
};

const resolveUniversalConversationQuotesWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'CastQuotes'> => {
  const result = match<{ username: string; castHashPrefix: CastHashPrefix }>(
    '/:username/:castHashPrefix/quotes',
  )(pathname);

  return (
    result && {
      name: 'CastQuotes',
      params: { ...result.params },
      type: 'push',
    }
  );
};

const resolveUniversalConversationQuotesWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'CastQuotes'> => {
  const result = match<{ castHash: string }>(
    `${appPathPrefix}/conversations/:castHash/quotes`,
  )(pathname);

  return (
    result && {
      name: 'CastQuotes',
      params: { ...result.params },
      type: 'push',
    }
  );
};

const resolveUniversalConversationRecastsWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'CastRecastUsers'> => {
  const result = match<{ username: string; castHashPrefix: CastHashPrefix }>(
    '/:username/:castHashPrefix/recasts',
  )(pathname);

  return (
    result && {
      name: 'CastRecastUsers',
      params: result.params,
      type: 'push',
    }
  );
};

const resolveUniversalConversationRecastsWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'CastRecastUsers'> => {
  const result = match<{ castHash: string }>(
    `${appPathPrefix}/conversations/:castHash/recasts`,
  )(pathname);

  return (
    result && {
      name: 'CastRecastUsers',
      params: result.params,
      type: 'push',
    }
  );
};

const resolveUniversalFollowersWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'Follows'> => {
  const result = match<{ username: string }>('/:username/followers')(pathname);

  return (
    result && {
      name: 'Follows',
      params: { ...result.params, initialTab: 'followers' },
      type: 'push',
    }
  );
};

const resolveUniversalFollowersWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'Follows'> => {
  const result = match<{ fid: string }>(
    `${appPathPrefix}/profiles/:fid/followers`,
  )(pathname);

  return (
    result && {
      name: 'Follows',
      params: { fid: Number(result.params.fid), initialTab: 'followers' },
      type: 'push',
    }
  );
};

const resolveUniversalFollowingWithUsername = (
  pathname: string,
): ResolveDeepLinkResult<'Follows'> => {
  const result = match<{ username: string }>('/:username/following')(pathname);

  return (
    result && {
      name: 'Follows',
      params: { ...result.params, initialTab: 'following' },
      type: 'push',
    }
  );
};

const resolveUniversalFollowingWithoutUsername = (
  pathname: string,
): ResolveDeepLinkResult<'Follows'> => {
  const result = match<{ fid: string }>(
    `${appPathPrefix}/profiles/:fid/following`,
  )(pathname);

  return (
    result && {
      name: 'Follows',
      params: { fid: Number(result.params.fid), initialTab: 'following' },
      type: 'push',
    }
  );
};

const resolveUniversalNotificationSettings = (
  pathname: string,
): ResolveDeepLinkResult<'NotificationSettings'> => {
  const result = match<{ fid: string }>(
    `${appPathPrefix}/settings/notifications`,
  )(pathname);

  return (
    result && {
      name: 'NotificationSettings',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalStorageSettings = (
  pathname: string,
): ResolveDeepLinkResult<'Storage'> => {
  const result = match(`${appPathPrefix}/settings/storage`)(pathname);

  return (
    result && {
      name: 'Storage',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalPreferredWallet = (
  pathname: string,
): ResolveDeepLinkResult<'PreferredWallet'> => {
  const result = match<{ fid: string }>(
    `${appPathPrefix}/settings/preferred-wallet`,
  )(pathname);

  return (
    result && {
      name: 'PreferredWallet',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalSignInWithFarcaster = (
  pathname: string,
  url: string,
): ResolveDeepLinkResult<'SignInWithFarcaster'> => {
  const result = match(`${appPathPrefix}/sign-in-with-farcaster`)(pathname);

  return (
    result && {
      name: 'SignInWithFarcaster',
      params: {
        signInUri: url,
      },
      type: 'push',
    }
  );
};

const resolveUniversalSignInWithFarcasterV2 = (
  pathname: string,
  url: string,
): ResolveDeepLinkResult<'SignInWithFarcaster'> => {
  const result = match(`${appPathPrefix}/siwf`)(pathname);

  return (
    result && {
      name: 'SignInWithFarcaster',
      params: {
        signInUri: url,
      },
      type: 'push',
    }
  );
};

const resolveUniversalConnectedAddresses = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'ConnectedAccounts'> => {
  const result = match(`${appPathPrefix}/settings/connected-accounts`)(
    pathname,
  );
  const success = searchParams.get('success') ?? undefined;

  return (
    result && {
      name: 'ConnectedAccounts',
      params: {
        success: typeof success !== 'undefined' && success === 'true',
      },
      type: 'push',
    }
  );
};

const resolveUniversalDataUsage = (
  pathname: string,
): ResolveDeepLinkResult<'DataUsage'> => {
  const result = match(`${appPathPrefix}/settings/data-usage`)(pathname);

  return (
    result && {
      name: 'DataUsage',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalSettingsMutedWords = (
  pathname: string,
): ResolveDeepLinkResult<'MutedKeywords'> => {
  const result =
    match(`${appPathPrefix}/settings/muted-keywords`)(pathname) ||
    match(`${appPathPrefix}/settings/muted-words`)(pathname);

  return (
    result && {
      name: 'MutedKeywords',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalSettingsMutesAndBlocks = (
  pathname: string,
): ResolveDeepLinkResult<'MutesAndBlocks'> => {
  const result =
    match(`${appPathPrefix}/settings/muted-accounts`)(pathname) ||
    match(`${appPathPrefix}/settings/mutes-and-blocks`)(pathname);

  return (
    result && {
      name: 'MutesAndBlocks',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalSettingsImport = (
  pathname: string,
): ResolveDeepLinkResult<'ProfilesFromX'> => {
  const result = match(`${appPathPrefix}/settings/import`)(pathname);

  return (
    result && {
      name: 'ProfilesFromX',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalStarterPacks = (
  pathname: string,
): ResolveDeepLinkResult<'StarterPacks'> => {
  const result = match(`${appPathPrefix}/starter-packs`)(pathname);

  return (
    result && {
      name: 'StarterPacks',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalSettingsStarterPacks = (
  pathname: string,
): ResolveDeepLinkResult<'StarterPacks'> => {
  const result = match(`${appPathPrefix}/settings/starter-packs`)(pathname);

  return (
    result && {
      name: 'StarterPacks',
      params: {},
      type: 'push',
    }
  );
};

const resolveDeveloperToolsSettings = (
  pathname: string,
): ResolveDeepLinkResult<'Advanced'> => {
  const result = match(`${appPathPrefix}/settings/developer-tools`)(pathname);
  if (!result) {
    return false;
  }

  return {
    name: 'Advanced',
    params: {
      section: 'developer-mode',
    },
    type: 'push',
  };
};

const resolveUniversalSettingsAdvanced = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'Advanced'> => {
  const result = match<{ section: string | undefined }>(
    `${appPathPrefix}/settings/advanced`,
  )(pathname);

  const sectionFromSearchParams = searchParams.get('section') ?? undefined;

  return (
    result && {
      name: 'Advanced',
      params: {
        section:
          typeof sectionFromSearchParams !== 'undefined'
            ? (sectionFromSearchParams as AdvancedScreenSections)
            : undefined,
      },
      type: 'push',
    }
  );
};

const resolveUniversalWalletOnRamp = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'WalletOnRamp'> => {
  const result = match(`${appPathPrefix}/wallet/onramp`)(pathname);

  if (!result) {
    return false;
  }

  const paymentMethodParam = searchParams.get('paymentMethod') ?? undefined;
  const paymentMethod: ApiPaymentMethod | undefined =
    paymentMethodParam === 'CARD' || paymentMethodParam === 'APPLE_PAY'
      ? paymentMethodParam
      : undefined;

  return {
    name: 'WalletOnRamp',
    params: {
      paymentMethod,
    },
    type: 'push',
  };
};

const resolveUniversalWallet = (
  pathname: string,
): ResolveDeepLinkResult<'Wallet'> => {
  const result = match(`${appPathPrefix}/wallet`)(pathname);

  return (
    result && {
      name: 'Wallet',
      params: {},
      type: 'navigate',
    }
  );
};

const resolveUniversalDepositBonuses = (
  pathname: string,
): ResolveDeepLinkResult<'DepositBonusesIntro'> => {
  const result = match(`${appPathPrefix}/deposit-bonuses`)(pathname);

  return (
    result && {
      name: 'DepositBonusesIntro',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalStarterPack = (
  pathname: string,
): ResolveDeepLinkResult<'StarterPack'> => {
  const result = match<{ id: string }>(`${appPathPrefix}/starter-packs/:id`)(
    pathname,
  );

  return (
    result && {
      name: 'StarterPack',
      params: {
        starterPackId: result.params.id,
      },
      type: 'push',
    }
  );
};

const resolveUniversalUserStarterPack = (
  pathname: string,
): ResolveDeepLinkResult<'StarterPack'> => {
  const result = match<{ id: string }>(`/:username/pack/:id`)(pathname);

  return (
    result && {
      name: 'StarterPack',
      params: {
        starterPackId: result.params.id,
      },
      type: 'push',
    }
  );
};

const resolveUniversalCoin = (
  pathname: string,
): ResolveDeepLinkResult<'Token'> => {
  const result = match<{ pair: string }>(`${appPathPrefix}/c/:pair`)(pathname);

  if (!result) {
    return false;
  }

  const [chain, ca] = result.params.pair.split(':');

  return (
    result && {
      name: 'Token',
      params: {
        chain: chain as ApiChain,
        ca,
        via: 'deeplink',
      },
      type: 'push',
    }
  );
};

const resolveUniversalTokenSearch = (
  pathname: string,
): ResolveDeepLinkResult<'TokenSearch'> => {
  const result = match<{ ticker: string }>(`${appPathPrefix}/token/:ticker`)(
    pathname,
  );

  return (
    result && {
      name: 'TokenSearch',
      params: {
        ticker: result.params.ticker,
      },
      type: 'push',
    }
  );
};

const resolveUniversalContractAddressTransition = (
  pathname: string,
): ResolveDeepLinkResult<'TokenCA'> => {
  const result = match<{ address: string }>(`${appPathPrefix}/ca/:address`)(
    pathname,
  );

  return (
    result && {
      name: 'TokenCA',
      params: {
        ca: result.params.address,
        via: 'deeplink',
      },
      type: 'push',
    }
  );
};

const resolveUniversalLaunchMiniApp = (
  pathname: string,
  searchParams: URLSearchParams,
): MiniAppResult => {
  const result =
    match(`${appPathPrefix}/mini-apps/launch`)(pathname) ||
    match(`${appPathPrefix}/frames/launch`)(pathname) ||
    // path-to-regexp conditional match is not working so we need to match both
    // cases separately
    match<{ id: string; slug: string; rest: string[] }>(
      `/miniapps/:id/:slug/:rest*`,
    )(pathname) ||
    match<{ id: string }>(`/miniapps/:id`)(pathname);

  const url = searchParams.get('url') ?? undefined;
  const domain = (() => {
    if (url) {
      return new URL(url).hostname;
    }

    return searchParams.get('domain') ?? undefined;
  })();

  const id =
    result && result?.params && 'id' in result.params
      ? (result.params.id as string)
      : undefined;

  const queryParams = Object.fromEntries(
    Array.from(searchParams.entries()).filter(
      ([key]) => key !== 'domain' && key !== 'url',
    ),
  );

  const path =
    result && result?.params && 'rest' in result.params
      ? (result.params.rest as string[]).join('/')
      : undefined;

  return (
    result &&
    (!!domain || !!id) && {
      type: 'mini_app',
      props: {
        launchConfig: {
          type: 'manifest',
          id,
          domain,
          url,
          queryParams,
          path,
          timestamp: Date.now(),
        },
        context: {
          type: 'launcher', // TODO custom type here
        },
      },
    }
  );
};

const resolveUniversalDevTools = (
  pathname: string,
): ResolveDeepLinkResult<'DevTools'> => {
  const result = match(`${appPathPrefix}/developers`)(pathname);

  return (
    result && {
      name: 'DevTools',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalDevToolsPreviewMiniAppUrl = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'DevToolsPreviewMiniAppUrl'> => {
  const result =
    match(`${appPathPrefix}/developers/mini-apps/preview`)(pathname) ||
    match(`${appPathPrefix}/developers/mini-apps/embed`)(pathname);

  const url = searchParams.get('url') ?? undefined;

  return (
    result && {
      name: 'DevToolsPreviewMiniAppUrl',
      params: {
        url,
      },
      type: 'push',
    }
  );
};

const resolveUniversalDevToolsRegister = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'DevToolsRegister'> => {
  const result = match(`${appPathPrefix}/developers/register`)(pathname);
  const domain = searchParams.get('domain') ?? undefined;
  const fid = searchParams.get('fid') ?? undefined;
  return (
    result && {
      name: 'DevToolsRegister',
      params: {
        domain,
        fid,
      },
      type: 'push',
    }
  );
};

const resolveUniversalOnboardingXConnected = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'Onboarding'> => {
  const result = match(`${appPathPrefix}/onboarding/connected-x`)(pathname);
  const error = searchParams.get('error') ?? undefined;

  return (
    result && {
      name: 'Onboarding',
      params: {
        error: error as OnboardingParams['error'],
      },
      type: 'push',
    }
  );
};

const resolveUniversalDevToolsDomains = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'DevToolsDomains'> => {
  const result = match(`${appPathPrefix}/developers/domains`)(pathname);
  const domain = searchParams.get('domain') ?? undefined;

  return (
    result && {
      name: 'DevToolsDomains',
      params: {
        domain,
      },
      type: 'push',
    }
  );
};

const resolveUniversalBookmarks = (
  pathname: string,
): ResolveDeepLinkResult<'Bookmarks'> => {
  const result = match(`${appPathPrefix}/bookmarks`)(pathname);

  return (
    result && {
      name: 'Bookmarks',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalJoinChannel = (
  pathname: string,
  searchParams: URLSearchParams,
): GlobalPromptResult => {
  const result = match<{ channelKey: string }>(
    `${appPathPrefix}/channel/:channelKey/join`,
  )(pathname);
  const inviteCode = searchParams.get('inviteCode') ?? 'invalid';

  return (
    result && {
      key: joinChannelViaInviteCodePrompt,
      globalPromptData: {
        joinChannelViaInviteCode: {
          channelKey: result.params.channelKey,
          inviteCode,
        },
      },
      type: 'prompt',
    }
  );
};

const resolveReferralsCodeJoinDeprecated = (
  pathname: string,
): ResolveDeepLinkResult<'ReferralsJoin'> => {
  const result = match<{ referralCode: string }>(
    `${appPathPrefix}/referralCode/:referralCode`,
  )(pathname);

  return (
    result && {
      name: 'ReferralsJoin',
      params: { referralCode: result.params.referralCode },
      type: 'push',
    }
  );
};

const resolveReferralsCodeJoin = (
  pathname: string,
): ResolveDeepLinkResult<'ReferralsJoin'> => {
  const result = match<{ referralCode: string }>(
    `${appPathPrefix}/referral-code/:referralCode`,
  )(pathname);

  return (
    result && {
      name: 'ReferralsJoin',
      params: { referralCode: result.params.referralCode },
      type: 'push',
    }
  );
};

const resolveVanityReferralsCodeJoin = (
  pathname: string,
): ResolveDeepLinkResult<'VanityReferralsJoin'> => {
  const result = match<{ username: string }>(
    `${appPathPrefix}/r/:username/join`,
  )(pathname);

  return (
    result && {
      name: 'VanityReferralsJoin',
      params: { username: result.params.username },
      type: 'push',
    }
  );
};

// No longer used, but keeping for backwards compatibility
const resolveReferralsCodeLandingPageDeprecated = (
  pathname: string,
): ResolveDeepLinkResult<'ReferralsJoin'> => {
  const result = match<{ referralCode: string }>(`/referralCode/:referralCode`)(
    pathname,
  );

  return (
    result && {
      name: 'ReferralsJoin',
      params: { referralCode: result.params.referralCode },
      type: 'push',
    }
  );
};

// This works around Android's inability to handle the /referralCode/:referralCode path
const resolveReferralsCodeLandingPage = (
  pathname: string,
): ResolveDeepLinkResult<'ReferralsJoin'> => {
  const result = match<{ referralCode: string }>(
    `${appPathPrefix}/code/:referralCode`,
  )(pathname);

  return (
    result && {
      name: 'ReferralsJoin',
      params: { referralCode: result.params.referralCode },
      type: 'push',
    }
  );
};

const resolveVanityReferralsCodeLandingPage = (
  pathname: string,
): ResolveDeepLinkResult<'VanityReferralsJoin'> => {
  const result = match<{ username: string }>(`${appPathPrefix}/r/:username`)(
    pathname,
  );

  return (
    result && {
      name: 'VanityReferralsJoin',
      params: { username: result.params.username },
      type: 'push',
    }
  );
};

const resolveXpOverview = (
  pathname: string,
): ResolveDeepLinkResult<'ReferralsOverview'> => {
  const result = match<{ referralCode: string }>(`${appPathPrefix}/referrals`)(
    pathname,
  );

  return (
    result && {
      name: 'ReferralsOverview',
      params: {},
      type: 'push',
    }
  );
};

const resolveReferralsList = (
  pathname: string,
): ResolveDeepLinkResult<'ReferralsList'> => {
  const result = match<{ referralCode: string }>(
    `${appPathPrefix}/referrals/list`,
  )(pathname);

  return (
    result && {
      name: 'ReferralsList',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalProUpsell = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'FarcasterProUpsell'> => {
  const result = match<{ pair: string }>(`${appPathPrefix}/pro-upsell`)(
    pathname,
  );
  const ref = searchParams.get('ref') ?? undefined;

  if (!result || typeof ref === 'undefined') {
    return false;
  }

  return (
    result && {
      name: 'FarcasterProUpsell',
      params: {
        source: ref,
      },
      type: 'push',
    }
  );
};

const resolveUniversalProUpsellV2 = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'FarcasterProUpsell'> => {
  const result = match<{ pair: string }>(`${appPathPrefix}/pro`)(pathname);
  const ref = searchParams.get('ref') ?? undefined;

  if (!result || typeof ref === 'undefined') {
    return false;
  }

  return (
    result && {
      name: 'FarcasterProUpsell',
      params: {
        source: ref,
      },
      type: 'push',
    }
  );
};

const resolveUniversalCoinbaseCommerceCallback = (
  pathname: string,
  url: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'CoinbaseCommerceCallback'> => {
  const result = match(`${appPathPrefix}/coinbase-commerce-callback`)(pathname);

  // Capture all query parameters
  const queryParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  return (
    result && {
      name: 'CoinbaseCommerceCallback',
      params: {
        callbackUrl: url,
        queryParams,
      },
      type: 'navigate',
    }
  );
};

const resolveUniversalNews = (
  pathname: string,
): ResolveDeepLinkResult<'News'> => {
  const result = match(`${appPathPrefix}/news`)(pathname);

  return (
    result && {
      name: 'News',
      params: {},
      type: 'push',
    }
  );
};

const resolveUnviersalArticle = (
  pathname: string,
): ResolveDeepLinkResult<'Article'> => {
  const result = match<{ publicId: string }>(`${appPathPrefix}/news/:publicId`)(
    pathname,
  );

  return (
    result && {
      name: 'Article',
      params: {
        publicId: result.params.publicId,
        source: 'universal-link',
      },
      type: 'push',
    }
  );
};

const resolveUniversalSpaces = (
  pathname: string,
): ResolveDeepLinkResult<'Spaces' | 'SpaceRoom'> => {
  const withRoom = match<{ roomId: string }>(`${appPathPrefix}/spaces/:roomId`)(
    pathname,
  );
  if (withRoom) {
    return {
      name: 'SpaceRoom',
      params: { roomId: withRoom.params.roomId },
      type: 'push',
    };
  }
  const withoutRoom = match(`${appPathPrefix}/spaces`)(pathname);
  return (
    withoutRoom && {
      name: 'Spaces',
      params: {},
      type: 'push',
    }
  );
};

const resolveUniversalLink = ({
  url,
  pathname,
  searchParams,
}: {
  url: string;
  pathname: string;
  searchParams: URLSearchParams;
}) => {
  return (
    // Mini Apps resolver has to go before username resolver
    // because we don't want the /miniapps path to be matched as a username.
    resolveUniversalLaunchMiniApp(pathname, searchParams) ||
    resolveReferralsCodeLandingPage(pathname) ||
    resolveReferralsCodeLandingPageDeprecated(pathname) ||
    resolveUniversalFeed(pathname) ||
    resolveUniversalSignInWithFarcaster(pathname, url) ||
    resolveUniversalSignInWithFarcasterV2(pathname, url) ||
    resolveUniversalChannel(pathname) ||
    resolveUniversalChannelTopCasters(pathname) ||
    resolveUniversalExploreChannels(pathname) ||
    resolveExploreScreen(pathname, searchParams) ||
    resolveUniversalCompose(pathname, searchParams) ||
    resolveUniversalDirectCastsCreate(pathname, searchParams) ||
    resolveUniversalGroupDirectCastInvite(pathname) ||
    resolveUniversalDirectCastConversation(pathname) ||
    resolveUniversalMint(pathname, searchParams) ||
    resolveUniversalFollowersWithUsername(pathname) ||
    resolveUniversalFollowersWithoutUsername(pathname) ||
    resolveUniversalFollowingWithUsername(pathname) ||
    resolveUniversalFollowingWithoutUsername(pathname) ||
    resolveUniversalProfileWithUsername(pathname) ||
    resolveUniversalProfileWithoutUsername(pathname) ||
    resolveUniversalConversationWithUsername(pathname) ||
    resolveUniversalConversationWithoutUsername(pathname) ||
    resolveUniversalConversationReactionsWithUsername(pathname) ||
    resolveUniversalConversationReactionsWithoutUsername(pathname) ||
    resolveUniversalConversationRecastsWithUsername(pathname) ||
    resolveUniversalConversationRecastsWithoutUsername(pathname) ||
    resolveUniversalConversationQuotesWithUsername(pathname) ||
    resolveUniversalConversationQuotesWithoutUsername(pathname) ||
    resolveUniversalNotificationSettings(pathname) ||
    resolveUniversalStorageSettings(pathname) ||
    resolveUniversalPreferredWallet(pathname) ||
    resolveUniversalBookmarks(pathname) ||
    resolveUniversalJoinChannel(pathname, searchParams) ||
    resolveUniversalConnectedAddresses(pathname, searchParams) ||
    resolveUniversalDataUsage(pathname) ||
    resolveUniversalDevTools(pathname) ||
    resolveUniversalDevToolsPreviewMiniAppUrl(pathname, searchParams) ||
    resolveUniversalDevToolsDomains(pathname, searchParams) ||
    resolveUniversalSettingsMutedWords(pathname) ||
    resolveUniversalSettingsMutesAndBlocks(pathname) ||
    resolveUniversalStarterPacks(pathname) ||
    resolveUniversalSettingsStarterPacks(pathname) ||
    resolveUniversalStarterPack(pathname) ||
    resolveUniversalUserStarterPack(pathname) ||
    resolveUniversalCoin(pathname) ||
    resolveUniversalTokenSearch(pathname) ||
    resolveUniversalContractAddressTransition(pathname) ||
    resolveDeveloperToolsSettings(pathname) ||
    resolveUniversalSettingsAdvanced(pathname, searchParams) ||
    resolveUniversalWalletOnRamp(pathname, searchParams) ||
    resolveUniversalWallet(pathname) ||
    resolveUniversalDepositBonuses(pathname) ||
    resolveReferralsCodeJoin(pathname) ||
    resolveVanityReferralsCodeJoin(pathname) ||
    resolveReferralsCodeJoinDeprecated(pathname) ||
    resolveVanityReferralsCodeLandingPage(pathname) ||
    resolveUniversalDevToolsRegister(pathname, searchParams) ||
    resolveUniversalOnboardingXConnected(pathname, searchParams) ||
    resolveFarcasterConnect(pathname, searchParams) ||
    resolveOpenOnMobile(pathname, searchParams) ||
    resolveUniversalSettingsImport(pathname) ||
    resolveUniversalProUpsell(pathname, searchParams) ||
    resolveUniversalProUpsellV2(pathname, searchParams) ||
    resolveXpOverview(pathname) ||
    resolveUniversalCoinbaseCommerceCallback(pathname, url, searchParams) ||
    resolveUniversalNews(pathname) ||
    resolveUnviersalArticle(pathname) ||
    resolveReferralsList(pathname) ||
    resolveUniversalSpaces(pathname)
  );
};

const resolveUniversalStartRecovery = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'RecoveryStart'> => {
  const result = match('/start-recovery')(pathname);
  const rawToken = searchParams.get('token');
  const rawEmail = searchParams.get('email');

  // Validate token: alphanumeric/hyphen/underscore, 8-256 chars
  const tokenFromParams =
    rawToken && /^[a-zA-Z0-9_-]{8,256}$/.test(rawToken) ? rawToken : undefined;
  // Reuse the shared email validator for consistency with UI validation
  const emailFromParams =
    rawEmail && isEmailValid(rawEmail) ? rawEmail : undefined;

  return (
    result && {
      name: 'RecoveryStart',
      params: {
        token: tokenFromParams,
        email: emailFromParams,
      },
      type: 'navigate',
    }
  );
};

const resolveUniversalRecovery = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'RecoveryNotFound'> => {
  const result = match('/recovery')(pathname);
  const rawEmail = searchParams.get('email');
  // Reuse the shared email validator for consistency with UI validation
  const emailFromParams =
    rawEmail && isEmailValid(rawEmail) ? rawEmail : undefined;

  // If the app is in recovery mode, this navigation event will be a no-op.
  // Otherwise there is no pending recovery on this device.
  return (
    result && {
      name: 'RecoveryNotFound',
      params: {
        email: emailFromParams,
      },
      type: 'navigate',
    }
  );
};

const resolveUniversalRecoveryInitiate = (
  pathname: string,
): ResolveDeepLinkResult<'RecoveryInitiate'> => {
  const result = match(`${appPathPrefix}/recovery-init`)(pathname);

  // If the app is in recovery mode, this navigation event will be a no-op.
  // Otherwise there is no pending recovery on this device.
  return (
    result && {
      name: 'RecoveryInitiate',
      params: {},
      type: 'navigate',
    }
  );
};

const resolveMagicLinkSignIn = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'MagicLinkSignIn'> => {
  const result = match('/magic-link')(pathname);
  const rawToken = searchParams.get('token');
  const rawAddress = searchParams.get('address');

  // Validate token: the backend emits a 0x-prefixed hex token
  // (bytesToHex(randomBytes(32)) via viem), so it is always 0x + 64 hex chars.
  const token =
    rawToken && /^0x[0-9a-fA-F]{64}$/.test(rawToken) ? rawToken : undefined;
  // Validate address: 0x-prefixed hex, 40 chars
  const address =
    rawAddress && /^0x[0-9a-fA-F]{40}$/.test(rawAddress)
      ? rawAddress
      : undefined;

  if (!result || !token || !address) {
    return false;
  }

  return {
    name: 'MagicLinkSignIn',
    params: { token, address },
    type: 'navigate',
  };
};

const resolveFarcasterConnect = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<'SignedKeyRequest'> => {
  const result = match(`${appPathPrefix}/connect`)(pathname);
  const token = searchParams.get('token') ?? '';
  const rawRedirectUrl = searchParams.get('redirectUrl') ?? undefined;
  const trimmedRedirectUrl = rawRedirectUrl?.trim();
  const redirectUrl =
    trimmedRedirectUrl && isAllowedRedirectUrl(trimmedRedirectUrl)
      ? trimmedRedirectUrl
      : undefined;

  return (
    result && {
      name: 'SignedKeyRequest',
      params: {
        token,
        redirectUrl,
      },
      type: 'push',
    }
  );
};

const resolveOpenOnMobile = (
  pathname: string,
  searchParams: URLSearchParams,
): ResolveDeepLinkResult<
  'OnboardingSignInAnotherDevice' | 'WalletSignInAnotherDevice'
> => {
  const result = match(`${appPathPrefix}/mobile`)(pathname);
  const path = searchParams.get('path');

  const channelIdFromOpenOnMobileParams = () => {
    const u = new URL('https://farcaster.xyz/~/mobile');
    u.search = searchParams.toString();
    return getLoginChannelIdFromUrl(u);
  };

  if (path === 'login-web') {
    const channelId = channelIdFromOpenOnMobileParams();

    return (
      result && {
        name: 'OnboardingSignInAnotherDevice',
        params: {
          channelId,
          type: 'web',
        },
        type: 'push',
      }
    );
  } else if (path === 'login-mobile') {
    const channelId = channelIdFromOpenOnMobileParams();

    return (
      result && {
        name: 'OnboardingSignInAnotherDevice',
        params: {
          channelId,
          type: 'mobile',
        },
        type: 'push',
      }
    );
  } else if (path === 'login-wallet') {
    const channelId = channelIdFromOpenOnMobileParams();
    const rawNonce = searchParams.get('nonce');
    const rawExpiresAt = searchParams.get('expires-at');

    // Validate nonce: alphanumeric, 8-128 chars
    const nonce =
      rawNonce && /^[a-zA-Z0-9_-]{8,128}$/.test(rawNonce) ? rawNonce : null;
    // Validate expiresAt: ISO 8601 date string
    const expiresAt =
      rawExpiresAt && !isNaN(Date.parse(rawExpiresAt)) ? rawExpiresAt : null;

    return (
      result && {
        name: 'WalletSignInAnotherDevice',
        params: {
          channelId,
          nonce,
          expiresAt,
        },
        type: 'push',
      }
    );
  }

  return false;
};

const resolveExternalUrl = (pathname: string): boolean => {
  const inviteResult = match(`${appPathPrefix}/invite-page/:fid`)(pathname);
  const joinResult = match(`${appPathPrefix}/join`)(pathname);

  return !!(inviteResult || joinResult);
};

const resolveUnauthedUniversalLink = ({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: URLSearchParams;
}) => {
  return (
    resolveMagicLinkSignIn(pathname, searchParams) ||
    resolveOpenOnMobile(pathname, searchParams) ||
    resolveUniversalStartRecovery(pathname, searchParams) ||
    resolveUniversalRecovery(pathname, searchParams) ||
    resolveUniversalRecoveryInitiate(pathname)
  );
};

export {
  resolveExternalUrl,
  resolveUnauthedUniversalLink,
  resolveUniversalExploreApps,
  resolveUniversalLink,
  resolveWebOnlyRoute,
};
