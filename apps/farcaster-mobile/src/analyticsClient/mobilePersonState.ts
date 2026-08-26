import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { ApiOnboardingState } from 'farcaster-client-data';
import { Platform } from 'react-native';

import type {
  AnalyticsIdentity,
  TelemetryProperties,
} from '~/analyticsClient/types';

import { compactProperties } from './compactProperties';

type MobileAnalyticsPersonSyncTarget = {
  identify: (identity: AnalyticsIdentity) => void;
  setPersonProperties: (properties: TelemetryProperties) => void;
};

type MobileAnalyticsAppMetadata = {
  appVersion: string;
  version: string;
  updatesChannel: string;
  updatesCreatedAt: string;
  updatesId: string;
  updatesIsEmbeddedLaunch: boolean;
};

type MobileAnalyticsPersonStateInput = {
  address?: string;
  appMetadata: MobileAnalyticsAppMetadata;
  onboardingState: Pick<
    ApiOnboardingState,
    'email' | 'hasConfirmedEmail' | 'user'
  >;
};

function buildMobileAnalyticsAppMetadata(): MobileAnalyticsAppMetadata {
  const platformOS = Platform.OS;
  const version = `${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;
  const appVersion = `${version} (${platformOS})`;

  return {
    appVersion,
    version,
    updatesChannel: Updates.channel ?? '-',
    updatesCreatedAt: Updates.createdAt
      ? Updates.createdAt.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          timeZoneName: 'short',
        })
      : 'unknown',
    updatesId: Updates.updateId ?? '',
    updatesIsEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}

function buildMobileAnalyticsPersonProperties({
  address,
  appMetadata,
  onboardingState,
}: MobileAnalyticsPersonStateInput): TelemetryProperties {
  const user = onboardingState.user;
  const email = onboardingState.hasConfirmedEmail
    ? onboardingState.email
    : undefined;

  return compactProperties({
    fid: user?.fid,
    username: user?.username,
    app_version: appMetadata.appVersion,
    warpcast_version: appMetadata.version,
    updates_channel: appMetadata.updatesChannel,
    updates_created_at: appMetadata.updatesCreatedAt,
    updates_id: appMetadata.updatesId,
    updates_is_embedded_launch: appMetadata.updatesIsEmbeddedLaunch,
    ...(address ? { address } : {}),
    ...(email ? { email } : {}),
    ...(typeof user?.neynarScore === 'number'
      ? { neynar_score: user.neynarScore }
      : {}),
  });
}

function syncMobileAnalyticsPersonState({
  address,
  analytics,
  appMetadata = buildMobileAnalyticsAppMetadata(),
  identifyBeforeSet = true,
  onboardingState,
}: {
  address?: string;
  analytics: MobileAnalyticsPersonSyncTarget;
  appMetadata?: MobileAnalyticsAppMetadata;
  identifyBeforeSet?: boolean;
  onboardingState: Pick<
    ApiOnboardingState,
    'email' | 'hasConfirmedEmail' | 'user'
  >;
}) {
  const user = onboardingState.user;

  if (identifyBeforeSet && user?.fid) {
    analytics.identify({
      fid: user.fid,
      ...(user.username ? { username: user.username } : {}),
    });
  }

  analytics.setPersonProperties(
    buildMobileAnalyticsPersonProperties({
      address,
      appMetadata,
      onboardingState,
    }),
  );
}

export {
  buildMobileAnalyticsAppMetadata,
  buildMobileAnalyticsPersonProperties,
  syncMobileAnalyticsPersonState,
};
export type {
  MobileAnalyticsAppMetadata,
  MobileAnalyticsPersonStateInput,
  MobileAnalyticsPersonSyncTarget,
};
