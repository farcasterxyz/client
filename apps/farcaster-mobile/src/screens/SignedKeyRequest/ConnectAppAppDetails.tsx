import {
  ApiSignerUserMetadata,
  ApiUser,
  formatDate,
} from 'farcaster-client-data';
import { formatNumber, resolveUsername } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { RemoteImage } from '~/components/RemoteImage';
import { Text2 } from '~/components/Text';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useTheme } from '~/contexts/ThemeProvider';

type ConnectAppAppDetailsProps = {
  app: ApiUser;
  appMetadata: ApiSignerUserMetadata;
};

const ConnectAppAppDetails: React.FC<ConnectAppAppDetailsProps> = ({
  app,
  appMetadata,
}) => {
  const t = useTheme();

  return (
    <View style={[t.p3]}>
      <View style={[t.pY3, t.flexRow, t.itemsCenter, { gap: 16 }]}>
        <RemoteImage
          contentFit="cover"
          uri={app.pfp?.url}
          fallbackSource={{ uri: defaultAvatarUrl }}
          height={56}
          width={56}
          style={[{ borderRadius: 12, backgroundColor: 'white' }]}
        />
        <View>
          <Text2 size="lg" weight="semibold">
            {app.displayName}
          </Text2>
          <Text2 color="secondary">{resolveUsername(app)}</Text2>
        </View>
      </View>
      <View style={[t.pY3]}>
        <View
          style={[
            t.bgFaint,
            {
              borderRadius: 16,
              overflow: 'hidden',
            },
          ]}
        >
          <View
            style={[
              t.p4,
              t.flexRow,
              t.justifyBetween,
              t.borderB,
              t.borderBackground,
            ]}
          >
            <Text2 color="secondary">Joined</Text2>
            <Text2>{formatDate(appMetadata.createdAt as number)}</Text2>
          </View>
          <View style={[t.p4, t.flexRow, t.justifyBetween]}>
            <Text2 color="secondary">Users</Text2>
            <Text2>{formatNumber(appMetadata.usersCount)}</Text2>
          </View>
        </View>
      </View>
    </View>
  );
};

export { ConnectAppAppDetails };
