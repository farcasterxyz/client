import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useOffering } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { Divider } from '~/components/Divider';
import { PurchaseButton } from '~/components/PurchaseButton';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { CommonStackParamList } from '~/types';

type DebugInAppPurchasesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugInAppPurchases'
>;

const DebugInAppPurchasesScreen = buildScreen<DebugInAppPurchasesScreenProps>(
  { name: 'DebugInAppPurchases' },
  () => {
    const t = useTheme();

    const isAdmin = useIsAdmin();

    const { getAvailableOffering, hasPurchasedOffering } = useInAppPurchases();
    const { data } = useOffering({
      onchainTransactionType: 'create-onchain-signer',
    });

    const signerOffering = React.useMemo(() => {
      return getAvailableOffering({ productId: data!.offering.productId });
    }, [data, getAvailableOffering]);

    const purchasedSignerOffering = React.useMemo(() => {
      if (typeof data?.offering.productId !== 'undefined') {
        return hasPurchasedOffering({ productId: data?.offering.productId });
      }
      return false;
    }, [data?.offering.productId, hasPurchasedOffering]);

    if (!isAdmin) {
      return null;
    }

    return (
      <View style={[t.hFull, t.p4]}>
        <Text style={[t.mB2, t.fontSemibold, t.texts.warning, t.textLg]}>
          Expect long delays during debug purchases. Apple limits the speed of
          these transactions, purposefully, on TestFlight and Sandbox
          environments (basically fake purchases). Note that this will charge
          your TestFlight device Apple ID user and we won't be able to clear
          that state. (Not an issue in general but something to note regardless)
        </Text>
        <Divider />
        {signerOffering && (
          <View style={[t.flex, t.flexCol]}>
            <Text style={[t.mB2, t.fontSemibold, t.texts.primary, t.textLg]}>
              Name: {signerOffering.name}
            </Text>
            <Text style={[t.mB2, t.texts.primary]}>
              Product Id: {signerOffering.productId}
            </Text>
            <Text style={[t.mB2, t.texts.primary]}>
              Price: {signerOffering.localizedPrice}
            </Text>
            <View style={[t.flex, t.flexRow, t.justifyBetween, t.itemsCenter]}>
              <Text
                style={[
                  purchasedSignerOffering ? t.texts.success : t.texts.primary,
                ]}
              >
                {purchasedSignerOffering ? 'Purchased' : 'Can be purchased'}
              </Text>
              <PurchaseButton
                onchainTransactionType="create-onchain-signer"
                productId={signerOffering.productId}
                disabled={purchasedSignerOffering}
                style={[t.selfEnd]}
              />
            </View>
          </View>
        )}
        <Divider />
      </View>
    );
  },
);

DebugInAppPurchasesScreen.displayName = 'DebugInAppPurchasesScreen';

export { DebugInAppPurchasesScreen };
