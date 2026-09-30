import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import {
  AudioSpaceCommonContext,
  AudioSpaceEventName,
  shouldEmitAudioSpaceEvent,
} from 'farcaster-client-hooks';

import { analyticsClient } from '~/analyticsClient';

type AudioSpaceEventProperties = Record<
  string,
  string | number | boolean | undefined
>;
type AudioSpacePerfProperties = Record<
  string,
  string | number | boolean | undefined
>;

type TrackMobileAudioSpaceEventInput = {
  eventName: AudioSpaceEventName;
  context: AudioSpaceCommonContext;
  properties?: AudioSpaceEventProperties;
  dedupeMap?: Map<string, number>;
  dedupeKey?: string;
  dedupeWindowMs?: number;
  addRumAction?: boolean;
};

function trackMobileAudioSpaceEvent({
  eventName,
  context,
  properties,
  dedupeMap,
  dedupeKey,
  dedupeWindowMs = 1500,
  addRumAction = false,
}: TrackMobileAudioSpaceEventInput) {
  if (
    dedupeMap &&
    dedupeKey &&
    !shouldEmitAudioSpaceEvent(dedupeMap, dedupeKey, dedupeWindowMs)
  ) {
    return;
  }

  const mergedProps = {
    ...context,
    ...(properties ?? {}),
    warpcastPlatform: 'mobile',
  };

  analyticsClient.capture(eventName, mergedProps);

  if (addRumAction) {
    DdRum.addAction(RumActionType.CUSTOM, eventName, mergedProps);
  }
}

function captureMobileAudioSpacePerfMetric({
  metricName,
  properties,
}: {
  metricName: string;
  properties?: AudioSpacePerfProperties;
}) {
  analyticsClient.captureTelemetry(metricName, {
    ...(properties ?? {}),
    warpcastPlatform: 'mobile',
  });
}

export { captureMobileAudioSpacePerfMetric, trackMobileAudioSpaceEvent };
