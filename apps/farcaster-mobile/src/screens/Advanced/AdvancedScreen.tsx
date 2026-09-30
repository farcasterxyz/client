import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { AdvancedProtectionModeSection } from '~/screens/Advanced/AdvancedProtectionModeSection';
import { DeveloperModeSection } from '~/screens/Advanced/DeveloperModeSection';
import { CommonStackParamList } from '~/types';

import { AdvancedPasskeysSection } from './AdvancedPasskeysSection';
import { AdvancedRecoveryOptionsRow } from './AdvancedRecoveryOptionsRow';
import { AdvancedSignersProductsSection } from './AdvancedSignersProductsSection';
import { BrowserSitePermissionsSection } from './BrowserSitePermissionsSection';
import { ChangeRecoveryAddressSection } from './ChangeRecoveryAddressSection';
import { ConnectedAppsSection } from './ConnectedAppsSection';
import { DeleteAccountSection } from './DeleteAccountSection';
import { EnrollPasskeysSection } from './EnrollPasskeysSection';

type AdvancedScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Advanced'
>;

const AdvancedScreen = buildScreen<AdvancedScreenProps>(
  { name: 'Advanced' },
  ({
    route: {
      params: { section },
    },
  }) => {
    const t = useTheme();
    const insets = useSafeAreaInsets();

    const scrollRef = React.useRef<ScrollView>(null);

    React.useEffect(() => {
      if (section && scrollRef.current !== null) {
        requestAnimationFrame(() => {
          // We now the only deeplink sections are currently at the bottom.
          // This won't scale once its opened up to more deeplinking oppty.
          if (scrollRef.current !== null) {
            scrollRef.current.scrollToEnd({ animated: false });
          }
        });
      }
    }, [section]);

    return (
      <ScrollView
        style={[t.hFull]}
        ref={scrollRef}
        contentContainerStyle={[t.p4, { paddingBottom: insets.bottom }]}
      >
        <AdvancedProtectionModeSection />
        <ConnectedAppsSection />
        <BrowserSitePermissionsSection />
        <AdvancedSignersProductsSection />
        <ChangeRecoveryAddressSection />
        <EnrollPasskeysSection />
        <AdvancedPasskeysSection />
        <View style={[t.pB4, t.mB4, t.borderBHairline, t.borderDefault]}>
          <DeveloperModeSection />
        </View>
        <AdvancedRecoveryOptionsRow />
        <DeleteAccountSection />
      </ScrollView>
    );
  },
);

AdvancedScreen.displayName = 'AdvancedScreen';

export { AdvancedScreen };
