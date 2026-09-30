import { AnalyticsEvent } from 'farcaster-analytics';
import * as React from 'react';

import { logInDevOnly } from '../utils/LogUtils';

type SharedTelemetryContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackError: (error: any, context?: Record<string, unknown>) => void;
  trackEvent: (
    type: AnalyticsEvent,
    properties?: Record<string, unknown>,
  ) => void;
  addRumAction: (
    name: string,
    context?: object,
    time?: number | undefined,
  ) => void;
  startRumAction: (name: string, context?: object) => void;
  stopRumAction: (name: string, context?: object) => void;
};

const SharedTelemetryContext = React.createContext<
  SharedTelemetryContextType | undefined
>(undefined);

function useSharedTelemetry() {
  const context = React.useContext(SharedTelemetryContext);
  if (!context) {
    throw new Error(
      'useSharedTelemetryContext requires SharedTelemetryContext',
    );
  }
  return context;
}

type Context = object;

/**
 * Record timings for actions with multiple steps that are easy to visualize
 * in DataDog.
 *
 * DataDog's addActions doesn't work with nested addActions (at least on iOS),
 * this timer works around that by tracking state internally and then
 * synchronously firing the start and stop with explicit timestamps.
 */
export function useStepTracker() {
  const { trackError, addRumAction } = useSharedTelemetry();

  return React.useCallback(
    (
      label: string,
      rootContext: Record<string, string | number | undefined> = {},
    ) => {
      const start = Date.now();
      const timings: Record<string, number> = {};

      let baseContext = {
        multi_step_execution: label,
        ...rootContext,
      };

      let lastStep: string | undefined = undefined;
      let lastTime = start;
      let lastTrackedError: Error | undefined = undefined;

      const recordLastStep = (time = Date.now()) => {
        if (lastStep) {
          timings[lastStep] = time - lastTime;

          logInDevOnly('[stepTracker] recording step', label, lastStep, {
            ...baseContext,
            step: lastStep,
            timing: time - lastTime,
          });

          addRumAction(`multi_step_execution_step`, {
            ...baseContext,
            step: lastStep,
            timing: time - lastTime,
          });
        }
      };

      const recordStop = (context: Context = {}, time = Date.now()) => {
        logInDevOnly('[stepTracker] recording stop', label);
        addRumAction(
          'multi_step_execution',
          {
            ...baseContext,
            ...context,
            timing: time - start,
            timings,
          },
          start,
        );
      };

      return {
        start,
        addContext(additionalContext: Record<string, unknown>) {
          baseContext = {
            ...baseContext,
            ...additionalContext,
          };
        },
        recordStep(step: string) {
          const time = Date.now();
          recordLastStep(time);
          lastStep = step;
          lastTime = time;
        },
        recordStepError(err: unknown, context: Context = {}) {
          if (lastStep) {
            const error =
              err instanceof Error
                ? err
                : new Error(`Unknown error in ${label}.${lastStep}`);

            logInDevOnly(
              '[stepTracker] recording step error',
              label,
              lastStep,
              error,
            );

            trackError(error, {
              ...baseContext,
              ...context,
              step: lastStep,
            });

            lastTrackedError = error;
          }
        },
        stop(context: Context = {}) {
          recordLastStep();
          recordStop({
            ...context,
            execution_result: 'success',
          });
        },
        fail(error: Error, context: Context = {}) {
          if (error !== lastTrackedError) {
            logInDevOnly('[stepTracker] tracking stop error', label, error);
            trackError(error, {
              ...baseContext,
              ...context,
              step: lastStep,
            });
          }

          logInDevOnly('[stepTracker] recording stop with error', label, error);
          recordStop({
            ...context,
            execution_result: 'failure',
            error_name: error.name,
            error_msg: error.message,
            err_step: lastStep,
          });
        },
      };
    },
    [addRumAction, trackError],
  );
}

export type CreateStepTracker = ReturnType<typeof useStepTracker>;

export { SharedTelemetryContext, useSharedTelemetry };

[
  {
    account: {
      address: '0x41758c1834A6ddEb55e48E0dF8C45CfE13e9e13D',
      type: 'json-rpc',
    },
    chain: {
      blockExplorers: [Object],
      blockTime: 2000,
      contracts: [Object],
      experimental_preconfirmationTime: 200,
      fees: undefined,
      formatters: [Object],
      id: 8453,
      name: 'Base',
      nativeCurrency: [Object],
      rpcUrls: [Object],
      serializers: [Object],
      sourceId: 1,
    },
    data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000414fc5cba7f362a6475defce4132eecd378c03fd8d77eb96634c58097aee7686f5293070cd72bff67fce3669d6793453ba7cb92f8b08594626e33ad0f374b697c71b',
    gas: undefined,
    maxFeePerGas: 14254380n,
    maxPriorityFeePerGas: 1000000n,
    nonce: 419,
    to: '0x3b3cd21242ba44e9865b066e5ef5d1cc1030cc58',
    type: 'eip1559',
    value: 0n,
  },
  {
    account: {
      address: '0x41758c1834A6ddEb55e48E0dF8C45CfE13e9e13D',
      type: 'json-rpc',
    },
    chain: {
      blockExplorers: [Object],
      blockTime: 2000,
      contracts: [Object],
      experimental_preconfirmationTime: 200,
      fees: undefined,
      formatters: [Object],
      id: 8453,
      name: 'Base',
      nativeCurrency: [Object],
      rpcUrls: [Object],
      serializers: [Object],
      sourceId: 1,
    },
    data: '0x1fff991f00000000000000000000000041758c1834a6ddeb55e48e0df8c45cfe13e9e13d000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000063ca00000000000000000000000000000000000000000000000000000000000000a0e3a48b974fed86882bb06b3983528d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000c4103b48be000000000000000000000000f525ff21c370beb8d9f5c12dc0da2b583f4b949f0000000000000000000000004200000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000271000000000000000000000000088a43bbdf9d098eec7bceda4e2494615dfd9bb9c0000000000000000000000000000000000000000000000000000000000001e01000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012438c9c147000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000ad01c20d5886137e056775af56915de824c8fce500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffff22ce6ede000000000000000000000000f525ff21c370beb8d9f5c12dc0da2b583f4b949f00000000000000000000000000000000000000000000000000000000000001000000000000000000000000003b3cd21242ba44e9865b066e5ef5d1cc1030cc580000000000000000000000000000000000000000000000302379bf2ca2e000000000000000000000000000000000000000006e898131631616b1779bad70bd6d00000000000000000000000000000000000000000000000000000000689b89e600000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002c3b3cd21242ba44e9865b066e5ef5d1cc1030cc580000271042000000000000000000000000000000000000060000000000000000000000000000000000000000',
    gas: 728111n,
    maxFeePerGas: 14254380n,
    maxPriorityFeePerGas: 1000000n,
    nonce: 421,
    to: '0xf525ff21c370beb8d9f5c12dc0da2b583f4b949f',
    type: 'eip1559',
    value: 0n,
  },
];
