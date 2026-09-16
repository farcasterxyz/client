import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChannelMention,
  ApiTokenLinkCore,
  ApiUser,
} from 'farcaster-client-data';
import { useFetchContractAddress } from 'farcaster-client-hooks';
import React, { FC, ReactNode, useCallback, useMemo } from 'react';
import { matchPath, PathMatch } from 'react-router-dom';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { LinkToChannelWithSummaryTooltip } from '~/components/links/LinkToChannelWithSummaryTooltip';
import { LinkToProfileCastsWithUsername } from '~/components/links/LinkToProfileCastsWithUsername';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { routes } from '~/constants/routes';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useLinkify } from '~/contexts/LinkifyProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import {
  BASE_CHAIN_URI_PREFIX,
  channelLinkPrefix,
  ETH_CHAIN_URI_PREFIX,
  OP_CHAIN_URI_PREFIX,
  userLinkPrefix,
  ZORA_CHAIN_URI_PREFIX,
} from '~/utils/linkify/linkifyUtils';
import {
  removeCustomRuleTokens,
  swapLinksWithCustomRuleTokens,
} from '~/utils/linkify/rules';
import { truncateMiddle, truncateURLForFeeds } from '~/utils/stringUtils';

interface LinkifiedTextProps {
  content: string;
  mentions: ApiUser[] | string[] | undefined;
  channelMentions: ApiChannelMention[] | string[] | undefined;
  tokenMentions: string[] | undefined;
  tokenMentionsV2: ApiTokenLinkCore[] | undefined;
  mentionsWithDetailsPopover?: boolean;
  linkClassNameOverrides?: string;
  skipURLTruncates?: boolean;
  ignoreMentionsArray?: boolean;
  castAuthorFid?: number;
}

const LinkifiedText: FC<LinkifiedTextProps> = ({
  content,
  mentions,
  channelMentions,
  tokenMentionsV2,
  mentionsWithDetailsPopover = true,
  linkClassNameOverrides = false,
  skipURLTruncates = false,
  ignoreMentionsArray = false,
  castAuthorFid,
}) => {
  const { trackEvent } = useAnalytics();

  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  const { defaultLinkifyInstance } = useLinkify();

  const fetchContractAddress = useFetchContractAddress();

  const navigate = useNavigate();

  const prepareBodyForCustomRuleTokens = useCallback((body: string) => {
    return swapLinksWithCustomRuleTokens(body);
  }, []);

  // Sanitize body for display, clearing potentially injected tokens
  const sanitizedBodyText = useCallback((text: string) => {
    return removeCustomRuleTokens(text);
  }, []);

  return useMemo(() => {
    const bodyWithLinks = [] as ReactNode[];
    const preparedBody = prepareBodyForCustomRuleTokens(content.trim());

    const mentionsSet = new Set(
      mentions?.map((mention) =>
        typeof mention === 'string' ? mention : mention.username,
      ),
    );
    const channelKeysToNames = (channelMentions || []).reduce(
      (acc, channel) => {
        const key = typeof channel === 'string' ? channel : channel.key;
        // Empty = no name
        const name = typeof channel === 'string' ? '' : channel.name;
        acc[key] = name;
        return acc;
      },
      {} as Record<string, string>,
    );

    let cursor = 0;
    (defaultLinkifyInstance.match(preparedBody) || []).forEach(
      (match, index) => {
        if (match.index !== cursor) {
          const text = sanitizedBodyText(
            preparedBody.substring(cursor, match.index),
          );
          bodyWithLinks.push(text);
        }

        let resolvedTokenLinkFromMatchedUrl: PathMatch<'ticker'> | null = null;
        try {
          resolvedTokenLinkFromMatchedUrl = matchPath(
            routes.token.path,
            new URL(match.url).pathname,
          );
        } catch {}

        let resolvedCALinkFromMatchedUrl: PathMatch<'address'> | null = null;
        try {
          resolvedCALinkFromMatchedUrl = matchPath(
            routes.ca.path,
            new URL(match.url).pathname,
          );
        } catch {}

        let link: ReactNode;
        // FYI — Order of these matter!
        // If an earlier match occurs it will try to render that instead.
        if (match.url.startsWith(userLinkPrefix)) {
          const username = match.url
            .substring(userLinkPrefix.length)
            .toLowerCase();

          if (mentionsSet.has(username) || ignoreMentionsArray) {
            if (mentionsWithDetailsPopover) {
              link = (
                <LinkToProfileWithSummaryTooltip
                  key={`link-${index}`}
                  className={cn(
                    'relative hover:underline',
                    linkClassNameOverrides,
                  )}
                  title={`@${username}`}
                  user={{ username, fid: 0 }}
                >
                  {sanitizedBodyText(match.text)}
                </LinkToProfileWithSummaryTooltip>
              );
            } else {
              link = (
                <LinkToProfileCastsWithUsername
                  key={`link-${index}`}
                  params={{ username }}
                  className={cn(
                    'relative hover:underline',
                    linkClassNameOverrides,
                  )}
                  title={`@${username}`}
                >
                  {sanitizedBodyText(match.text)}
                </LinkToProfileCastsWithUsername>
              );
            }
          } else {
            link = match.text;
          }
        } else if (match.url.startsWith(channelLinkPrefix)) {
          const channelKey = match.url
            .substring(channelLinkPrefix.length)
            .toLowerCase();

          const channelName = channelKeysToNames[channelKey];
          if (channelName !== undefined) {
            link = (
              <LinkToChannelWithSummaryTooltip
                key={`link-${index}`}
                channelKey={channelKey}
                className={cn(
                  'relative hover:underline',
                  linkClassNameOverrides,
                )}
                title={channelName ? `${channelName}` : `/${channelKey}`}
              >
                {sanitizedBodyText(match.text)}
              </LinkToChannelWithSummaryTooltip>
            );
          } else {
            link = match.text;
          }
        } else if (
          match.url.startsWith('farcaster://') ||
          match.url.startsWith(ETH_CHAIN_URI_PREFIX) ||
          match.url.startsWith(BASE_CHAIN_URI_PREFIX) ||
          match.url.startsWith(ZORA_CHAIN_URI_PREFIX) ||
          match.url.startsWith(OP_CHAIN_URI_PREFIX)
        ) {
          link = (
            <ExternalLink
              key={`link-${index}`}
              href={match.url}
              title={`Link to ${match.url}`}
              className={cn(
                'relative inline cursor-pointer text-link hover:underline',
                linkClassNameOverrides,
              )}
            >
              {truncateMiddle(match.url)}
            </ExternalLink>
          );
        } else if (
          typeof resolvedTokenLinkFromMatchedUrl !== 'undefined' &&
          resolvedTokenLinkFromMatchedUrl !== null &&
          typeof resolvedTokenLinkFromMatchedUrl.params.ticker !== 'undefined'
        ) {
          const ticker = resolvedTokenLinkFromMatchedUrl.params.ticker;

          if (
            typeof tokenMentionsV2 !== 'undefined' &&
            tokenMentionsV2
              .map((tm) => `$${tm.ticker.toLowerCase()}`)
              .indexOf(match.text.toLowerCase()) !== -1
          ) {
            const token = tokenMentionsV2.find(
              (tm) =>
                `$${tm.ticker.toLowerCase()}` === match.text.toLowerCase(),
            );

            if (token && typeof navigateInWallet !== 'undefined') {
              link = (
                <div
                  key={`link-${index}`}
                  title={match.text}
                  className={cn(
                    'relative inline cursor-pointer text-link hover:underline',
                    linkClassNameOverrides,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();

                    trackEvent(AnalyticsEvent.ClickTokenEmbedLink, {
                      chain: token.chain,
                      ca: token.ca,
                    });
                    navigateInWallet({
                      path: 'Token',
                      params: {
                        ca: token.ca,
                        chain: token.chain,
                        via: 'cast_ticker',
                      },
                    });
                  }}
                >
                  {match.text}
                </div>
              );
            }
          } else {
            link = (
              <Link
                key={`link-${index}`}
                to="token"
                params={{ ticker }}
                searchParams={
                  castAuthorFid !== undefined
                    ? { from: castAuthorFid.toString() }
                    : {}
                }
                title={match.text}
                className={cn(
                  'relative inline cursor-pointer text-link hover:underline',
                  linkClassNameOverrides,
                )}
                onClick={() => {
                  trackEvent(AnalyticsEvent.ClickTokenLink, { ticker });
                }}
              >
                {match.text}
              </Link>
            );
          }
        } else if (
          typeof resolvedCALinkFromMatchedUrl !== 'undefined' &&
          resolvedCALinkFromMatchedUrl !== null &&
          typeof resolvedCALinkFromMatchedUrl.params.address !== 'undefined'
        ) {
          const address = resolvedCALinkFromMatchedUrl.params.address;

          if (typeof navigateInWallet !== 'undefined') {
            link = (
              <div
                key={`link-${index}`}
                title={match.text}
                className={cn(
                  'relative inline cursor-pointer text-link hover:underline',
                  linkClassNameOverrides,
                )}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  trackEvent(AnalyticsEvent.ClickCALink, { address });

                  navigateInWallet({
                    path: 'TokenCA',
                    params: {
                      ca: address,
                      via: 'cast_ca',
                    },
                  });
                }}
              >
                {match.text}
              </div>
            );
          } else {
            link = (
              <div
                key={`link-${index}`}
                title={match.text}
                className={cn(
                  'relative inline cursor-pointer text-link hover:underline',
                  linkClassNameOverrides,
                )}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  trackEvent(AnalyticsEvent.ClickCALink, { address });

                  const data = await fetchContractAddress({ ca: address });

                  if (typeof data.token !== 'undefined') {
                    navigate({
                      to: 'token',
                      params: { ticker: data.token.ticker },
                    });
                  } else {
                    navigate({ to: 'ca', params: { address } });
                  }
                }}
              >
                {match.text}
              </div>
            );
          }
        } else {
          // At this point we should not have any custom rule artifacts on matches unless its a sub match on a link hence
          // we will make sure to remove those here. (goksu)
          const sanitizedMatchUrl = removeCustomRuleTokens(match.url);
          const urlFromCastBody = sanitizedBodyText(match.text);

          const linkText = skipURLTruncates
            ? urlFromCastBody
            : truncateURLForFeeds({ url: urlFromCastBody });

          link = (
            <ExternalLink
              key={`link-${index}`}
              href={sanitizedMatchUrl}
              title={match.text}
              className={cn(
                'relative inline cursor-pointer text-link hover:underline',
                linkClassNameOverrides,
              )}
            >
              {linkText}
            </ExternalLink>
          );
        }

        bodyWithLinks.push(link);
        cursor = match.lastIndex;
      },
    );

    if (cursor <= preparedBody.length - 1) {
      const text = sanitizedBodyText(preparedBody.substring(cursor));
      bodyWithLinks.push(text);
    }

    return <>{bodyWithLinks}</>;
  }, [
    castAuthorFid,
    channelMentions,
    content,
    defaultLinkifyInstance,
    fetchContractAddress,
    linkClassNameOverrides,
    mentions,
    mentionsWithDetailsPopover,
    navigate,
    navigateInWallet,
    prepareBodyForCustomRuleTokens,
    sanitizedBodyText,
    skipURLTruncates,
    tokenMentionsV2,
    trackEvent,
    ignoreMentionsArray,
  ]);
};

export { LinkifiedText };
