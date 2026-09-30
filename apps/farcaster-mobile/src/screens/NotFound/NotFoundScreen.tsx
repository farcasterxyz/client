import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo } from 'react';
import { View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type NotFoundScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'NotFound'
>;

const NotFoundIcon = memo(() => {
  const t = useTheme();

  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Path
        d="M25 3.33398H9.99996C9.1159 3.33398 8.26806 3.68517 7.64294 4.31029C7.01782 4.93542 6.66663 5.78326 6.66663 6.66732V33.334C6.66663 34.218 7.01782 35.0659 7.64294 35.691C8.26806 36.3161 9.1159 36.6673 9.99996 36.6673H30C30.884 36.6673 31.7319 36.3161 32.357 35.691C32.9821 35.0659 33.3333 34.218 33.3333 33.334V11.6673L25 3.33398Z"
        stroke={t.colors.text.tertiary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23.3334 3.33398V10.0007C23.3334 10.8847 23.6846 11.7326 24.3097 12.3577C24.9348 12.9828 25.7827 13.334 26.6667 13.334H33.3334"
        stroke={t.colors.text.tertiary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24.1667 20.834L15.8334 29.1673"
        stroke={t.colors.text.tertiary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.8334 20.834L24.1667 29.1673"
        stroke={t.colors.text.tertiary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

const NotFoundScreen = buildScreen<NotFoundScreenProps>(
  { name: 'NotFound' },
  () => {
    const t = useTheme();

    return (
      <View style={[t.hFull]}>
        <Empty
          message=""
          subMessage="This page does not exist."
          icon={<NotFoundIcon />}
          justify="start"
        />
      </View>
    );
  },
);

NotFoundScreen.displayName = 'NotFoundScreen';

export { NotFoundScreen };
