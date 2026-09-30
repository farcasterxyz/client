import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { View } from 'react-native';

import { PurchaseButton } from '~/components/PurchaseButton';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { getAdvancedSignerProducts } from '~/utils/IAPUtils';

type AdvancedSignersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'AdvancedSigners'
>;

const AdvancedSignersScreen = buildScreen<AdvancedSignersScreenProps>(
  { name: 'AdvancedSigners' },
  () => {
    const t = useTheme();

    const { fid } = useCurrentUser_UNSAFE();
    const { availableConsumableOfferings } = useInAppPurchases();
    const advancedSigners = getAdvancedSignerProducts({
      fid,
      skus: availableConsumableOfferings,
    });

    if (typeof advancedSigners === 'undefined') {
      return (
        <View style={[t.hFull, t.p4]}>
          <></>
        </View>
      );
    }

    return (
      <View style={[t.hFull, t.pT2]}>
        <FlashList
          data={advancedSigners}
          ListHeaderComponent={
            <View
              style={[t.pX4, t.pT2, t.pB4, t.borderBHairline, t.borderDefault]}
            >
              <Text style={[t.texts.secondary, t.textSm]}>
                Signers can be used to create or like casts. Farcaster
                streamlines the process for other Farcaster clients to create
                signers.
              </Text>
            </View>
          }
          keyExtractor={extractItemKey}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

const extractItemKey = (item: { productId: string; productName: string }) =>
  item.productId;

const renderItem = ({
  item: { productId, productName },
}: {
  item: { productId: string; productName: string };
}) => <AdvancedSigner productId={productId} productName={productName} />;

type AdvancedSignerProps = {
  productId: string;
  productName: string;
};

const AdvancedSigner: React.FC<AdvancedSignerProps> = ({
  productId,
  productName,
}) => {
  const t = useTheme();

  const { getAvailableOffering, hasPurchasedOffering } = useInAppPurchases();

  const offering = getAvailableOffering({ productId });

  const purchasedSignerOffering = React.useMemo(() => {
    if (typeof offering !== 'undefined') {
      return hasPurchasedOffering({ productId: offering.productId });
    }
    return false;
  }, [hasPurchasedOffering, offering]);

  if (typeof offering === 'undefined') {
    return null;
  }

  return (
    <View
      style={[
        t.p4,
        t.borderBHairline,
        t.borderDefault,
        t.flex,
        t.flexRow,
        t.justifyBetween,
      ]}
    >
      <View style={[t.flex1, t.flexCol, t.justifyCenter]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <Text style={[t.texts.primary, t.textBase]}>{productName}</Text>
          <Text style={[{ color: t.colors.apple }, t.textSm, t.mL2]}>
            {offering.localizedPrice}
          </Text>
        </View>
        {offering.price >= 900 && (
          <Text style={[t.texts.secondary, t.textSm]}>
            Farcaster will store more than{' '}
            {Math.ceil(offering.price / 300) * 5000} casts (posts).
          </Text>
        )}
        {purchasedSignerOffering && (
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <View
              style={[
                t.roundedFull,
                t.bgSuccess,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.h3,
                t.w3,
                t.mR1,
              ]}
            >
              <Octicons name="check" size={8} style={[{ color: '#ffffff' }]} />
            </View>
            <Text style={[t.texts.success]}>Purchased</Text>
          </View>
        )}
      </View>
      <PurchaseButton
        onchainTransactionType="debug-onchain-trx-type"
        productId={offering.productId}
        style={[t.selfEnd]}
      />
    </View>
  );
};

AdvancedSignersScreen.displayName = 'AdvancedSignersScreen';

export { AdvancedSignersScreen };
