// INCIDENT-RELATED TEMPORARY CODE — no-custody-wallet restore prompt.
// For users left without their Farcaster account recovery phrase on device
// (e.g. signed in via email). Safe to remove once that cohort ages out
// (~6-8 months). Grep "INCIDENT-RELATED TEMPORARY CODE" for related code.
import { useCachedOnboardingState } from 'farcaster-client-hooks';
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { setPendingWalletRestore } from '~/utils/pendingWalletRestore';

const RESTORE_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
// Wait this long after detecting a missing seed before the cold-start prompt
// fires, so the normal boot wallet-load window doesn't false-fire.
const RESTORE_PROMPT_COLD_START_SETTLE_MS = 4000;
const RESTORE_PROMPT_LAST_SHOWN_KEY = 'noSeedPhraseRestorePrompt.lastShownAt';

type NoSeedPhrasePromptContextValue = {
  // Show the restore prompt in response to a user action that needs the custody
  // seed to sign (wallet / swap / mini-app). Ignores the cold-start cooldown.
  promptRestoreWallet: () => void;
};

const NoSeedPhrasePromptContext = createContext<NoSeedPhrasePromptContextValue>(
  {
    promptRestoreWallet: () => undefined,
  },
);

export const useNoSeedPhrasePrompt = () =>
  useContext(NoSeedPhrasePromptContext);

export const NoSeedPhrasePromptProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isSignedIn = useIsSignedIn();
  const { account: custodyAccount } = useWallet();
  const missingSeed = isSignedIn && !custodyAccount;

  const [isOpen, setIsOpen] = useState(false);
  const [lastShownAtRaw, setLastShownAtRaw] = useMMKVString(
    RESTORE_PROMPT_LAST_SHOWN_KEY,
  );

  const promptRestoreWallet = useCallback(() => {
    if (missingSeed) {
      setIsOpen(true);
    }
  }, [missingSeed]);

  // Cold start: the provider mounts once per cold launch (warm resume does not
  // remount it), so this fires at most once per launch — throttled to 24h.
  const didColdStartCheck = useRef(false);
  useEffect(() => {
    if (didColdStartCheck.current || !missingSeed) {
      return;
    }
    const timer = setTimeout(() => {
      didColdStartCheck.current = true;
      const lastShownAt = lastShownAtRaw ? Number(lastShownAtRaw) : 0;
      if (Date.now() - lastShownAt > RESTORE_PROMPT_COOLDOWN_MS) {
        setIsOpen(true);
      }
    }, RESTORE_PROMPT_COLD_START_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [missingSeed, lastShownAtRaw]);

  // Close if the seed comes back (recovered) or the user signs out.
  useEffect(() => {
    if (!missingSeed) {
      setIsOpen(false);
    }
  }, [missingSeed]);

  const onSnooze = useCallback(() => {
    setLastShownAtRaw(String(Date.now()));
    setIsOpen(false);
  }, [setLastShownAtRaw]);

  const value = useMemo(() => ({ promptRestoreWallet }), [promptRestoreWallet]);

  return (
    <NoSeedPhrasePromptContext.Provider value={value}>
      {children}
      {isOpen && missingSeed ? (
        <RestoreWalletSheet onSnooze={onSnooze} />
      ) : null}
    </NoSeedPhrasePromptContext.Provider>
  );
};

const RestoreWalletSheet: FC<{ onSnooze: () => void }> = ({ onSnooze }) => {
  const t = useTheme();
  const { signOut } = useAuthToken();
  const {
    result: { state },
  } = useCachedOnboardingState();
  const email = state.hasConfirmedEmail ? state.email : undefined;

  const [step, setStep] = useState<'explain' | 'choose'>('explain');
  const actingRef = useRef(false);

  const restore = useCallback(
    async (hasPhrase: boolean) => {
      if (actingRef.current) {
        return;
      }
      actingRef.current = true;
      // Stash the destination; the unauthed stack navigates to it on mount.
      // signOut() swaps the nav tree + resets to its initial route, so we
      // can't navigate synchronously here.
      setPendingWalletRestore({
        route: hasPhrase ? 'OnboardingImportWallet' : 'RecoveryInitiate',
        email,
      });
      await signOut({ reason: 'user_initiated' });
    },
    [signOut, email],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="no-seed-phrase-restore-sheet"
      onDismiss={onSnooze}
      // Render above modal-presentation screens (e.g. the swap screen's
      // "Preparing wallet…" state) instead of behind them.
      displayedInModalPresentationScreen
    >
      <View style={{ gap: 12 }}>
        {step === 'explain' ? (
          <>
            <Text2 weight="semibold" size="xl">
              Your Farcaster account recovery phrase isn&apos;t on this device
            </Text2>
            <Text2 color="primary">
              Signing in with email doesn&apos;t restore your Farcaster account
              recovery phrase on this device, so you can&apos;t transact with
              your Farcaster wallet or connect it to mini apps.
              {email ? `\n\nYou signed up with ${email}.` : ''}
            </Text2>
            <View style={[t.pT3, t.flexRow]}>
              <ButtonV2
                variant="primary"
                title="Restore recovery phrase"
                onPress={() => setStep('choose')}
                width="flex1"
              />
            </View>
          </>
        ) : (
          <>
            <Text2 weight="semibold" size="xl">
              Do you have your Farcaster account recovery phrase?
            </Text2>
            <Text2 color="primary">
              You&apos;ll be signed out so you can restore your Farcaster
              account — sign back in with your Farcaster account recovery
              phrase, or start account recovery.
              {email ? `\n\nYou signed up with ${email}.` : ''}
            </Text2>
            <View style={{ gap: 8, paddingTop: 12 }}>
              <View style={[t.flexRow]}>
                <ButtonV2
                  variant="primary"
                  title="I have my recovery phrase"
                  onPress={() => restore(true)}
                  width="flex1"
                />
              </View>
              <View style={[t.flexRow]}>
                <ButtonV2
                  variant="secondary"
                  title="Start account recovery"
                  onPress={() => restore(false)}
                  width="flex1"
                />
              </View>
              <View style={[t.flexRow]}>
                <ButtonV2
                  variant="secondary"
                  title="Cancel"
                  onPress={onSnooze}
                  width="flex1"
                />
              </View>
            </View>
          </>
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};
