import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

import { Text2 } from './Text';

type ErrorDebuggingExtrasProps = {
  errorTrackingId: string;
};

const ErrorDebuggingExtras: FC<ErrorDebuggingExtrasProps> = memo(
  ({ errorTrackingId }) => {
    const isSignedIn = useIsSignedIn();

    if (isSignedIn) {
      return <AuthedErrorDebuggingExtras errorTrackingId={errorTrackingId} />;
    }

    return <UnauthedErrorDebuggingExtras errorTrackingId={errorTrackingId} />;
  },
);

ErrorDebuggingExtras.displayName = 'ErrorDebuggingExtras';

const AuthedErrorDebuggingExtras: FC<ErrorDebuggingExtrasProps> = memo(
  ({ errorTrackingId }) => {
    const t = useTheme();

    const { fid } = useCurrentUser_UNSAFE();

    return (
      <View style={[t.flex, t.flexCol, t.justifyCenter, t.itemsCenter]}>
        <Text2 color="tertiary" size="sm">
          {fid}
        </Text2>
        <Text2 color="tertiary" size="sm">
          {errorTrackingId}
        </Text2>
      </View>
    );
  },
);

AuthedErrorDebuggingExtras.displayName = 'AuthedErrorDebuggingExtras';

const UnauthedErrorDebuggingExtras: FC<ErrorDebuggingExtrasProps> = memo(
  ({ errorTrackingId }) => {
    const t = useTheme();
    const { address } = useWallet();

    return (
      <View style={[t.flex, t.flexCol, t.justifyCenter, t.itemsCenter]}>
        {address && (
          <Text2 color="tertiary" size="sm">
            {address}
          </Text2>
        )}
        <Text2 color="tertiary" size="sm">
          {errorTrackingId}
        </Text2>
      </View>
    );
  },
);

UnauthedErrorDebuggingExtras.displayName = 'UnauthedErrorDebuggingExtras';

export { ErrorDebuggingExtras };
