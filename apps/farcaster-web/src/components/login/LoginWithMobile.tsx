import { AnalyticsEvent } from 'farcaster-analytics';
import {
  buildSyncChannelLoginFailureAnalytics,
  classifySyncChannelLoginError,
  SYNC_CHANNEL_HANDSHAKE_MAX_MS,
  SYNC_CHANNEL_HANDSHAKE_TIMEOUT_MESSAGE,
  SyncChannelLoginCheckpoint,
  useFarcasterApiClient,
  useMarkSyncChannelMessageRead,
  withSyncChannelTimeout,
} from 'farcaster-client-hooks';
import {
  confirmKeyAgreement,
  createSyncChannel,
  getKeyTransport,
} from 'farcaster-cryptography';
import {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DebugLogger } from '~/components/debug/DebugLogger';
import { LoginError } from '~/components/login/LoginError';
import { LoginQRCodeWithInstructions } from '~/components/login/LoginQRCodeWithInstructions';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuth } from '~/contexts/AuthProvider';
import { useStandaloneMode } from '~/contexts/StandaloneModeProvider';
import { useDecryptAuthToken } from '~/hooks/data/syncChannel/useDecryptAuthToken';
import { usePollForLatestSyncChannelMessage } from '~/hooks/data/syncChannel/usePollForLatestSyncChannelMessage';
import { useCancelOnUnmountRef } from '~/hooks/useCancelOnUnmountedRef';
import { dataStore, keyStore } from '~/utils/cryptographyUtils';
import { logError } from '~/utils/logUtils';
import { createUUID } from '~/utils/uuidUtils';

const isSyncChannelSender = false;

const syncChannelHandshakeErrorMessage =
  'We were unable to establish a sync channel';

const syncDevicesErrorMessage = 'We were unable to sync your devices';

type LoginWithMobileProps = {
  onClose: () => void;
};

const LoginWithMobile: FC<LoginWithMobileProps> = memo(({ onClose }) => {
  const [key, setKey] = useState(Date.now().toString());

  const restart = useCallback(() => {
    setKey(Date.now().toString());
  }, []);

  return (
    <LoginWithMobileContent key={key} onClose={onClose} restart={restart} />
  );
});

LoginWithMobile.displayName = 'LoginWithMobile';

type LoginWithMobileContentProps = {
  onClose: () => void;
  restart: () => void;
};

const LoginWithMobileContent: FC<LoginWithMobileContentProps> = memo(
  ({ onClose, restart }) => {
    const { trackEvent, dangerouslyTrackPreAuthEvent } = useAnalytics();
    const { inStandaloneMode } = useStandaloneMode();
    const { apiClient } = useFarcasterApiClient();

    const platform = inStandaloneMode ? 'pwa' : 'web';

    const hasStartedCreatingSyncChannelRef = useRef(false);

    const channelId = useRef(createUUID()).current;

    const pollForLatestSyncChannelMessage =
      usePollForLatestSyncChannelMessage();
    const markSyncChannelMessageRead = useMarkSyncChannelMessageRead();
    const decryptAuthToken = useDecryptAuthToken();
    const { signIn } = useAuth();

    const cancelControllerRef = useCancelOnUnmountRef();

    const [error, setError] = useState<string>();
    const [attemptingLogin, setAttemptingLogin] = useState<boolean>(false);

    const startedAtMsRef = useRef<number | undefined>(undefined);

    const reportSyncChannelFailureToPostHog = useCallback(
      (
        failureError: unknown,
        phase: 'handshake' | 'auth',
        lastCheckpoint: SyncChannelLoginCheckpoint | undefined,
      ) => {
        dangerouslyTrackPreAuthEvent(
          AnalyticsEvent.LoginWithMobileSyncChannelFailed,
          buildSyncChannelLoginFailureAnalytics({
            channelId,
            error: failureError,
            phase,
            platform,
            loginType: 'web',
            isSyncChannelSender,
            startedAtMs: startedAtMsRef.current,
            lastCheckpoint,
          }),
        );
      },
      [channelId, dangerouslyTrackPreAuthEvent, platform],
    );

    const createChannelAndPollForAuthToken = useCallback(async () => {
      let lastCheckpoint: SyncChannelLoginCheckpoint | undefined;
      try {
        if (hasStartedCreatingSyncChannelRef.current) {
          return;
        }

        hasStartedCreatingSyncChannelRef.current = true;
        setError(undefined);

        startedAtMsRef.current = Date.now();

        const transport = await getKeyTransport({ keyStore, dataStore });
        await transport.resetKeyTransport();

        await withSyncChannelTimeout(
          (async () => {
            lastCheckpoint = 'create_sync_channel_started';
            const agreement = await createSyncChannel({
              cancelController: cancelControllerRef.current,
              farcasterApiClient: apiClient,
              keyStore,
              dataStore,
              sender: isSyncChannelSender,
              syncChannelIdentifier: channelId,
            });

            lastCheckpoint = 'confirm_key_agreement_started';
            await confirmKeyAgreement({
              agreement,
              farcasterApiClient: apiClient,
              keyStore,
              dataStore,
              cancelController: cancelControllerRef.current,
              syncChannelIdentifier: channelId,
              sender: isSyncChannelSender,
            });
          })(),
          SYNC_CHANNEL_HANDSHAKE_MAX_MS,
          SYNC_CHANNEL_HANDSHAKE_TIMEOUT_MESSAGE,
          cancelControllerRef.current,
        );

        lastCheckpoint = 'poll_for_message_started';
        const message = await pollForLatestSyncChannelMessage({
          cancelControllerRef,
          channelId,
        });

        // Poll only returns undefined when cancellation is requested; timeouts
        // throw and are handled in the catch block below. Return before
        // `setAttemptingLogin` to avoid a state update after unmount.
        if (!message) {
          return;
        }

        setAttemptingLogin(true);

        await markSyncChannelMessageRead(
          await transport.generateSetMessageReadParams(
            channelId,
            message.messageHash,
          ),
        );

        const { authToken } = await decryptAuthToken({
          channelId,
          message,
          transport: transport!,
        });

        await signIn({ authToken });

        trackEvent(AnalyticsEvent.LoggedInToWebUsingCompanion, {});
        setTimeout(() => window.location.reload(), 500);
      } catch (failureError) {
        const { kind } = classifySyncChannelLoginError(failureError);

        if (kind === 'cancelled') {
          return;
        }

        const phase = kind === 'auth_poll_timeout' ? 'auth' : 'handshake';

        logError(failureError);
        reportSyncChannelFailureToPostHog(failureError, phase, lastCheckpoint);
        setError(
          phase === 'auth'
            ? syncDevicesErrorMessage
            : syncChannelHandshakeErrorMessage,
        );
      }
    }, [
      apiClient,
      cancelControllerRef,
      channelId,
      decryptAuthToken,
      markSyncChannelMessageRead,
      pollForLatestSyncChannelMessage,
      reportSyncChannelFailureToPostHog,
      signIn,
      trackEvent,
    ]);

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewLoginWithMobileScreen, undefined);
    }, [trackEvent]);

    const body = useMemo(() => {
      if (error) {
        return <LoginError message={error} restart={restart} />;
      }

      return (
        <LoginQRCodeWithInstructions
          channelId={channelId}
          onClose={onClose}
          attemptingLogin={attemptingLogin}
        />
      );
    }, [attemptingLogin, channelId, error, onClose, restart]);

    useEffect(() => {
      createChannelAndPollForAuthToken();
    }, [createChannelAndPollForAuthToken]);

    return (
      <div className="min-h-[264px] w-full">
        <DebugLogger
          name="Sign In With Mobile"
          data={{
            channelId,
          }}
        />
        {body}
      </div>
    );
  },
);

LoginWithMobileContent.displayName = 'LoginWithMobileContent';

export { LoginWithMobile };
