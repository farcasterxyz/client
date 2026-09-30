import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { usePush } from '~/hooks/navigation/usePush';

const PRESETS_USDC = [1, 5, 20];
const USDC_CONTRACT_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const USDC_DECIMALS = 6;
const ACTION_PRIMARY = '#7c65c1';

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    bgSecondary: isDark ? '#2a2a2a' : '#f2f2f2',
    actionPrimary: ACTION_PRIMARY,
  };
}

type Speaker = {
  user: ApiUser;
  role: 'host' | 'cohost' | 'speaker';
};

/**
 * Multi-select USDC tip sheet for mobile (parity with web `TipSpeakersSheet`).
 *
 * On mobile we don't have an in-process wallet bridge — pushing the
 * `WalletSend` screen with a prefilled `sendIntent` for the first selected
 * recipient gives the user the standard send-token flow (preview, confirm,
 * execute). If multiple speakers are selected, we start with the first and
 * show guidance to repeat for remaining recipients.
 */
const TipSpeakersSheet: React.FC<{
  open: boolean;
  speakers: Speaker[];
  onClose: () => void;
}> = React.memo(({ open, speakers, onClose }) => {
  const c = useColors();
  const toast = useToast();
  const push = usePush();

  const allFids = useMemo(() => speakers.map((s) => s.user.fid), [speakers]);
  const [selected, setSelected] = useState<Set<number>>(new Set(allFids));
  const [perRecipient, setPerRecipient] = useState(5);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    // Reset selection/amount only when the sheet is newly opened.
    // `speakers` may refresh while open, and we don't want to clobber
    // the user's in-progress amount selection.
    if (open && !wasOpenRef.current) {
      setSelected(new Set(allFids));
      setPerRecipient(5);
    }
    wasOpenRef.current = open;
  }, [open, allFids]);

  const toggle = useCallback((fid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) {
        next.delete(fid);
      } else {
        next.add(fid);
      }
      return next;
    });
  }, []);

  const send = useCallback(() => {
    if (selected.size === 0) return;
    const fids = [...selected];
    const amountRaw = BigInt(
      Math.round(perRecipient * Math.pow(10, USDC_DECIMALS)),
    ).toString();

    // Push WalletSend for the first selected recipient only. We can't
    // chain sends automatically (each send requires user confirmation),
    // so we close the sheet and prompt the user to tip remaining speakers.
    const firstFid = fids[0];
    const recipient = speakers.find((s) => s.user.fid === firstFid);
    if (!recipient) return;

    onClose();
    push('WalletSend', {
      platformType: 'mobile',
      sendIntent: {
        chain: 'base',
        ca: USDC_CONTRACT_BASE,
        amount: amountRaw,
        recipientFid: firstFid,
        recipientUser: recipient.user,
      },
    });

    if (fids.length > 1) {
      toast.show(
        `Sending ${perRecipient} USDC to ${recipient.user.displayName}. Tap each remaining speaker to tip again.`,
        { type: 'generic' },
      );
    }
  }, [selected, perRecipient, speakers, push, onClose, toast]);

  if (!open) return null;

  const totalUsd = perRecipient * selected.size;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
          <View style={styles.grabberWrap}>
            <View style={[styles.grabber, { backgroundColor: c.border }]} />
          </View>

          <View style={[styles.header, { borderColor: c.border }]}>
            <View style={styles.headerLeft}>
              <Octicons name="zap" size={15} color={c.actionPrimary} />
              <Text style={[styles.headerTitle, { color: c.fg }]}>
                Tip speakers
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Octicons name="x" size={18} color={c.fg} />
            </Pressable>
          </View>

          <View style={[styles.amountSection, { borderColor: c.border }]}>
            <Text style={[styles.label, { color: c.fgFaint }]}>
              Amount per speaker (USDC)
            </Text>
            <View style={styles.presetsRow}>
              {PRESETS_USDC.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPerRecipient(p)}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor:
                        perRecipient === p ? c.actionPrimary : c.bgSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: perRecipient === p ? 'white' : c.fg },
                    ]}
                  >
                    {p} USDC
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <ScrollView
            style={{ maxHeight: 340 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.recipientsHeader, { color: c.fgFaint }]}>
              RECIPIENTS · {selected.size}/{allFids.length}
            </Text>
            {speakers.map(({ user, role }) => {
              const isSelected = selected.has(user.fid);
              const roleLabel =
                role === 'host'
                  ? 'Host'
                  : role === 'cohost'
                    ? 'Co-host'
                    : 'Speaker';
              return (
                <Pressable
                  key={user.fid}
                  onPress={() => toggle(user.fid)}
                  style={styles.recipientRow}
                >
                  <Avatar pfpUrl={user.pfp?.url} diameter={36} />
                  <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                    <SpaceUserDisplayNameWithProBadge
                      user={user}
                      badgeSize={13}
                      textStyle={[styles.recipientName, { color: c.fg }]}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.recipientHandle, { color: c.fgFaint }]}
                    >
                      @{user.username} · {roleLabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? c.actionPrimary : c.border,
                        backgroundColor: isSelected
                          ? c.actionPrimary
                          : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Octicons name="check" size={12} color="white" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { borderColor: c.border }]}>
            <Text style={[styles.totalText, { color: c.fgFaint }]}>
              {selected.size === 0
                ? 'Pick at least one speaker'
                : `${perRecipient} USDC × ${selected.size} = $${totalUsd.toFixed(2)}`}
            </Text>
            <Pressable
              onPress={send}
              disabled={selected.size === 0}
              style={[
                styles.sendButton,
                {
                  backgroundColor: c.actionPrimary,
                  opacity: selected.size === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Octicons name="zap" size={13} color="white" />
              <Text style={styles.sendButtonText}>
                {selected.size > 1 ? 'Start tipping' : 'Send tip'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

TipSpeakersSheet.displayName = 'TipSpeakersSheet';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  grabberWrap: { alignItems: 'center', paddingTop: 8 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '600' },
  amountSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  presetsRow: { flexDirection: 'row', gap: 8 },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  presetText: { fontSize: 14, fontWeight: '600' },
  recipientsHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recipientName: { fontSize: 14, fontWeight: '600' },
  recipientHandle: { fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalText: { fontSize: 12, flex: 1 },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  sendButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
});

export { TipSpeakersSheet };
