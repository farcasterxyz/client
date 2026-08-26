import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

import { Collect } from './Collect';
import { Likes } from './Likes';
import { Recasts } from './Recasts';
import { Replies } from './Replies';
import { Share } from './Share';
import { CastActionsBarProps } from './types';

const hitSlop = {
  top: sizes.s2,
  bottom: sizes.s2,
};

const CastActionsBar = ({
  cast,
  likeCount,
  replyCount,
  recastCount,
  hideCounts,
  includeReason,
  isFocusedCast,
  partOfTheDisabledThread,
  onBeforeAction,
}: CastActionsBarProps) => {
  const t = useTheme();

  const stylePressable = useMemo(
    () => [
      t.flex1,
      t.flexRow,
      t.itemsCenter,
      t.justifyBetween,
      [t.h5],
      partOfTheDisabledThread && t.opacity25,
      isFocusedCast && t.mB3,
    ],
    [
      isFocusedCast,
      partOfTheDisabledThread,
      t.flex1,
      t.flexRow,
      t.h5,
      t.itemsCenter,
      t.justifyBetween,
      t.mB3,
      t.opacity25,
    ],
  );

  const { checkUserAppContextGate } = useUserAppContextGate();

  const showCollectible =
    !!cast.collectible && checkUserAppContextGate('collectibles').value;

  // use a ref here to keep the action icon components from re-rendering
  // for the most part, they only need to read cast info from onPress handlers
  const castRef = useRef(cast);
  useEffect(() => {
    castRef.current = cast;
  }, [cast]);

  return (
    <View
      style={stylePressable}
      hitSlop={hitSlop}
      pointerEvents={partOfTheDisabledThread ? 'none' : 'box-none'}
    >
      <Replies
        cast={cast}
        count={replyCount}
        hideCounts={hideCounts}
        includeReason={includeReason}
      />
      <Recasts
        castRef={castRef}
        // be explicit about which state we're passing down
        // so all actions don't re-render when one changes
        recasted={cast.viewerContext?.recast || false}
        count={recastCount}
        hideCounts={hideCounts}
        includeReason={includeReason}
        onBeforeAction={onBeforeAction}
      />
      <Likes
        castRef={castRef}
        castText={cast.text}
        reacted={cast.viewerContext?.reacted || false}
        count={likeCount}
        hideCounts={hideCounts}
        includeReason={includeReason}
      />
      {showCollectible && (
        <Collect
          cast={cast}
          hideCounts={hideCounts}
          includeReason={includeReason}
        />
      )}
      {!isFocusedCast && <View style={{ width: cast.collectible ? 12 : 55 }} />}
      {/* ExternalCastActions removed */}
      <Share castRef={castRef} onBeforeAction={onBeforeAction} />
    </View>
  );
};

CastActionsBar.displayName = 'CastActionsBar';

export { CastActionsBar };
