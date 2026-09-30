import { ApiUser } from 'farcaster-client-data';
import { Check, X, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { toast } from '~/utils/toast';

const PRESETS_USDC = [1, 5, 20];
const USDC_CONTRACT_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const USDC_DECIMALS = 6;

type Speaker = {
  user: ApiUser;
  role: 'host' | 'cohost' | 'speaker';
};

/**
 * Multi-select USDC tip sheet. Opens from the "Tip" CTA next to the speakers
 * grid. Lists every speaker with a checkbox; user picks who to tip + amount.
 *
 * Default selection: all speakers (the common case is "tip the room").
 *
 * Sends USDC on Base via the embedded wallet bridge, sequentially per
 * recipient. Stops the batch if the user cancels any single transfer.
 */
const TipSpeakersSheet: React.FC<{
  open: boolean;
  speakers: Speaker[];
  onClose: () => void;
}> = React.memo(({ open, speakers, onClose }) => {
  const allFids = useMemo(() => speakers.map((s) => s.user.fid), [speakers]);
  const [selected, setSelected] = useState<Set<number>>(new Set(allFids));
  const [perRecipient, setPerRecipient] = useState(5);
  const [isSending, setIsSending] = useState(false);
  const walletBridge = useOptionalEmbeddedWalletBridge();
  const { openWarpcastWallet: openFarcasterWallet } =
    useOpenableWarpcastWallet();

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setSelected(new Set(allFids));
      setPerRecipient(5);
    }
  }, [open, allFids]);

  // Escape to close
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  const send = useCallback(async () => {
    if (selected.size === 0) {
      return;
    }
    if (!walletBridge?.sendToken) {
      toast({ message: 'Wallet not available', type: 'error' });
      return;
    }
    const fids = [...selected];

    setIsSending(true);
    const amountRaw = BigInt(
      Math.round(perRecipient * Math.pow(10, USDC_DECIMALS)),
    ).toString();

    let sentCount = 0;
    for (const fid of fids) {
      try {
        openFarcasterWallet();
        const result = await walletBridge.sendToken({
          sendIntent: {
            chain: 'base',
            ca: USDC_CONTRACT_BASE,
            amount: amountRaw,
            recipientFid: fid,
          },
        });
        if (result.success) {
          sentCount++;
        }
      } catch {
        // User cancelled or tx failed — stop the batch
        break;
      }
    }
    setIsSending(false);
    if (sentCount > 0) {
      toast({
        message: `Tipped ${sentCount} speaker${sentCount > 1 ? 's' : ''}`,
        type: 'success',
      });
    }
    onClose();
  }, [selected, perRecipient, walletBridge, openFarcasterWallet, onClose]);

  if (!open) {
    return null;
  }

  const totalUsd = perRecipient * selected.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[480px] flex-col rounded-t-2xl shadow-2xl bg-app"
        style={{ maxHeight: '82vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 border-faint">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-action-primary" />
            <div className="text-[15px] font-semibold text-default">
              Tip speakers
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-overlay-light"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount controls */}
        <div className="border-b px-4 py-3 border-faint">
          <div className="mb-1 text-[12px] font-medium text-faint">
            Amount per speaker (USDC)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS_USDC.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPerRecipient(p)}
                className={`rounded-lg py-2.5 text-[14px] font-semibold ${
                  perRecipient === p
                    ? 'text-white bg-action-primary'
                    : 'bg-overlay-faint text-default hover:bg-overlay-light'
                }`}
              >
                {p} USDC
              </button>
            ))}
          </div>
        </div>

        {/* Speakers list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            Recipients · {selected.size}/{allFids.length}
          </div>
          {speakers.map(({ user, role }) => {
            const isSelected = selected.has(user.fid);
            const roleLabel =
              role === 'host'
                ? 'Host'
                : role === 'cohost'
                  ? 'Co-host'
                  : 'Speaker';
            return (
              <button
                key={user.fid}
                type="button"
                onClick={() => toggle(user.fid)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-overlay-faint"
              >
                <Avatar user={user} size="sm" disabled />
                <div className="min-w-0 flex-1">
                  <SpaceUserDisplayNameWithProBadge
                    user={user}
                    badgeSize={13}
                    className="text-[14px] font-semibold text-default"
                  />
                  <div className="truncate text-[12px] text-faint">
                    @{user.username} · {roleLabel}
                  </div>
                </div>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? 'border-action-primary text-white bg-action-primary'
                      : 'border-faint'
                  }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t px-4 py-3 border-faint">
          <div className="text-[12px] text-faint">
            {selected.size === 0
              ? 'Pick at least one speaker'
              : `${perRecipient} USDC x ${selected.size} = $${totalUsd.toFixed(2)} total`}
          </div>
          <button
            type="button"
            onClick={send}
            disabled={selected.size === 0 || isSending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-40"
          >
            <Zap size={13} />
            {isSending ? 'Sending...' : 'Send tips'}
          </button>
        </div>
      </div>
    </div>
  );
});

TipSpeakersSheet.displayName = 'TipSpeakersSheet';

export { TipSpeakersSheet };
