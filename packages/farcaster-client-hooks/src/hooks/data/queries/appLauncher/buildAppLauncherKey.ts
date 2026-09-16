import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAppLauncherKey = ({
  viewerFid,
  weightRecency,
  weightFrequency,
  weightInstalled,
}: {
  viewerFid?: number;
  weightRecency?: number;
  weightFrequency?: number;
  weightInstalled?: number;
}) =>
  compactQueryKey([
    'appLauncher',
    viewerFid,
    weightRecency,
    weightFrequency,
    weightInstalled,
  ]);

export { buildAppLauncherKey };
