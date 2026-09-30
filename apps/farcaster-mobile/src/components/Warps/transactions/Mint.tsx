import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiWarpsMintTransaction } from 'farcaster-client-data';
import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

import { Transaction } from './Transaction';

type MintProps = {
  transaction: ApiWarpsMintTransaction;
};

const Mint: React.FC<MintProps> = ({ transaction }) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const navigate = usePossiblyNavigateOrOpenUrl();

  const title = React.useMemo(() => {
    return transaction.content.assetName
      ? `Minted ${transaction.content.assetName}`
      : 'Mint';
  }, [transaction.content.assetName]);

  const imageUrl = React.useMemo(() => {
    return (
      transaction.content.assetImageUrl || NFT_IMAGE_UNAVAILABLE_SOURCE.uri
    );
  }, [transaction.content.assetImageUrl]);

  const transactionAction = React.useMemo(() => {
    const assetMintUrl = transaction.content.assetMintUrl;

    if (typeof assetMintUrl === 'undefined' || assetMintUrl === '') {
      return null;
    }

    return (
      <TouchableOpacity
        style={[
          t.borderHairline,
          t.borderDefault,
          t.h8,
          { paddingTop: 2 },
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: 24 },
        ]}
        onPress={async () => {
          trackEvent(AnalyticsEvent.ClickMintOpenInBrowser, {});

          navigate({ url: assetMintUrl, openExternalInBrowser: true });
        }}
        activeOpacity={0.75}
      >
        <Octicons
          name="link-external"
          size={16}
          style={[t.texts.tertiary, t.mR2]}
        />
        <Text style={[t.texts.secondary, t.textSm]}>Open in Browser</Text>
      </TouchableOpacity>
    );
  }, [
    navigate,
    t.borderDefault,
    t.borderHairline,
    t.flex,
    t.flexRow,
    t.h8,
    t.itemsCenter,
    t.justifyCenter,
    t.mR2,
    t.texts.tertiary,
    t.texts.secondary,
    t.textSm,
    trackEvent,
    transaction.content.assetMintUrl,
  ]);

  return (
    <Transaction
      title={title}
      description={undefined}
      imageStyle="square"
      imageUrl={imageUrl}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={false}
      chain={transaction.content.assetChain}
      transactionAction={transactionAction}
    />
  );
};

Mint.displayName = 'Mint';

export { Mint };
