import { AtomsButton } from 'farcaster-expo';
import React, { FC, useState } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { sleep } from '~/utils/PromiseUtils';

type EmptyProps = {
  message: string;
  subMessage?: string;
  justify?: 'center' | 'start';
  icon?: React.ReactNode;
  refresh?: () => void;
};

const Empty: FC<EmptyProps> = ({
  message,
  subMessage,
  justify = 'center',
  icon,
  refresh,
}) => {
  const t = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <View
      style={[
        t.flexGrow,
        t.mX2,
        ...(justify === 'center'
          ? [t.justifyCenter]
          : [t.justifyStart, t.mT10]),
        t.itemsCenter,
      ]}
    >
      {icon && <View style={[t.mY3]}>{icon}</View>}
      <Text
        style={[
          t.texts.primary,
          t.textBase,
          t.textCenter,
          t.textLg,
          t.fontSemibold,
        ]}
      >
        {message}
      </Text>
      {subMessage && (
        <Text
          style={[
            t.texts.secondary,
            t.textBase,
            t.textCenter,
            message !== '' && t.mT2,
          ]}
        >
          {subMessage}
        </Text>
      )}
      {refresh && (
        <AtomsButton
          hierarchy="primary"
          size="s"
          style={[t.mT4]}
          loading={isRefreshing}
          onPress={() => {
            setIsRefreshing(true);

            refresh();

            // The refetch function that react query gives us doesn't return a promise,
            // so let's just show the laoding spinner for a second, which should be
            // plenty of time for the server to respond in most cases.
            sleep(1000).finally(() => setIsRefreshing(false));
          }}
        >
          Refresh
        </AtomsButton>
      )}
    </View>
  );
};

Empty.displayName = 'Empty';

export { Empty };
