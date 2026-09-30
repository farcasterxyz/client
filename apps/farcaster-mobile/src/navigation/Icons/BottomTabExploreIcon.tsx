import { useTheme } from 'farcaster-expo';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

export function Default() {
  const t = useTheme();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const { value: tradeIdeasEnabled } = checkUserAppContextGate('trade-ideas');

  if (!tradeIdeasEnabled) {
    return (
      <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <Path
          d="M19 27C23.4183 27 27 23.4183 27 19C27 14.5817 23.4183 11 19 11C14.5817 11 11 14.5817 11 19C11 23.4183 14.5817 27 19 27Z"
          stroke={t.colors.text.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M29 29L24.7 24.7"
          stroke={t.colors.text.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 11C20.6667 13.6667 22 15.8333 24 17.5C26 19.1667 27 21 27 23C27 24.8565 26.2625 26.637 24.9497 27.9497C23.637 29.2625 21.8565 30 20 30C18.1435 30 16.363 29.2625 15.0503 27.9497C13.7375 26.637 13 24.8565 13 23C13 21.9181 13.3509 20.8655 14 20C14 20.663 14.2634 21.2989 14.7322 21.7678C15.2011 22.2366 15.837 22.5 16.5 22.5C17.163 22.5 17.7989 22.2366 18.2678 21.7678C18.7366 21.2989 19 20.663 19 20C19 18 17.5 17 17.5 15C17.5 13.6667 18.3333 12.3333 20 11Z"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Selected() {
  const t = useTheme();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const { value: tradeIdeasEnabled } = checkUserAppContextGate('trade-ideas');

  if (!tradeIdeasEnabled) {
    return (
      <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <Path
          d="M19 27C23.4183 27 27 23.4183 27 19C27 14.5817 23.4183 11 19 11C14.5817 11 11 14.5817 11 19C11 23.4183 14.5817 27 19 27Z"
          stroke={t.colors.text.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M29 29L24.7 24.7"
          stroke={t.colors.text.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 11C20.6667 13.6667 22 15.8333 24 17.5C26 19.1667 27 21 27 23C27 24.8565 26.2625 26.637 24.9497 27.9497C23.637 29.2625 21.8565 30 20 30C18.1435 30 16.363 29.2625 15.0503 27.9497C13.7375 26.637 13 24.8565 13 23C13 21.9181 13.3509 20.8655 14 20C14 20.663 14.2634 21.2989 14.7322 21.7678C15.2011 22.2366 15.837 22.5 16.5 22.5C17.163 22.5 17.7989 22.2366 18.2678 21.7678C18.7366 21.2989 19 20.663 19 20C19 18 17.5 17 17.5 15C17.5 13.6667 18.3333 12.3333 20 11Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
