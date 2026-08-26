import React from 'react';
import { View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { getMinutesSecondsFromMilliseconds } from '~/utils/ImageUtils';

const PlaybackTime = ({
  currentPosition,
  currentDuration,
  size = 'xs',
}: {
  currentPosition: number;
  currentDuration: number;
  size?: 'xs' | 'sm' | 'xl';
}) => {
  const t = useTheme();

  let timestamp = '0:00';
  const current = getMinutesSecondsFromMilliseconds(currentPosition);
  const duration = getMinutesSecondsFromMilliseconds(currentDuration);
  if (duration === '0:00') {
    timestamp = current;
  } else {
    timestamp = `${current} / ${duration}`;
  }

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.directCasts.bgImagePreview,
        { borderRadius: 6 },
        t.pX2,
        t.h6,
      ]}
    >
      <Text2 size={size} weight="semibold" color="light">
        {timestamp}
      </Text2>
    </View>
  );
};

PlaybackTime.displayName = 'PlaybackTime';

export { PlaybackTime };
