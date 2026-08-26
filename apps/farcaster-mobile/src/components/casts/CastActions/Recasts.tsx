import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  resolveUsername,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { memo, MutableRefObject, useCallback, useMemo } from 'react';
import { Alert, Pressable } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Text2 } from '~/components/Text';
import { castQuotePromptKey } from '~/constants/Storage';
import { useCastToTakeAction } from '~/contexts/CastToTakeActionProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';

import { CastActionsBarProps } from './types';

const hitSlopValues = {
  left: 15,
  top: 11,
  right: 6,
  bottom: 11,
};

type RecastIconProps = {
  active: boolean;
  size?: number;
  color?: string;
};

const RecastIcon = memo(
  ({ active, size: baseSize, color: baseColor }: RecastIconProps) => {
    const t = useTheme();
    const size = baseSize ?? 16;
    const color =
      baseColor ?? (active ? t.colors.actionGreen : t.colors.text.tertiary);
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          fill={color}
          d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.003 7.003 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834h-.001ZM8 2.5a5.487 5.487 0 0 0-4.131 1.87l1.204 1.203A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 1 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"
        />
      </Svg>
    );
  },
);

const Recasts = memo(
  ({
    castRef,
    recasted,
    count,
    hideCounts = false,
    includeReason,
    onBeforeAction,
  }: {
    castRef: MutableRefObject<CastActionsBarProps['cast']>;
    recasted: boolean;
    count: number;
    hideCounts?: boolean;
    includeReason?: ApiCastFeedIncludeReason;
    onBeforeAction?: () => void;
  }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const { showGlobalPrompt } = useGlobalPrompts();
    const openComposer = useOpenComposer();

    const { setCastToTakeAction } = useCastToTakeAction();

    const onCastRecastLongPress = useCallback(() => {
      trackEvent(AnalyticsEvent.LongPressRecast, undefined);

      openComposer(
        createCastParamsWithIntent({
          embeds: [castRef.current.hash],
          includeReason: includeReason?.type,
        }),
      );
    }, [trackEvent, castRef, includeReason?.type, openComposer]);

    const onCastRecastPress = useCallback(() => {
      onBeforeAction?.();
      if (castRef.current.author.viewerContext?.blockedBy) {
        Alert.alert(
          'Unable to quote or recast',
          `${resolveUsername({
            username: castRef.current.author.username,
            fid: castRef.current.author.fid,
          })} has blocked you. You cannot quote or recast their casts.`,
        );

        return;
      }
      setCastToTakeAction({
        cast: {
          ...castRef.current,
          reason: includeReason,
        },
      });

      showGlobalPrompt({ key: castQuotePromptKey });
    }, [
      castRef,
      includeReason,
      onBeforeAction,
      setCastToTakeAction,
      showGlobalPrompt,
    ]);

    const styleContainer = useMemo(
      () => [t.flexRow, t.itemsCenter],
      [t.flexRow, t.itemsCenter],
    );

    const textStyles = useMemo(
      () => ({
        marginLeft: 4,
        color: recasted ? t.colors.text.success : t.colors.text.tertiary,
        width: 35,
      }),
      [recasted, t.colors.text.success, t.colors.text.tertiary],
    );

    return (
      <Pressable
        hitSlop={hitSlopValues}
        onPress={onCastRecastPress}
        onLongPress={onCastRecastLongPress}
        style={styleContainer}
      >
        <RecastIcon active={recasted} />
        {!hideCounts && (
          <Text2 style={textStyles} color="tertiary" size="sm">
            {count > 0 && formatShorthandNumber(count)}
          </Text2>
        )}
      </Pressable>
    );
  },
);

Recasts.displayName = 'Recasts';

export { RecastIcon, Recasts };
