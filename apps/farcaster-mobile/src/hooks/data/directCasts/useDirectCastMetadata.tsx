import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import { useV3DirectCastCheckmarks } from './useDirectCastCheckmarks';
import { useV3DirectCastFormattedTimestamp } from './useDirectCastFormattedTimestamp';

const useV3DirectCastMetadata = ({
  selfDirectCast,
  timestamp,
  conversationMuted,
  conversationOtherPartyLastReadTime,
  directCastIsPinned,
  wrappingContainerHasBRSpace,
  applyImageDirectCastStyles = false,
  applyMutedStyles = false,
}: {
  selfDirectCast: boolean;
  timestamp: number;
  directCastIsPinned: boolean;
  conversationMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  wrappingContainerHasBRSpace: boolean;
  applyImageDirectCastStyles?: boolean;
  applyMutedStyles?: boolean;
}) => {
  const t = useTheme();

  const formattedTimestamp = useV3DirectCastFormattedTimestamp({
    selfDirectCast,
    timestamp,
    hasUnread: false,
    applyInboxStyles: false,
    applyImageDirectCastStyles: applyImageDirectCastStyles,
    applyMutedStyles: applyMutedStyles,
    muted: conversationMuted,
  });

  const checkmarks = useV3DirectCastCheckmarks({
    selfDirectCast,
    timestamp,
    conversationOtherPartyLastReadTime,
    applyInboxStyles: false,
    applyImageDirectCastStyles: applyImageDirectCastStyles,
    applyMutedStyles: applyMutedStyles,
  });

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.mT1,
        t.itemsCenter,
        t.selfEnd,
        wrappingContainerHasBRSpace && [{ marginTop: -12, marginLeft: 4 }],
      ]}
    >
      {directCastIsPinned && (
        <Octicons
          name="pin"
          size={10}
          style={[
            t.mR2,
            !applyImageDirectCastStyles
              ? selfDirectCast
                ? applyMutedStyles
                  ? t.directCasts.textTimestamp
                  : t.directCasts.textSelfTimestamp
                : t.directCasts.textTimestamp
              : [t.texts.light],
            { transform: [{ rotate: '90deg' }] },
          ]}
        />
      )}
      <View style={[{ marginRight: 2 }]}>{formattedTimestamp}</View>
      {checkmarks}
    </View>
  );
};

export { useV3DirectCastMetadata };
