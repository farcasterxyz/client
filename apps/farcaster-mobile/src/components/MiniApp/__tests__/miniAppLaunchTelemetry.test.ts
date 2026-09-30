import { DdRum, RumActionType } from '@datadog/mobile-react-native';

import {
  createLaunchMilestoneGuard,
  MINI_APP_LAUNCH_ACTION,
  recordMiniAppLaunchMilestone,
  shouldFireLaunchMilestone,
} from '../miniAppLaunchTelemetry';

jest.mock('@datadog/mobile-react-native', () => ({
  DdRum: { addAction: jest.fn() },
  RumActionType: { CUSTOM: 'custom' },
}));

const addAction = DdRum.addAction as jest.Mock;

describe('shouldFireLaunchMilestone', () => {
  it('fires a milestone exactly once for a given launch timestamp', () => {
    const guard = createLaunchMilestoneGuard();

    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_start')).toBe(
      true,
    );
    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_start')).toBe(
      false,
    );
  });

  it('fires distinct milestones independently within the same launch', () => {
    const guard = createLaunchMilestoneGuard();

    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_start')).toBe(
      true,
    );
    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_end')).toBe(
      true,
    );
    // ...but each still only once
    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_end')).toBe(
      false,
    );
  });

  it('re-arms every milestone when the launch timestamp changes (relaunch)', () => {
    const guard = createLaunchMilestoneGuard();

    shouldFireLaunchMilestone(guard, 1000, 'webview_load_start');
    shouldFireLaunchMilestone(guard, 1000, 'webview_load_end');
    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_end')).toBe(
      false,
    );

    // A new launch (same reused component, new timestamp) re-arms the marks.
    expect(shouldFireLaunchMilestone(guard, 2000, 'webview_load_start')).toBe(
      true,
    );
    expect(shouldFireLaunchMilestone(guard, 2000, 'webview_load_end')).toBe(
      true,
    );
  });

  it('treats the terminal error branch like any other once-per-launch mark', () => {
    const guard = createLaunchMilestoneGuard();

    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_error')).toBe(
      true,
    );
    expect(shouldFireLaunchMilestone(guard, 1000, 'webview_load_error')).toBe(
      false,
    );
    expect(shouldFireLaunchMilestone(guard, 2000, 'webview_load_error')).toBe(
      true,
    );
  });
});

describe('recordMiniAppLaunchMilestone', () => {
  afterEach(() => {
    addAction.mockClear();
    jest.restoreAllMocks();
  });

  it('records a CUSTOM action with the launch payload and elapsed time', () => {
    jest.spyOn(Date, 'now').mockReturnValue(5000);

    recordMiniAppLaunchMilestone({
      milestone: 'ready',
      launchTimestamp: 1200,
      domain: 'example.com',
    });

    expect(addAction).toHaveBeenCalledTimes(1);
    expect(addAction).toHaveBeenCalledWith(
      RumActionType.CUSTOM,
      MINI_APP_LAUNCH_ACTION,
      {
        milestone: 'ready',
        domain: 'example.com',
        sinceLaunchMs: 3800,
      },
    );
  });
});
