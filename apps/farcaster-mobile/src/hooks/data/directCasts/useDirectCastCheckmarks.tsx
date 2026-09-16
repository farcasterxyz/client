import React, { useMemo } from 'react';
import { ColorValue, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

type InboxCheckmarksProps = {
  checkmarkType: 'read' | 'delivered';
  fill: ColorValue;
};

const InboxCheckmarks: React.FC<InboxCheckmarksProps> = React.memo(
  ({ checkmarkType, fill }) => {
    if (checkmarkType === 'delivered') {
      return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.8047 3.52861C14.0651 3.78896 14.0651 4.21107 13.8047 4.47141L6.4714 11.8047C6.21106 12.0651 5.78894 12.0651 5.5286 11.8047L2.19526 8.47141C1.93491 8.21107 1.93491 7.78896 2.19526 7.52861C2.45561 7.26826 2.87772 7.26826 3.13807 7.52861L6 10.3905L12.8619 3.52861C13.1223 3.26826 13.5444 3.26826 13.8047 3.52861Z"
            fill={fill}
          />
        </Svg>
      );
    }

    return (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path
          d="M17 6L6 17L1 12"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={fill}
        />
        <Path
          d="M23 7L12.5 17.5L11 16"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={fill}
        />
      </Svg>
    );
  },
);

const useV3DirectCastCheckmarks = ({
  selfDirectCast,
  timestamp,
  conversationOtherPartyLastReadTime,
  applyInboxStyles,
  applyImageDirectCastStyles = false,
  applyMutedStyles = false,
}: {
  selfDirectCast: boolean;
  timestamp: number | undefined;
  conversationOtherPartyLastReadTime: number;
  applyInboxStyles: boolean;
  applyImageDirectCastStyles?: boolean;
  applyMutedStyles?: boolean;
}) => {
  const t = useTheme();

  return useMemo(() => {
    if (typeof timestamp === 'undefined') {
      return null;
    }

    const otherPartyRead = conversationOtherPartyLastReadTime >= timestamp;

    const fill = !applyImageDirectCastStyles
      ? applyInboxStyles
        ? t.colors.text.tertiary
        : applyMutedStyles
          ? t.colors.text.secondary
          : t.dark
            ? '#BAB5E1'
            : '#7C65C1'
      : '#FFF';

    if (!selfDirectCast) {
      return null;
    }

    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.relative,
          t.itemsCenter,
          t.justifyCenter,
          otherPartyRead ? { paddingLeft: 2 } : undefined,
        ]}
      >
        <InboxCheckmarks
          checkmarkType={otherPartyRead ? 'read' : 'delivered'}
          fill={fill}
        />
      </View>
    );
  }, [
    timestamp,
    conversationOtherPartyLastReadTime,
    applyImageDirectCastStyles,
    applyInboxStyles,
    t.colors.text.tertiary,
    t.colors.text.secondary,
    t.dark,
    t.flex,
    t.flexRow,
    t.relative,
    t.itemsCenter,
    t.justifyCenter,
    applyMutedStyles,
    selfDirectCast,
  ]);
};

export { useV3DirectCastCheckmarks };
