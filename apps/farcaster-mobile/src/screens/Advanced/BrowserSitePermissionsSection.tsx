import { AtomsButton } from 'farcaster-expo';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  listBrowserPermissions,
  revokeBrowserPermission,
} from '~/screens/InAppBrowser/BrowserPermissionStore';
import { BrowserPermissionRecord } from '~/screens/InAppBrowser/BrowserTypes';

const BrowserSitePermissionsSection: FC = () => {
  const t = useTheme();
  const [version, setVersion] = useState(0);

  const sites = useMemo<BrowserPermissionRecord[]>(() => {
    void version;
    return listBrowserPermissions().filter(
      (p) => p.connectGranted || p.trusted,
    );
  }, [version]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const handleRevoke = useCallback(
    (origin: string) => {
      Alert.alert(
        'Revoke site access',
        `Disconnect ${origin}? Any active session will need to reconnect.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: () => {
              revokeBrowserPermission(origin);
              bump();
            },
          },
        ],
      );
    },
    [bump],
  );

  if (sites.length === 0) {
    return null;
  }

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          Trusted browser sites
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        Sites you have connected to via the in-app browser. Trusted sites
        auto-connect on future visits; signing and transactions still always
        require your explicit approval.
      </Text>
      {sites.map((site) => (
        <View
          key={site.origin}
          style={[t.flexRow, t.justifyBetween, t.itemsCenter, t.mB3]}
        >
          <View style={[t.flex1, t.pR2]}>
            <Text
              style={[t.texts.primary, t.textSm, t.fontSemibold]}
              numberOfLines={1}
            >
              {site.origin}
            </Text>
            <Text style={[t.texts.secondary, t.textXs]}>
              {site.trusted ? 'Trusted — auto-connect' : 'Connected'}
            </Text>
          </View>
          <AtomsButton
            onPress={() => handleRevoke(site.origin)}
            size="s"
            hierarchy="dangerSecondary"
          >
            Revoke
          </AtomsButton>
        </View>
      ))}
    </View>
  );
};

export { BrowserSitePermissionsSection };
