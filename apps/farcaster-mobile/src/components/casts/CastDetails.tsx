import { getLocales } from 'expo-localization';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCastClient,
  ApiCastFeedIncludeReason,
  formatWholeDollars,
} from 'farcaster-client-data';
import {
  formatShorthandNumber,
  formatViewCount,
  resolveUsernameShort,
} from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

const [{ languageTag = 'en-US' } = { languageTag: 'en-US' }] = getLocales();

const castDetailItemHitSlop = { top: 8, bottom: 10, left: 8, right: 8 };

interface CastDetailsProps {
  fid: number;
  hash: string;
  isFocusedCast: boolean;
  replyCount: number;
  reactionCount: number;
  recastCount: number;
  bookmarkCount: number;
  quoteCount: number;
  warpsTipped: number;
  viewCount?: number;
  topBidValue?: number;
  finalBid?: boolean;
  includeReason?: ApiCastFeedIncludeReason;
  client?: ApiCastClient;
  timestamp: number;
}

type CastDetailItem =
  | {
      type: 'client';
      timestamp: number;
      client: ApiCastClient;
    }
  | {
      type: 'standard';
      count: string;
      label: string;
      onPress: (() => void) | undefined;
    };

const CastDetails: FC<CastDetailsProps> = ({
  isFocusedCast,
  hash: castHash,
  replyCount,
  reactionCount,
  recastCount,
  quoteCount,
  topBidValue,
  finalBid,
  warpsTipped,
  viewCount,
  client,
  timestamp,
}) => {
  const t = useTheme();

  const push = usePush();

  const castDetailItems: CastDetailItem[] = useMemo(() => {
    const items: CastDetailItem[] = [];

    if (!isFocusedCast && replyCount !== 0) {
      items.push({
        type: 'standard',
        count: formatShorthandNumber(replyCount),
        label: replyCount === 1 ? 'reply' : 'replies',
        onPress: undefined,
      });
    }

    if (!isFocusedCast) {
      if (reactionCount !== 0) {
        items.push({
          type: 'standard',
          count: formatShorthandNumber(reactionCount),
          label: reactionCount === 1 ? 'like' : 'likes',
          onPress: undefined,
        });
      }
    } else {
      if (recastCount !== 0) {
        items.push({
          type: 'standard',
          count: formatShorthandNumber(recastCount),
          label: recastCount === 1 ? 'recast' : 'recasts',
          onPress: () => {
            push('CastRecastUsers', { castHash });
          },
        });
      }

      if (quoteCount !== 0) {
        items.push({
          type: 'standard',
          count: formatShorthandNumber(quoteCount),
          label: quoteCount === 1 ? 'quote' : 'quotes',
          onPress: () => {
            push('CastQuotes', { castHash });
          },
        });
      }

      if (reactionCount !== 0) {
        items.push({
          type: 'standard',
          count: formatShorthandNumber(reactionCount),
          label: reactionCount === 1 ? 'like' : 'likes',
          onPress: () => {
            push('CastReactionUsers', { headerTitle: 'Liked by', castHash });
          },
        });
      }

      if (topBidValue) {
        items.push({
          type: 'standard',
          count: formatWholeDollars(topBidValue),
          label: finalBid ? 'final bid' : 'bid',
          onPress: () => {
            push('CollectibleCast', {
              castHash,
            });
          },
        });
      }

      if (warpsTipped !== 0) {
        items.push({
          type: 'standard',
          count: formatShorthandNumber(warpsTipped),
          label: warpsTipped === 1 ? 'warp' : 'warps',
          onPress: undefined,
        });
      }

      if (typeof viewCount !== 'undefined' && viewCount !== 0) {
        items.push({
          type: 'standard',
          count: formatViewCount(viewCount),
          label: 'views',
          onPress: undefined,
        });
      }
    }

    return items;
  }, [
    castHash,
    finalBid,
    isFocusedCast,
    push,
    quoteCount,
    reactionCount,
    recastCount,
    replyCount,
    topBidValue,
    viewCount,
    warpsTipped,
  ]);

  const dot = useMemo(() => {
    if (castDetailItems.length !== 0) {
      return (
        <View style={t.mX1}>
          <Text2 size="sm" color="secondary">
            ·
          </Text2>
        </View>
      );
    }
  }, [castDetailItems.length, t.mX1]);

  const styleItemsContainer = useMemo(
    () => [t.flexRow, t.flexWrap, t.itemsCenter, t.wFull, t.pT2],
    [t.flexRow, t.flexWrap, t.itemsCenter, t.pT2, t.wFull],
  );

  const renderItem = useCallback(
    (item: CastDetailItem, index: number) => {
      const d =
        castDetailItems.length !== 1 &&
        castDetailItems.length - 1 !== index &&
        dot;

      switch (item.type) {
        case 'standard':
          return (
            <CastDetailsItem
              key={index}
              count={item.count}
              label={item.label}
              onPress={item.onPress}
              isFocusedCast={isFocusedCast}
              dot={d}
            />
          );
      }
    },
    [castDetailItems.length, dot, isFocusedCast],
  );

  if (isFocusedCast) {
    return (
      <View style={[t.flexCol, t.flex]}>
        <CastSentFrom client={client} timestamp={timestamp} />
        <View style={styleItemsContainer}>
          {castDetailItems.map(renderItem)}
        </View>
      </View>
    );
  }

  return null;
};
CastDetails.displayName = 'CastDetails';

const CastDetailsItem = memo(
  ({
    count,
    label,
    onPress,
    dot,
  }: {
    count: string;
    label: string;
    onPress: (() => void) | undefined;
    isFocusedCast: boolean;
    dot?: ReactNode;
  }) => {
    const t = useTheme();
    const styleContainer = useMemo(() => [t.flexRow], [t.flexRow]);

    return (
      <View style={styleContainer}>
        {typeof onPress === 'undefined' ? (
          <View style={[t.flexRow]}>
            <Text2 color="secondary" weight="medium" size="sm">
              {count}{' '}
            </Text2>
            <Text2 color="secondary" size="sm">
              {label}
            </Text2>
          </View>
        ) : (
          <TouchableOpacity
            hitSlop={castDetailItemHitSlop}
            style={[t.flexRow]}
            onPress={onPress}
            activeOpacity={0.75}
          >
            <Text2 color="secondary" weight="medium" size="sm">
              {count}{' '}
            </Text2>
            <Text2 color="secondary" size="sm">
              {label}
            </Text2>
          </TouchableOpacity>
        )}
        {dot}
      </View>
    );
  },
);

CastDetailsItem.displayName = 'CastDetailsItem';

function cleanDateTimeString({
  dateTimeString,
}: {
  dateTimeString: string;
}): string {
  // Remove seconds from time (e.g., "3:45:12 PM" → "3:45 PM")
  let formattedDateTime = dateTimeString.replace(
    /(\d{1,2}:\d{2}):\d{2}(\s?[AP]M)/i,
    '$1$2',
  );

  // Replace "/2025" at end with "/25"
  formattedDateTime = formattedDateTime.replace(/\/2025$/, '/25');

  return formattedDateTime;
}

function CastSentFrom({
  timestamp,
  client,
}: {
  timestamp: number;
  client: ApiCastClient | undefined;
}) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const styleContainer = useMemo(() => [t.flexRow], [t.flexRow]);

  const pushToUserProfile = usePushToUserProfile();

  const onPress = React.useCallback(() => {
    if (typeof client === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.PressSentFromClient, {
      clientFid: client.fid,
    });

    pushToUserProfile({ fid: client.fid });
  }, [client, pushToUserProfile, trackEvent]);

  const niceCastTimestamp = React.useMemo(() => {
    const raw = `${new Date(timestamp).toLocaleTimeString(languageTag)} · ${new Date(timestamp).toLocaleDateString(languageTag)}`;
    const cleaned = cleanDateTimeString({ dateTimeString: raw });
    return cleaned;
  }, [timestamp]);

  return (
    <View style={styleContainer}>
      <Text2 color="tertiary" size="sm">
        {niceCastTimestamp}
      </Text2>
      {typeof client !== 'undefined' && (
        <>
          <Text2 size="sm" color="tertiary">
            {' '}
            · Sent from{' '}
          </Text2>
          <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
            <Text2 color="tertiary" size="sm" weight="medium">
              {resolveUsernameShort({
                username: client.username,
                fid: client.fid,
              })}
            </Text2>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

export { CastDetails };
