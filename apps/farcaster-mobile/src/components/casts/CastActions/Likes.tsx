import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  CastReactionType,
  formatShorthandNumber,
  getLikeIconType,
  UpdateCastLikeError,
  useCreateCastLike,
  useDeleteCastLike,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import React, {
  memo,
  MutableRefObject,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Pressable } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { useToast } from 'react-native-toast-notifications';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { trackError } from '~/utils/ErrorUtils';

import { getThemedLikeIconColor, ThemedLikeIcon } from './ThemedLikeIcon';
import { CastActionsBarProps } from './types';

const hitSlopValues = {
  left: 15,
  top: 11,
  right: 6,
  bottom: 11,
};

type HeartIconProps = {
  active: boolean;
  size?: number;
  color?: string;
};

const HeartIcon = memo(
  ({ active, size: baseSize, color: baseColor }: HeartIconProps) => {
    const t = useTheme();
    const size = baseSize ?? 16;

    if (active) {
      const color = baseColor ?? '#D51338';
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <Path
            fill={color}
            d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.064 22.064 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.044 5.231-3.886 6.818a22.089 22.089 0 0 1-3.433 2.414c-.102.06-.205.116-.31.17l-.018.01-.008.004a.75.75 0 0 1-.69 0Z"
          />
        </Svg>
      );
    }

    const color = baseColor ?? t.colors.text.tertiary;
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          fill={color}
          d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.163 7.163 0 0 1-.31-.17 22.059 22.059 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.063 22.063 0 0 1-3.744 2.584l-.018.01-.006.003h-.002L8 14.25ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.581 20.581 0 0 0 8 13.393a20.582 20.582 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"
        />
      </Svg>
    );
  },
);

const Likes = memo(
  ({
    castRef,
    castText,
    reacted,
    count,
    hideCounts = false,
    includeReason,
  }: {
    castRef: MutableRefObject<CastActionsBarProps['cast']>;
    castText: string;
    reacted: boolean;
    count: number;
    hideCounts?: boolean;
    includeReason?: ApiCastFeedIncludeReason;
  }) => {
    const t = useTheme();
    const trackCastReaction = useTrackCastReaction();
    const toast = useToast();
    const { triggerImpactAsync } = useHaptics();
    const includeReasonType = includeReason?.type;

    const createCastLike = useCreateCastLike();
    const deleteCastLike = useDeleteCastLike();

    const isSubmitting = useRef(false);
    const effectiveLikeIconType = useMemo(
      () => getLikeIconType(castText),
      [castText],
    );
    const activeColor = useMemo(
      () =>
        getThemedLikeIconColor({
          iconType: effectiveLikeIconType,
          dark: t.dark,
          heliotrope: t.colors.heliotrope,
          minsk: t.colors.minsk,
        }),
      [effectiveLikeIconType, t.colors.heliotrope, t.colors.minsk, t.dark],
    );

    const stylePressable = useMemo(
      () => [t.flexRow, t.itemsCenter],
      [t.flexRow, t.itemsCenter],
    );

    const onPress = useCallback(async () => {
      if (isSubmitting.current) {
        return;
      }
      isSubmitting.current = true;

      if (!reacted) {
        triggerImpactAsync();
      }

      trackCastReaction({
        castHash: castRef.current.hash,
        type: CastReactionType.Like,
        undo: !!reacted,
        castFid: castRef.current.author.fid,
        ...(includeReasonType ? { includeReason: includeReasonType } : {}),
      });

      try {
        if (reacted) {
          try {
            await deleteCastLike({ cast: castRef.current });
          } catch (error) {
            toast.show('Failed to unlike the cast.', {
              type: 'danger',
            });
            trackError(
              new UpdateCastLikeError({
                error,
                castHash: castRef.current.hash,
              }),
            );
          }
        } else {
          try {
            await createCastLike({ cast: castRef.current });
          } catch (error) {
            toast.show('Failed to like the cast.', {
              type: 'danger',
            });
            trackError(
              new UpdateCastLikeError({
                error,
                castHash: castRef.current.hash,
              }),
            );
          }
        }
      } finally {
        isSubmitting.current = false;
      }
    }, [
      castRef,
      createCastLike,
      deleteCastLike,
      includeReasonType,
      reacted,
      toast,
      trackCastReaction,
      triggerImpactAsync,
    ]);

    const textStyles = useMemo(
      () => ({
        marginLeft: 4,
        color: reacted ? activeColor : t.colors.text.tertiary,
        width: 35,
      }),
      [activeColor, reacted, t.colors.text.tertiary],
    );

    return (
      <Pressable
        // NEYN-11640: selector for the Maestro `like-first-cast` flow. The
        // heart/like control is icon-only and renders once per cast row, so
        // the E2E flow uses `id: cast-like-button, index: 0` to target the
        // first visible like control.
        testID="cast-like-button"
        hitSlop={hitSlopValues}
        style={stylePressable}
        onPress={onPress}
      >
        {effectiveLikeIconType === 'default' ? (
          <HeartIcon active={reacted} />
        ) : (
          <ThemedLikeIcon
            active={reacted}
            color={reacted ? activeColor : t.colors.text.tertiary}
            iconType={effectiveLikeIconType}
          />
        )}
        {!hideCounts && (
          <Text2 style={textStyles} color="tertiary" size="sm">
            {count > 0 && formatShorthandNumber(count)}
          </Text2>
        )}
      </Pressable>
    );
  },
);

Likes.displayName = 'Likes';

export { HeartIcon, Likes };
