import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLinkCore } from 'farcaster-client-data';
import {
  getCloudflareImageUrl,
  renderChannelKey,
  useTelemetry,
} from 'farcaster-client-hooks';
import {
  BASE_CHAIN_URI_PREFIX,
  ETH_CHAIN_URI_PREFIX,
  OP_CHAIN_URI_PREFIX,
  ZORA_CHAIN_URI_PREFIX,
} from 'farcaster-expo';
import React, { ReactNode, useMemo } from 'react';
import { Dimensions, Linking, TextStyle } from 'react-native';

import { TextWithPress } from '~/components/TextWithPress';
import {
  castLinkPrefix,
  channelLinkPrefix,
  userLinkPrefix,
} from '~/constants/Link';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useBrowserPreference } from '~/contexts/BrowserPreferenceProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { UpdatedTokenLink } from '~/screens/Tokens/UpdatedTokenLink';
import { getCachedResult, setCachedResult } from '~/utils/LinkifyResultCache';
import { getLinkify, LinkifyInstanceType } from '~/utils/LinkifyUtils';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import {
  hasImageExtension,
  truncateMiddle,
  truncateURLForFeeds,
} from '~/utils/UrlUtils';

import { usePush } from './navigation/usePush';
import { usePushToUserProfileWithUsername } from './navigation/usePushToUserProfile';
const windowWidth = Dimensions.get('window').width;

type UseLinkifyTextReturnValue = {
  linkifiedText: ReactNode;
  hasOnlyImages: boolean;
  imageUrls: string[];
};

interface LinkifyTextOptions {
  skipFarcasterLinkTruncate: boolean;
  applyInvertedLinkStyles: TextStyle[];
  skipURLTruncates: boolean;
  treatImageUrlsAsLinks?: boolean;
  linkifyInstance?: LinkifyInstanceType;
  // Whether to allow the raw text to be changed (for better rendering) vs only
  // adding decorations (colors, etc, for composing mode). The reason we need this
  // is that when composing, any extra characters we add to the tree go back to the composed text
  textChangeAllowed?: boolean;
  navMethod?: 'push' | 'navigate';
  onNavigate?: () => void;
  telemetryContext?: Record<string, unknown>;
  cacheKey?: string;
  ignoreUserMentionsSet?: boolean;
}

const useLinkifyText = ({
  text,
  mentions,
  channelMentions,
  tokenMentionsV2,
  castAuthorFid,
  options,
}: {
  text: string;
  mentions: string[] | undefined;
  channelMentions?: string[] | undefined;
  tokenMentions?: string[] | undefined;
  tokenMentionsV2?: ApiTokenLinkCore[] | undefined;
  castAuthorFid?: number;
  options?: Partial<LinkifyTextOptions>;
}): UseLinkifyTextReturnValue => {
  const t = useTheme();
  const push = usePush();
  const pushToUserProfileWithUsername = usePushToUserProfileWithUsername();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();
  const { browserPreference } = useBrowserPreference();
  const telemetry = useTelemetry();
  const { trackEvent } = useAnalytics();

  const userMentionsSet = React.useMemo(() => {
    return new Set(mentions);
  }, [mentions]);

  const channelMentionsSet = React.useMemo(() => {
    return new Set(channelMentions);
  }, [channelMentions]);

  return useMemo(() => {
    const linkifiedText = [] as ReactNode[];
    const imageUrls = [] as string[];
    const untransformedImageUrls = [] as string[];

    const preparedContent = text;

    const effectiveCacheKey = options?.cacheKey
      ? `${options.cacheKey}|tm:${t.scheme}|bp:${browserPreference}`
      : undefined;

    if (effectiveCacheKey) {
      const cached = getCachedResult(effectiveCacheKey);
      if (cached) {
        return cached;
      }
    }

    const linkStyles =
      options &&
      options.applyInvertedLinkStyles &&
      options.applyInvertedLinkStyles.length !== 0
        ? options.applyInvertedLinkStyles
        : [t.texts.brand];

    let cursor = 0;

    const l =
      options && options.linkifyInstance
        ? options.linkifyInstance
        : getLinkify();

    // Moving the start time to be focused on when linkify matching occurs
    // instead of getting the instance. First hit on instances are always heavier.
    const startTime = Date.now();

    (l.match(preparedContent) || []).forEach((match, i) => {
      if (match.index !== cursor) {
        const text = preparedContent.substring(cursor, match.index);

        linkifiedText.push(text);
      }

      let link: ReactNode;
      if (match.url.startsWith(userLinkPrefix)) {
        const username = match.url
          .substring(userLinkPrefix.length)
          .toLowerCase();

        if (
          username &&
          ((typeof options !== 'undefined' && options.ignoreUserMentionsSet) ||
            userMentionsSet.has(username))
        ) {
          link = (
            <TextWithPress
              key={`link-${i}`}
              style={linkStyles}
              onPress={() => {
                options?.onNavigate?.();
                pushToUserProfileWithUsername({ username });
              }}
            >
              {match.text}
            </TextWithPress>
          );
        } else {
          link = match.text;
        }
      } else if (match.url.startsWith(channelLinkPrefix)) {
        const channelKey = match.url
          .substring(channelLinkPrefix.length)
          .toLowerCase();

        if (channelKey && channelMentionsSet.has(channelKey)) {
          link = (
            <TextWithPress
              key={`link-${i}`}
              style={linkStyles}
              onPress={() => {
                options?.onNavigate?.();
                push('Channel', { channelKey: channelKey });
              }}
            >
              {options?.textChangeAllowed === false
                ? match.text
                : renderChannelKey(match.text.slice(1))}
            </TextWithPress>
          );
        } else {
          link = match.text;
        }
      } else if (
        match.url.startsWith(castLinkPrefix) ||
        match.url.startsWith(ETH_CHAIN_URI_PREFIX) ||
        match.url.startsWith(BASE_CHAIN_URI_PREFIX) ||
        match.url.startsWith(ZORA_CHAIN_URI_PREFIX) ||
        match.url.startsWith(OP_CHAIN_URI_PREFIX)
      ) {
        const sanitizedMatchUrl = match.url;
        const sanitizedText = match.text;
        const textContent =
          options && options.skipFarcasterLinkTruncate
            ? sanitizedText
            : truncateMiddle(sanitizedText);

        link = (
          <TextWithPress
            key={`link-${i}`}
            style={linkStyles}
            onPress={() => {
              Linking.openURL(sanitizedMatchUrl);
            }}
          >
            {textContent}
          </TextWithPress>
        );
      } else if (
        (match.url.startsWith('https://farcaster.xyz/~/') ||
          match.url.startsWith('https://warpcast.com/~/')) &&
        match.url.indexOf('/~/token/') !== -1
      ) {
        const sanitizedMatchUrl = match.url;

        if (
          typeof tokenMentionsV2 !== 'undefined' &&
          tokenMentionsV2
            .map((tm) => `$${tm.ticker.toLowerCase()}`)
            .indexOf(match.text.toLowerCase()) !== -1
        ) {
          const token = tokenMentionsV2.find(
            (tm) => `$${tm.ticker.toLowerCase()}` === match.text.toLowerCase(),
          );

          if (token) {
            link = (
              <UpdatedTokenLink
                key={`link-${i}`}
                token={token}
                style={linkStyles}
                castAuthorFid={castAuthorFid}
              />
            );
          } else {
            link = (
              <TextWithPress
                key={`link-${i}`}
                style={linkStyles}
                onPress={() => {
                  trackEvent(AnalyticsEvent.ClickTokenLink, {
                    url: sanitizedMatchUrl,
                  });

                  push('WalletExplore', { prefilledQuery: match.text });
                }}
              >
                {match.text}
              </TextWithPress>
            );
          }
        } else {
          link = (
            <TextWithPress
              key={`link-${i}`}
              style={linkStyles}
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickTokenLink, {
                  url: sanitizedMatchUrl,
                });

                push('WalletExplore', {
                  prefilledQuery: match.text,
                });
              }}
            >
              {match.text}
            </TextWithPress>
          );
        }
      } else if (
        (match.url.startsWith('https://farcaster.xyz/~/') ||
          match.url.startsWith('https://warpcast.com/~/')) &&
        match.url.indexOf('/~/ca/') !== -1
      ) {
        const sanitizedMatchUrl = match.url;
        link = (
          <TextWithPress
            key={`link-${i}`}
            style={linkStyles}
            onPress={() => {
              trackEvent(AnalyticsEvent.ClickTokenLink, {
                url: sanitizedMatchUrl,
              });

              push('TokenCA', { ca: match.text, via: 'cast_ca' });
            }}
          >
            {match.text}
          </TextWithPress>
        );
      } else {
        const sanitizedMatchUrl = match.url;
        const urlFromCastBody = match.text;
        const textContent =
          options && options.skipURLTruncates
            ? urlFromCastBody
            : truncateURLForFeeds({ url: urlFromCastBody });

        link = (
          <TextWithPress
            key={`link-${i}`}
            style={linkStyles}
            onPress={() => {
              options?.onNavigate?.();
              possiblyNavigateOrOpenUrl({
                url: sanitizedMatchUrl,
                navMethod: options?.navMethod,
              });
            }}
          >
            {textContent}
          </TextWithPress>
        );
      }

      if (hasImageExtension(match.url) && !options?.treatImageUrlsAsLinks) {
        untransformedImageUrls.push(match.url);
        imageUrls.push(
          getCloudflareImageUrl({ url: match.url, windowWidth: windowWidth }),
        );
      } else {
        linkifiedText.push(link);
      }

      cursor = match.lastIndex;
    });

    if (cursor <= preparedContent.length - 1) {
      linkifiedText.push(preparedContent.substring(cursor));
    }

    const hasOnlyImages =
      untransformedImageUrls
        .reduce((memo, imageUrl) => {
          return memo.replace(imageUrl, '');
        }, preparedContent)
        .trim() === '';

    telemetry.maybeAddFrameDroppingAction(
      'farcaster-mobile.useLinkifyText',
      Date.now() - startTime,
      {
        ...(options?.telemetryContext || {}),
      },
    );

    const result = { linkifiedText: linkifiedText, hasOnlyImages, imageUrls };

    if (effectiveCacheKey) {
      setCachedResult(effectiveCacheKey, result);
    }

    return result;
  }, [
    browserPreference,
    castAuthorFid,
    channelMentionsSet,
    options,
    possiblyNavigateOrOpenUrl,
    push,
    pushToUserProfileWithUsername,
    t.scheme,
    t.texts.brand,
    telemetry,
    text,
    tokenMentionsV2,
    trackEvent,
    userMentionsSet,
  ]);
};

export { useLinkifyText };
