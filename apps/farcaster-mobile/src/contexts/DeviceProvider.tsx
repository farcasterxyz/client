import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import { v4 } from 'uuid';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { deviceStorageKey } from '~/constants/Storage';
import { trackError } from '~/utils/ErrorUtils';
import { getDeviceId, setDeviceId } from '~/utils/FastStorageUtils';

import { type RawDurableRead, resolveDeviceId } from './deviceIdResolution';

type Device = {
  deviceId: string;
};

type DeviceContext = {
  device: {
    deviceId: string;
  };
};

const DeviceContext = createContext<DeviceContext>({
  device: {
    deviceId: '',
  },
});

const buildAndSaveDevice = (): Device => {
  const device = {
    deviceId: v4(),
  };

  // Persist to BOTH stores so the MMKV fast path and the durable AsyncStorage
  // fallback never disagree about the device identity. The durable write is
  // OBSERVED rather than fire-and-forget via StorageUtils.setItem (which swallows
  // write errors): if it silently fails, MMKV holds the id this launch, but a
  // later MMKV cache-bust would read empty and re-mint — re-opening NEYN-12085.
  // Flag a failed write so it's a visible signal, not a latent future churn.
  setDeviceId({ deviceId: device.deviceId });
  void AsyncStorage.setItem(deviceStorageKey, JSON.stringify(device)).catch(
    (error) => {
      trackError(error);
      DdRum.addAction(RumActionType.CUSTOM, 'device-id-durable-write-failed');
    },
  );

  return device;
};

// Durable read wrapped into a RawDurableRead. AsyncStorage is read directly (not
// via StorageUtils.getItem, which swallows read errors and returns its fallback,
// masking a failure as "empty"); a thrown read becomes { threw: true } so the
// resolver retries instead of minting off a failed read (NEYN-12085).
const readDurableDevice = async (): Promise<RawDurableRead> => {
  try {
    return { threw: false, raw: await AsyncStorage.getItem(deviceStorageKey) };
  } catch (error) {
    trackError(error);
    return { threw: true };
  }
};

type DeviceProviderProps = {
  children: ReactNode;
};

const DeviceProvider: FC<DeviceProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'DeviceProvider',
  });
  const [device, setDevice] = useState<Device>();

  useLayoutEffect(() => {
    let cancelled = false;

    (async () => {
      DdRum.startAction(RumActionType.CUSTOM, 'load_device_from_storage', {
        name: deviceStorageKey,
      });

      try {
        const deviceId = await resolveDeviceId({
          readFastId: getDeviceId,
          readDurable: readDurableDevice,
          mintAndPersist: () => buildAndSaveDevice().deviceId,
          backfillFastId: (id) => setDeviceId({ deviceId: id }),
          sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
          trackError,
          onDurableReadFailed: () =>
            DdRum.addAction(
              RumActionType.CUSTOM,
              'device-id-durable-read-failed',
            ),
          onCorruptRecord: () =>
            DdRum.addAction(RumActionType.CUSTOM, 'device-id-corrupt-record'),
          isCancelled: () => cancelled,
        });

        if (!cancelled && deviceId) setDevice({ deviceId });
      } catch (error) {
        // resolveDeviceId shouldn't reject (its deps swallow their own I/O errors),
        // but if a dependency throws unexpectedly, don't leave the app stuck on the
        // loading indicator — mint a last-resort id and flag it.
        trackError(error);
        DdRum.addAction(RumActionType.CUSTOM, 'device-id-resolve-failed');
        if (!cancelled) setDevice(buildAndSaveDevice());
      } finally {
        // Always close the RUM action, including on cancellation returns.
        DdRum.stopAction(RumActionType.CUSTOM, 'load_device_from_storage', {
          name: deviceStorageKey,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!device) {
    return <FullScreenLoadingIndicator debugName="DeviceProvider" />;
  }

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'DeviceProvider',
  });

  return (
    <DeviceContext.Provider value={{ device }}>
      {children}
    </DeviceContext.Provider>
  );
});

DeviceProvider.displayName = 'DeviceProvider';

const useDeviceId = () => useContext(DeviceContext);

export { DeviceProvider, useDeviceId };
