import { TelemetryProperties } from './types';

function compactProperties(properties: TelemetryProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );
}

export { compactProperties };
