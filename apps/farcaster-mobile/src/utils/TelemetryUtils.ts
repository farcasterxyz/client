import { DdRum, RumActionType } from '@datadog/mobile-react-native';

enum TelemetryActionType {
  SCREEN_LOAD = 'screen_load',
}

// Define the structure of the context for each action for consistency.
const context = {
  screen_load: {
    measures: {
      timeToFCP: 0,
      timeToLCP: 0,
    },
  },
};

const contextForAction = (actionType: TelemetryActionType) => {
  return context[actionType];
};

const Datadog = {
  logScreenTimeToFirstContentfulPaint: (timeToFCP: number) => {
    const screenLoadContext = contextForAction(TelemetryActionType.SCREEN_LOAD);
    DdRum.addAction(RumActionType.CUSTOM, TelemetryActionType.SCREEN_LOAD, {
      ...screenLoadContext,
      measures: {
        ...screenLoadContext.measures,
        timeToFCP: timeToFCP,
      },
    });
  },

  logScreenTimeToLastContentfulPaint: (timeToLCP: number) => {
    const screenLoadContext = contextForAction(TelemetryActionType.SCREEN_LOAD);
    DdRum.addAction(RumActionType.CUSTOM, TelemetryActionType.SCREEN_LOAD, {
      ...screenLoadContext,
      measures: {
        ...screenLoadContext.measures,
        timeToLCP: timeToLCP,
      },
    });
  },
};

export { Datadog };
