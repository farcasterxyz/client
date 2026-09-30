import { ApiChain, ApiUser } from 'farcaster-client-data';
import { formatNumber } from 'farcaster-client-hooks';
import moment from 'moment';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { ChainImage } from '~/components/Chain/ChainImage';
import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

type TransactionProps = {
  chain: ApiChain | undefined;
  description: string | undefined;
  imageStyle: 'square' | 'circle';
  imageUrl?: string;
  imageComponent?: React.ReactNode;
  pending: boolean;
  timestamp: number;
  title: string;
  amount: number;
  incomingTransaction: boolean;
  user?: ApiUser;
  transactionAction?: React.ReactNode;
};

const Transaction: React.FC<TransactionProps> = ({
  chain,
  description,
  imageStyle,
  imageUrl,
  imageComponent,
  pending,
  timestamp,
  title,
  amount,
  incomingTransaction,
  user,
  transactionAction,
}) => {
  const t = useTheme();
  const pushToUserProfile = usePushToUserProfile();

  const onTransactionAvatarPush = React.useCallback(() => {
    if (user) {
      pushToUserProfile({ fid: user.fid });
    }
  }, [pushToUserProfile, user]);

  const transactionTimestamp = React.useMemo(() => {
    const formatted = moment(timestamp).fromNow();

    if (formatted === 'just now') {
      return `${formatted}`;
    }

    return `${formatted} ago`;
  }, [timestamp]);

  const transactionImage = React.useMemo(() => {
    if (imageComponent) {
      return imageComponent;
    }

    if (pending) {
      return (
        <View style={[t.pL2, t.mR5, t.selfStart]}>
          <LoadingIndicator />
        </View>
      );
    }

    if (user) {
      return (
        <View style={[t.mR4, t.selfStart]}>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={onTransactionAvatarPush}
          >
            <Avatar pfpUrl={user.pfp?.url} diameter={32} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[t.mR4, t.relative, t.selfStart]}>
        <RemoteImage
          uri={imageUrl}
          contentFit="cover"
          style={[
            t.h8,
            t.w8,
            t.borderHairline,
            t.borderDefault,
            t.pB2,
            imageStyle === 'circle' ? t.roundedFull : t.roundedLg,
          ]}
          shouldFadeIn={false}
          fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
        />
        {typeof chain !== 'undefined' && (
          <View style={[t.absolute, t.bottom0, t.right0, t._mR1]}>
            <ChainImage chain={chain} size={16} />
          </View>
        )}
      </View>
    );
  }, [
    chain,
    imageStyle,
    imageUrl,
    imageComponent,
    onTransactionAvatarPush,
    pending,
    t._mR1,
    t.absolute,
    t.borderDefault,
    t.borderHairline,
    t.bottom0,
    t.h8,
    t.mR4,
    t.mR5,
    t.pB2,
    t.pL2,
    t.relative,
    t.right0,
    t.roundedFull,
    t.roundedLg,
    t.selfStart,
    t.w8,
    user,
  ]);

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.wFull,
        t.itemsCenter,
        t.justifyBetween,
        t.p4,
        t.borderBHairline,
        t.borderDefault,
      ]}
    >
      <View style={[t.flex, t.flexRow, t.itemsCenter]}>
        <View style={[t.flex, t.flexCol, t.selfStart]}>{transactionImage}</View>
        <View style={[t.flex1, t.flex, t.flexCol]}>
          <View
            style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween, t.mB2]}
          >
            <View style={[t.flex, t.flexCol, { maxWidth: '80%' }]}>
              <Text
                style={[t.texts.primary, t.textBase, t.mB1]}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text style={[t.texts.tertiary, t.textXs]}>
                {transactionTimestamp}
              </Text>
            </View>
            <Text
              style={[
                t.selfStart,
                { paddingTop: 2 },
                incomingTransaction
                  ? { color: t.colors.apple }
                  : t.texts.secondary,
                t.textBase,
              ]}
            >
              {incomingTransaction ? '+' : '-'}
              {formatNumber(amount)}
            </Text>
          </View>
          {typeof description !== 'undefined' && (
            <Text style={[t.texts.secondary, t.textSm]}>{description}</Text>
          )}
          {typeof transactionAction !== 'undefined' &&
            transactionAction !== null && (
              <View style={[t.mT2]}>{transactionAction}</View>
            )}
        </View>
      </View>
    </View>
  );
};

Transaction.displayName = 'Transaction';

export { Transaction };
