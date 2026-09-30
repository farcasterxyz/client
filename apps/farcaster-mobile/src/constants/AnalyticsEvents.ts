/*
 * All analytics event names live in
 * packages/farcaster-analytics/src/events/AnalyticsEvents.ts.
 *
 * This module exists to host the platform-local `AnalyticsEvents` /
 * `AnalyticsEventData` type aliases used by the mobile AnalyticsProvider.
 */
import { AnalyticsEvent } from 'farcaster-analytics';

type AnalyticsEvents = AnalyticsEvent;

type AnalyticsEventData = Record<string, unknown> | undefined;

export { AnalyticsEventData, AnalyticsEvents };
