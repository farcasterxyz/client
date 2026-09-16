import { AnalyticsEvent } from 'farcaster-analytics';
import {
  frameAnalyticsProperties,
  useFetchFrameDetails,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { LaunchContext, LaunchFrameParams, useRootToast } from 'farcaster-expo';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { logMiniAppLaunchPhase } from '~/components/MiniApp/miniAppLaunchTelemetry';
import { StandaloneLaunchMiniAppConfig } from '~/components/MiniApp/types';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { getDomainFromMiniAppLaunchConfig } from '~/utils/MiniAppUtils';

export const useLaunchFrame = () => {
  const toast = useRootToast();
  const { trackEvent, trackInternalEvent } = useTrackEvent();
  const { setOpenMiniApp, minimizedMiniApp } = useMinimizedMiniApp({
    optional: true,
  });

  const getLaunchConfig = useCallback(
    ({
      config,
      author,
      harmful,
    }: LaunchFrameParams): StandaloneLaunchMiniAppConfig => ({
      type: 'standalone',
      url: config.url ?? '',
      name: config.name,
      splashImageUrl: config.splashImageUrl,
      splashBackgroundColor: config.splashBackgroundColor,
      author,
      harmful,
      timestamp: Date.now(),
    }),
    [],
  );

  const openMiniApp = useCallback(
    (params: LaunchFrameParams) => {
      const { config, author, debug, context } = params;

      if (!config.url?.startsWith('https://') && !debug) {
        toast.show('Invalid mini app URL', {
          type: 'danger',
        });
        return;
      }

      const analyticsProperties = frameAnalyticsProperties({
        frameUrl: config.url ?? '',
        frameName: config.name,
        author,
      });

      trackEvent(AnalyticsEvent.LaunchFrame, {
        ...analyticsProperties,
        from:
          context.type === 'notification'
            ? 'notification'
            : context.type === 'cast_embed'
              ? 'cast'
              : 'home',
      });

      trackInternalEvent({
        type: 'frame-launch',
        data: {
          frameDomain: analyticsProperties.frameDomain,
          frameUrl: config.url ?? '',
          frameName: config.name,
          authorFid: analyticsProperties.authorFid,
        },
      });

      const launchConfig = getLaunchConfig(params);
      logMiniAppLaunchPhase({
        phase: 'tap (t0)',
        launchTimestamp: launchConfig.timestamp,
        domain: analyticsProperties.frameDomain,
      });
      setOpenMiniApp({
        launchConfig,
        debug,
        context,
      });
    },
    [setOpenMiniApp, trackEvent, trackInternalEvent, getLaunchConfig, toast],
  );

  const curFrameDomain = minimizedMiniApp?.domain ?? '';

  const fetchFrameDetails = useFetchFrameDetails();

  return useCallback(
    async (params: LaunchFrameParams) => {
      if (!minimizedMiniApp || params.skipConfirmation === true) {
        openMiniApp(params);
        params.onComplete?.();
        return;
      }

      const newDomain = getDomainFromMiniAppLaunchConfig(
        getLaunchConfig(params),
      );
      if (curFrameDomain === newDomain) {
        openMiniApp(params);
        params.onComplete?.();
        return;
      }

      const [curFrameName, newFrameName] = await Promise.all([
        (async () => {
          if (minimizedMiniApp?.name) {
            return minimizedMiniApp.name;
          }
          const details = await fetchFrameDetails({ domain: curFrameDomain });
          return details?.name ?? curFrameDomain;
        })(),
        (async () => {
          const details = await fetchFrameDetails({ domain: newDomain });
          return details?.name ?? newDomain;
        })(),
      ]);

      Alert.alert(
        `Close ${curFrameName}?`,
        `You have ${curFrameName} open. ` +
          `Would you like to close it and open ${newFrameName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Close',
            style: 'destructive',
            onPress: () => {
              openMiniApp(params);
              params.onComplete?.();
            },
          },
        ],
      );
    },
    [
      minimizedMiniApp,
      getLaunchConfig,
      curFrameDomain,
      openMiniApp,
      fetchFrameDetails,
    ],
  );
};

export type { LaunchContext };
