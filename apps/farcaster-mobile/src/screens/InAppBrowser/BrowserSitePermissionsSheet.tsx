import * as Clipboard from 'expo-clipboard';
import {
  AlertTriangle,
  Ban,
  Copy,
  ExternalLink,
  Link,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Unlink,
} from 'lucide-react-native';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type BrowserSitePermissionsSheetProps = {
  title?: string;
  url?: string;
  origin?: string;
  visible: boolean;
  trusted: boolean;
  connected: boolean;
  tier: 0 | 1 | 2 | 3;
  address?: string;
  approvalMode: boolean;
  isAdmin?: boolean;
  onOpenQuality?: () => void;
  onConnectOnce: () => void;
  onConnectAndTrust: () => void;
  onDisconnect: () => void;
  onRevokeTrust: () => void;
  onRefresh: () => void;
  onOpenExternal: () => void;
  onBlockSite?: () => void;
  onUnblockSite?: () => void;
  isSiteBlocked?: boolean;
  onReject: () => void;
  onClose: () => void;
  blockedWalletName?: string;
  isEnablingWalletAccess?: boolean;
  onEnableWalletAccess?: () => void;
  onSwitchToPublicWallet?: () => void;
};

export function BrowserSitePermissionsSheet({
  title,
  url,
  origin,
  visible,
  trusted,
  connected,
  tier,
  address,
  approvalMode,
  isAdmin = false,
  onOpenQuality,
  onConnectOnce,
  onConnectAndTrust,
  onDisconnect,
  onRevokeTrust,
  onRefresh,
  onOpenExternal,
  onBlockSite,
  onUnblockSite,
  isSiteBlocked = false,
  onReject,
  onClose,
  blockedWalletName,
}: BrowserSitePermissionsSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const maskedAddress =
    tier >= 2 && address
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : undefined;

  const displayTitle = title || origin || 'Website';
  const displayUrl = url || origin || '';

  const isHttps = displayUrl.startsWith('https://');
  const canToggleSiteBlock = isSiteBlocked ? onUnblockSite : onBlockSite;

  const handleCopyUrl = async () => {
    if (displayUrl) {
      await Clipboard.setStringAsync(displayUrl);
      toast.show('URL copied to clipboard', { placement: 'top' });
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      toast.show('Address copied to clipboard', { placement: 'top' });
    }
  };

  const handleBackdropPress = () => {
    if (approvalMode) {
      onReject();
      return;
    }
    onClose();
  };

  const cardBgColor = t.colors.bgDefault;
  const dividerColor = t.colors.border.secondary;
  const textColor = t.colors.text.primary;
  const secondaryTextColor = t.colors.text.secondary;

  const Separator = () => (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: dividerColor,
        marginLeft: 16,
      }}
    />
  );

  const OptionRow = ({
    label,
    icon: IconComponent,
    onPress,
    color = textColor,
    iconColor = secondaryTextColor,
  }: {
    label: string;
    icon: React.ComponentType<{ color?: string; size?: number }>;
    onPress: () => void;
    color?: string;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 48,
      }}
    >
      <Text2 style={{ fontSize: 16, color }}>{label}</Text2>
      <IconComponent color={iconColor} size={18} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <Pressable
        onPress={handleBackdropPress}
        style={[
          t.flex1,
          t.justifyEnd,
          { backgroundColor: t.colors.background.overlay },
        ]}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            t.p4,
            {
              backgroundColor: t.colors.bgNewLightGray,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: Math.max(insets.bottom, 16),
              gap: 16,
            },
          ]}
        >
          {/* Drag notch */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.colors.border.tertiary,
              alignSelf: 'center',
              marginTop: 6,
              marginBottom: 4,
            }}
          />

          {/* Website Header Info */}
          <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
            <Text2
              weight="bold"
              style={{ fontSize: 20, textAlign: 'center', color: textColor }}
            >
              {displayTitle}
            </Text2>
            <Text2
              numberOfLines={1}
              style={{
                fontSize: 14,
                color: secondaryTextColor,
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              {displayUrl}
            </Text2>
          </View>

          {/* HTTPS Warning banner */}
          {!isHttps && displayUrl.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: t.colors.bgLightRed,
                borderWidth: 1,
                borderColor: t.colors.border.danger,
                borderRadius: 12,
                padding: 12,
                gap: 8,
              }}
            >
              <AlertTriangle color={t.colors.text.danger} size={20} />
              <Text2
                style={{
                  color: t.colors.text.danger,
                  fontWeight: '600',
                  fontSize: 14,
                  flex: 1,
                }}
              >
                This website does not support HTTPS
              </Text2>
            </View>
          )}

          {/* Standard Actions Card */}
          <View
            style={{
              backgroundColor: cardBgColor,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <OptionRow
              label="Copy URL to clipboard"
              icon={Link}
              onPress={handleCopyUrl}
            />
            <Separator />
            <OptionRow
              label="Refresh page"
              icon={RefreshCw}
              onPress={() => {
                onClose();
                onRefresh();
              }}
            />
            <Separator />
            <OptionRow
              label="Open in browser"
              icon={ExternalLink}
              onPress={() => {
                onClose();
                onOpenExternal();
              }}
            />
            {canToggleSiteBlock ? (
              <>
                <Separator />
                <OptionRow
                  label={isSiteBlocked ? 'Unblock site' : 'Block site'}
                  icon={Ban}
                  onPress={() => {
                    onClose();
                    canToggleSiteBlock();
                  }}
                />
              </>
            ) : null}
            {isAdmin && onOpenQuality && (
              <>
                <Separator />
                <OptionRow
                  label="Manage safety rating"
                  icon={ShieldAlert}
                  onPress={() => {
                    onClose();
                    onOpenQuality();
                  }}
                />
              </>
            )}
          </View>

          {/* Connection Status & Dot */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 8,
              marginTop: 4,
            }}
          >
            <Text2
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: secondaryTextColor,
              }}
            >
              {connected ? 'Wallet connected' : 'Wallet not connected'}
            </Text2>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: connected
                  ? t.colors.text.success
                  : t.colors.text.tertiary,
              }}
            />
          </View>

          {/* Connected Wallet Info Card */}
          {connected && (
            <View
              style={{
                backgroundColor: cardBgColor,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={handleCopyAddress}
                activeOpacity={0.6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: t.colors.bgLightPurple,
                  height: 48,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <Text2
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: t.colors.text.brand,
                      marginRight: 12,
                    }}
                  >
                    Ethereum
                  </Text2>
                  {maskedAddress ? (
                    <Text2 style={{ fontSize: 14, color: secondaryTextColor }}>
                      {maskedAddress}
                    </Text2>
                  ) : null}
                </View>
                <Copy color={t.colors.text.brand} size={18} />
              </TouchableOpacity>

              <Separator />

              <OptionRow
                label="Disconnect"
                icon={Unlink}
                onPress={onDisconnect}
              />

              <Separator />

              <OptionRow
                label={trusted ? 'Revoke auto-connect' : 'Enable auto-connect'}
                icon={trusted ? ShieldX : ShieldCheck}
                onPress={trusted ? onRevokeTrust : onConnectAndTrust}
                color={trusted ? t.colors.text.danger : textColor}
                iconColor={trusted ? t.colors.text.danger : secondaryTextColor}
              />
            </View>
          )}

          {/* Connect Action Buttons */}
          {(approvalMode || !connected) && (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={onConnectOnce}
                activeOpacity={0.8}
                style={{
                  backgroundColor: t.colors.bgAction,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text2
                  style={{
                    color: t.colors.text.white,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Connect once
                </Text2>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onConnectAndTrust}
                activeOpacity={0.8}
                style={{
                  backgroundColor: t.colors.actionSecondary,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text2
                  style={{
                    color: t.colors.text.primary,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Always connect
                </Text2>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Text */}
          <Text2
            style={{
              fontSize: 12,
              color: secondaryTextColor,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {blockedWalletName
              ? `${blockedWalletName} is selected, but web app transactions are disabled for this wallet.`
              : 'Signing and transaction requests still require explicit approval.'}
          </Text2>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
