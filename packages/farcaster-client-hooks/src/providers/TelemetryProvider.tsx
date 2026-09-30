import React, { createContext, useContext, useMemo } from 'react';

type TelemetryMethods = {
  /**
   * Start tracking a custom RUM Action.
   * @param name The action name.
   * @param context The additional context to send.
   * @param timestampMs The timestamp when the action started (in milliseconds). If not provided, current timestamp will be used.
   */
  startAction: (name: string, context?: object, timestampMs?: number) => void;

  /**
   * Stop tracking the ongoing custom RUM Action.
   * @param name The action name.
   * @param context The additional context to send.
   * @param timestampMs The timestamp when the action stopped (in milliseconds). If not provided, current timestamp will be used.
   */
  stopAction: (name: string, context?: object, timestampMs?: number) => void;

  /**
   * Add a custom RUM Action.
   * @param name The action name.
   * @param context The additional context to send.
   * @param timestampMs The timestamp when the action occurred (in milliseconds). If not provided, current timestamp will be used.
   */
  addAction: (name: string, context?: object, timestampMs?: number) => void;

  /**
   * Add a custom RUM Error.
   * @param message The error message.
   * @param stacktrace The error stacktrace.
   * @param context The additional context to send.
   * @param timestampMs The timestamp when the error occurred (in milliseconds). If not provided, current timestamp will be used.
   * @param fingerprint The error fingerprint for grouping.
   */
  addError: (
    message: string,
    stacktrace: string,
    context?: object,
    timestampMs?: number,
    fingerprint?: string,
  ) => void;
};

type TelemetryContextMethods = TelemetryMethods & {
  /**
   * Add a custom RUM Action if it exceeds the frame dropping threshold.
   * @param name The action name.
   * @param durationMs The duration of the action in milliseconds.
   * @param context The additional context to send.
   */
  maybeAddFrameDroppingAction: (
    name: string,
    durationMs: number,
    context?: object,
  ) => void;
};

const noopMethods: TelemetryContextMethods = {
  startAction: () => {},
  stopAction: () => {},
  addAction: () => {},
  addError: () => {},
  maybeAddFrameDroppingAction: () => {},
};

const TelemetryContext = createContext<TelemetryContextMethods>(noopMethods);

export const useTelemetry = () => {
  return useContext(TelemetryContext);
};

interface TelemetryProviderProps {
  children: React.ReactNode;
  methods?: TelemetryMethods;
}

const FRAME_DROPPING_ACTION_THRESHOLD_MS = 16.66;

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({
  children,
  methods,
}) => {
  const value = useMemo(() => {
    if (methods) {
      return {
        ...methods,
        maybeAddFrameDroppingAction: (
          name: string,
          durationMs: number,
          context?: object,
        ) => {
          if (durationMs && durationMs > FRAME_DROPPING_ACTION_THRESHOLD_MS) {
            methods.addAction(name, {
              ...context,
              durationMs,
            });
          }
        },
      };
    }
    return noopMethods;
  }, [methods]);

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
};
