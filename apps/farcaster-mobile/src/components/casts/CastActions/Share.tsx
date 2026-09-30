import { AnalyticsEvent } from 'farcaster-analytics';
import { usePrefetchShareCast, useTrackEvent } from 'farcaster-client-hooks';
import React, { memo, MutableRefObject, useCallback, useRef } from 'react';
import { InteractionManager, Pressable } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { shareCastPromptKey } from '~/constants/Storage';
import { useCastToTakeAction } from '~/contexts/CastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

import { CastActionsBarProps } from './types';

const hitSlopValues = {
  left: 11,
  top: 11,
  right: 11,
  bottom: 11,
};

const ShareIcon = memo(() => {
  const t = useTheme();

  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        stroke={t.colors.text.tertiary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.667 8v5.333A1.333 1.333 0 0 0 4 14.667h8a1.333 1.333 0 0 0 1.333-1.334V8M10.667 4 8 1.333 5.333 4M8 1.333V10"
      />
    </Svg>
  );
});

const Share = memo(
  ({
    castRef,
    onBeforeAction,
  }: {
    castRef: MutableRefObject<CastActionsBarProps['cast']>;
    onBeforeAction?: () => void;
  }) => {
    const t = useTheme();
    const { showGlobalPrompt } = useGlobalPrompts();
    const { setCastToTakeAction } = useCastToTakeAction();
    const { trackEvent } = useTrackEvent();
    const prefetchShareCast = usePrefetchShareCast();
    const openingRef = useRef(false);

    const onPressIn = useCallback(() => {
      if (openingRef.current) return;

      const cast = castRef.current;
      if (!cast) return;

      const castHash = cast.hash;
      const castAuthor = cast.author.username || cast.author.displayName;

      openingRef.current = true;

      onBeforeAction?.();

      setTimeout(() => {
        try {
          showGlobalPrompt({ key: shareCastPromptKey });

          setTimeout(() => {
            try {
              setCastToTakeAction({
                cast: {
                  ...cast,
                  reason: undefined,
                },
              });

              prefetchShareCast({ castHash });

              InteractionManager.runAfterInteractions(() => {
                trackEvent(AnalyticsEvent.ShareCast, {
                  cast_author: castAuthor,
                });
              });
            } catch (error) {
              trackError(error, {
                context: 'Share.onPressIn.setCastToTakeAction',
                castHash,
              });
            } finally {
              openingRef.current = false;
            }
          }, 0);
        } catch (error) {
          trackError(error, {
            context: 'Share.onPressIn.showGlobalPrompt',
            castHash,
          });
          openingRef.current = false;
        }
      }, 0);
    }, [
      castRef,
      onBeforeAction,
      prefetchShareCast,
      setCastToTakeAction,
      showGlobalPrompt,
      trackEvent,
    ]);

    return (
      <Pressable
        style={[t.flexRow, t.itemsCenter]}
        hitSlop={hitSlopValues}
        onPressIn={onPressIn}
      >
        <ShareIcon />
      </Pressable>
    );
  },
);

Share.displayName = 'Share';

export { Share };
