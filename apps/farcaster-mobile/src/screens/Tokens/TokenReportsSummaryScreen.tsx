import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { ApiChain, ApiUser } from 'farcaster-client-data';
import { useBlockToken, useTokenReportsSummary } from 'farcaster-client-hooks';
import { formatAddress, TokenIcon } from 'farcaster-expo';
import { Copy } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useAuthedHeaderHeight } from '~/hooks/navigation/useAuthedHeaderHeight';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { CommonStackParamList } from '~/types';

type TokenReportsSummaryScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TokenReportsSummary'
>;

const TokenReportsSummaryContent: React.FC<{
  chain: ApiChain;
  ca: string;
}> = ({ chain, ca }) => {
  const t = useTheme();
  const push = usePush();
  const pushToUserProfile = usePushToUserProfile();
  const toast = useToast();
  const blockToken = useBlockToken();
  const headerHeight = useAuthedHeaderHeight();
  const insets = useSafeAreaInsets();

  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [displayCa, setDisplayCa] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const { data, isLoading, refetch } = useTokenReportsSummary({
    chain,
    ca,
  });

  const { refreshControl } = usePullToRefreshInfinite({ refetch });

  const summary = data?.result;

  const renderUserItem: ListRenderItem<ApiUser> = useCallback(
    ({ item: user }) => {
      return (
        <TouchableOpacity
          onPress={() => pushToUserProfile({ fid: user.fid })}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.pX4,
            t.pY3,
            t.borderB,
            t.borders.secondary,
            { gap: 12 },
          ]}
        >
          <Avatar pfpUrl={user.pfp?.url} diameter={40} />
          <View style={[t.flex1]}>
            <Text style={[t.fontSemibold, t.textBase, t.texts.primary]}>
              {user.displayName || user.username}
            </Text>
            <Text style={[t.texts.secondary, t.textSm]}>@{user.username}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [pushToUserProfile, t],
  );

  const keyExtractor = useCallback((user: ApiUser) => {
    return user.fid.toString();
  }, []);

  const handleSymbolPress = useCallback(() => {
    setDisplayCa((prev) => !prev);
  }, []);

  const handleCopyAddress = useCallback(async () => {
    if (!summary?.token.ca) return;
    await Clipboard.setStringAsync(summary.token.ca);
    setAddressCopied(true);
    setTimeout(() => {
      setAddressCopied(false);
      setDisplayCa(false);
    }, 2000);
  }, [summary?.token.ca]);

  const handleTokenPress = useCallback(() => {
    push('Token', {
      chain,
      ca,
      via: 'token_reports',
    });
  }, [push, chain, ca]);

  const handleBlockToken = useCallback(async () => {
    if (!blockReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for blocking this token');
      return;
    }

    Alert.alert('Block Token', 'Are you sure you want to block this token?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          setIsBlocking(true);
          try {
            await blockToken({
              chain,
              ca,
              reason: blockReason.trim(),
            });
            toast.show('Token blocked successfully', {
              type: 'success',
            });
            setBlockReason('');
          } catch (error) {
            toast.show('Failed to block token', {
              type: 'danger',
            });
          } finally {
            setIsBlocking(false);
          }
        },
      },
    ]);
  }, [blockToken, chain, ca, blockReason, toast]);

  if (isLoading) {
    return (
      <View style={[t.flex1, t.itemsCenter, t.justifyCenter]}>
        <Text style={[t.texts.secondary, t.textBase]}>Loading...</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={[t.flex1, t.itemsCenter, t.justifyCenter]}>
        <Text style={[t.texts.secondary, t.textBase]}>No reports found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[t.flex1]}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={[t.pX4, t.pY3, t.borderB, t.borders.secondary, { gap: 12 }]}>
        <TouchableOpacity
          onPress={handleTokenPress}
          style={[t.flexRow, t.itemsCenter, { gap: 12 }]}
        >
          <TokenIcon
            iconUrl={summary.token.imageUrl}
            chain={summary.token.chain}
            diameter={48}
            chainImageSize={16}
            symbol={summary.token.symbol ?? ''}
            features={summary.token.features}
            badgeOffset={{ top: -2, right: -2 }}
            imageBordered
          />
          <View style={[t.flex1]}>
            <Text
              style={[t.fontBold, t.text2xl, t.texts.primary]}
              numberOfLines={1}
            >
              {summary.token.name || summary.token.symbol}
            </Text>
            <TouchableOpacity
              style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
              onPress={handleSymbolPress}
              onLongPress={handleCopyAddress}
              activeOpacity={0.75}
            >
              <Text style={[t.texts.secondary, t.textSm]}>
                {addressCopied
                  ? 'Copied'
                  : displayCa
                    ? formatAddress(summary.token.ca)
                    : `$${summary.token.symbol}`}
              </Text>
              {displayCa && !addressCopied && (
                <Copy size={12} color={t.colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={[t.flexRow, { gap: 16 }]}>
          <View style={[t.flex1]}>
            <Text style={[t.texts.secondary, t.textSm]}>Total</Text>
            <Text style={[t.fontBold, t.textLg, t.texts.primary]}>
              {summary.totalReports}
            </Text>
          </View>
          <View style={[t.flex1]}>
            <Text style={[t.texts.secondary, t.textSm]}>Fraudulent</Text>
            <Text style={[t.fontBold, t.textLg, t.texts.primary]}>
              {summary.reportsByCategory.fraudulent}
            </Text>
          </View>
          <View style={[t.flex1]}>
            <Text style={[t.texts.secondary, t.textSm]}>Offensive</Text>
            <Text style={[t.fontBold, t.textLg, t.texts.primary]}>
              {summary.reportsByCategory.offensive}
            </Text>
          </View>
        </View>
      </View>

      <View style={[t.pX4, t.pY3, t.borderB, t.borders.secondary]}>
        <Text style={[t.fontSemibold, t.textBase, t.texts.primary]}>
          Reported by {summary.reportedBy.count}{' '}
          {summary.reportedBy.count === 1 ? 'user' : 'users'}
        </Text>
      </View>

      <FlatList
        data={summary.reportedBy.users}
        renderItem={renderUserItem}
        keyExtractor={keyExtractor}
        refreshControl={refreshControl}
        style={[t.flex1]}
      />

      <View
        style={[
          t.pX4,
          t.pY4,
          t.borderT,
          t.borders.secondary,
          t.backgrounds.default,
          { gap: 12, paddingBottom: Math.max(16, insets.bottom) },
        ]}
      >
        <Text style={[t.fontSemibold, t.textBase, t.texts.primary]}>
          Block Token
        </Text>
        <TextInput
          value={blockReason}
          onChangeText={setBlockReason}
          placeholder="Enter reason for blocking..."
          placeholderTextColor={t.colors.text.tertiary}
          style={[
            t.p3,
            t.textBase,
            t.texts.primary,
            {
              borderRadius: 12,
              height: 44,
              backgroundColor: t.colors.background.tertiary,
            },
          ]}
          editable={!isBlocking}
        />
        <ButtonV2
          title={isBlocking ? 'Blocking...' : 'Block Token'}
          onPress={handleBlockToken}
          disabled={isBlocking || !blockReason.trim()}
          loading={isBlocking}
          variant="primary"
          textSize="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const TokenReportsSummaryScreen = buildScreen<TokenReportsSummaryScreenProps>(
  { name: 'TokenReportsSummary', themeV2: true },
  ({
    route: {
      params: { chain, ca },
    },
  }) => {
    const isAdmin = useIsAdmin();

    if (!isAdmin) {
      return null;
    }

    return <TokenReportsSummaryContent chain={chain} ca={ca} />;
  },
);

TokenReportsSummaryScreen.displayName = 'TokenReportsSummaryScreen';

export { TokenReportsSummaryScreen };
