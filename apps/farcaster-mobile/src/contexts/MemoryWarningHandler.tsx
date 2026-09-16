import * as Device from 'expo-device';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { AppState, Platform } from 'react-native';

import { analyticsClient } from '~/analyticsClient';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

const IMAGE_MEMORY_CACHE_MAX_COST_BYTES = 100 * 1024 * 1024;
const IMAGE_MEMORY_CACHE_MAX_COUNT = 150;

// Low-RAM devices (≤4GB, e.g. 3GB iPhone XR / 4GB iPhone 11 Pro Max) hit iOS
// memory warnings and jetsam terminations far sooner than flagships, so we
// halve expo-image's in-memory cache cost/count there to lower the ceiling.
// Device.totalMemory is iOS physicalMemory in bytes (reports ~3.7GiB on a
// "4GB" device and ~5.5GiB+ on 6GB), so a 4GiB cutoff cleanly separates the
// low-RAM population from flagships.
const LOW_MEMORY_DEVICE_MAX_TOTAL_BYTES = 4 * 1024 * 1024 * 1024;
const IMAGE_MEMORY_CACHE_MAX_COST_BYTES_LOW_MEMORY = 50 * 1024 * 1024;
const IMAGE_MEMORY_CACHE_MAX_COUNT_LOW_MEMORY = 75;

// Reads the Hermes JS heap inline. The shared analyticsClient envelope
// also samples on every capture, so general events already carry a
// jsHeapUsedMB. This local read is reserved for the memory-warning case
// where we want the value at the *moment of warning*, before the image
// cache is cleared.
function readJsHeapUsedMBBeforeRelief(): number | undefined {
  const hermes = (
    globalThis as {
      HermesInternal?: {
        getInstrumentedStats?: () => { js_allocatedBytes?: number };
      };
    }
  ).HermesInternal;
  const bytes = hermes?.getInstrumentedStats?.().js_allocatedBytes;
  return typeof bytes === 'number' ? Math.round(bytes / 1_048_576) : undefined;
}

// iOS: bounds expo-image's in-memory SDImageCache via Image.configureCache
// (LRU eviction at the cost cap) and clears it on UIApplication memory
// warnings.
// Android: Image.configureCache is a no-op (Glide has its own LRU), but
// AppState.memoryWarning fires from Activity.onTrimMemory and clearing the
// in-memory cache still helps relieve pressure.
function MemoryWarningHandler() {
  const { trackEvent } = useAnalytics();
  const mountedAtMsRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      const totalMemoryBytes = Device.totalMemory;
      const lowMemoryDevice =
        typeof totalMemoryBytes === 'number' &&
        totalMemoryBytes <= LOW_MEMORY_DEVICE_MAX_TOTAL_BYTES;

      const maxMemoryCost = lowMemoryDevice
        ? IMAGE_MEMORY_CACHE_MAX_COST_BYTES_LOW_MEMORY
        : IMAGE_MEMORY_CACHE_MAX_COST_BYTES;
      const maxMemoryCount = lowMemoryDevice
        ? IMAGE_MEMORY_CACHE_MAX_COUNT_LOW_MEMORY
        : IMAGE_MEMORY_CACHE_MAX_COUNT;

      Image.configureCache({ maxMemoryCost, maxMemoryCount });
      trackEvent(AnalyticsEvent.MobileImageCacheConfigured, {
        maxMemoryCostMb: Math.round(maxMemoryCost / (1024 * 1024)),
        maxMemoryCount,
        lowMemoryDevice,
        totalMemoryMb:
          typeof totalMemoryBytes === 'number'
            ? Math.round(totalMemoryBytes / (1024 * 1024))
            : undefined,
      });
    }

    const subscription = AppState.addEventListener('memoryWarning', () => {
      const jsHeapUsedMBBeforeRelief = readJsHeapUsedMBBeforeRelief();
      const elapsedMs = Date.now() - mountedAtMsRef.current;
      // Also push the warning through the NEYN-11329 analytics client so the
      // mobile telemetry pipeline (PostHog `mobile-telemetry-v1`) sees memory
      // pressure events alongside `mobile_memory_sample` / heap stats. The
      // legacy trackEvent path below continues to flow through PostHog under
      // the older AnalyticsEvent.MobileImageCacheCleared name.
      analyticsClient.captureTelemetry('mobile_memory_warning', {
        jsHeapUsedMBBeforeRelief,
        sessionElapsedMs: elapsedMs,
      });
      Image.clearMemoryCache()
        .then((success) => {
          trackEvent(AnalyticsEvent.MobileImageCacheCleared, {
            reason: 'os_memory_warning',
            success,
            sessionElapsedMs: elapsedMs,
            jsHeapUsedMBBeforeRelief,
          });
        })
        .catch(() => {
          trackEvent(AnalyticsEvent.MobileImageCacheCleared, {
            reason: 'os_memory_warning',
            success: false,
            sessionElapsedMs: elapsedMs,
            jsHeapUsedMBBeforeRelief,
          });
        });
    });
    return () => {
      subscription.remove();
    };
  }, [trackEvent]);

  return null;
}

export { MemoryWarningHandler };
