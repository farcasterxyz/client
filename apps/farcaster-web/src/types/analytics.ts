/*
 * All analytics event names live in
 * packages/farcaster-analytics/src/events/AnalyticsEvents.ts.
 *
 * This module exists to host the platform-local `AnalyticsEvents` /
 * `AnalyticsEventData` type aliases used by the web AnalyticsProvider.
 */
import { AnalyticsEvent } from 'farcaster-analytics';

export type AnalyticsEvents = AnalyticsEvent;

export type AnalyticsEventData =
  | Record<string, string | boolean | number | undefined>
  | undefined;
