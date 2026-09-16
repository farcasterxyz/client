import { ApiChain, ApiTransactionScanAction } from 'farcaster-client-data';
import React from 'react';

type FrameTransactionsPromptsContextValue = {
  register: ({
    severity,
    warnings,
    stateChanges,
    errors,
    frameDomain,
    chain,
    onProceedCallback,
    onCancelCallback,
  }: {
    severity: ApiTransactionScanAction;
    warnings: string[];
    stateChanges: string[];
    errors: string[];
    frameDomain: string;
    chain: ApiChain;
    onProceedCallback: () => void;
    onCancelCallback: () => void;
    onReportCallback: () => void;
  }) => void;
  registerExerciseCaution: ({
    onAckExerciseCaution,
  }: {
    onAckExerciseCaution: () => void;
  }) => void;
  severity: ApiTransactionScanAction | undefined;
  warnings: string[] | undefined;
  stateChanges: string[] | undefined;
  errors: string[] | undefined;
  frameDomain: string | undefined;
  chain: ApiChain | undefined;
  onProceed: () => void;
  onCancel: () => void;
  onReport: () => void;
  onAckExerciseCaution: () => void;
};

const FrameTransactionsPromptsContext =
  React.createContext<FrameTransactionsPromptsContextValue>({} as never);

interface FrameTransactionsPromptsProviderProps {
  children: React.ReactNode;
}

const FrameTransactionsPromptsProvider: React.FC<
  FrameTransactionsPromptsProviderProps
> = ({ children }) => {
  const [severity, setSeverity] = React.useState<
    ApiTransactionScanAction | undefined
  >(undefined);
  const [warnings, setWarnings] = React.useState<string[] | undefined>(
    undefined,
  );
  const [stateChanges, setStateChanges] = React.useState<string[] | undefined>(
    undefined,
  );
  const [errors, setErrors] = React.useState<string[] | undefined>(undefined);
  const [frameDomain, setFrameDomain] = React.useState<string | undefined>(
    undefined,
  );
  const [chain, setChain] = React.useState<ApiChain | undefined>(undefined);

  const proceedCallbackRef = React.useRef<() => void>(undefined);
  const cancelCallbackRef = React.useRef<() => void>(undefined);
  const ackExerciseCautionCallbackRef = React.useRef<() => void>(undefined);
  const reportCallbackRef = React.useRef<() => void>(undefined);

  const register = React.useCallback(
    ({
      severity: s,
      warnings: ws,
      stateChanges: scs,
      frameDomain: fd,
      chain: c,
      errors: es,
      onProceedCallback,
      onCancelCallback,
      onReportCallback,
    }: {
      severity: ApiTransactionScanAction;
      warnings: string[];
      stateChanges: string[];
      errors: string[];
      frameDomain: string;
      chain: ApiChain;
      onProceedCallback: () => void;
      onCancelCallback: () => void;
      onReportCallback: () => void;
    }) => {
      setSeverity(s);
      setWarnings(ws);
      setStateChanges(scs);
      setErrors(es);
      setFrameDomain(fd);
      setChain(c);

      proceedCallbackRef.current = onProceedCallback;
      cancelCallbackRef.current = onCancelCallback;
      reportCallbackRef.current = onReportCallback;
    },
    [],
  );

  const registerExerciseCaution = React.useCallback(
    ({ onAckExerciseCaution }: { onAckExerciseCaution: () => void }) => {
      ackExerciseCautionCallbackRef.current = onAckExerciseCaution;
    },
    [],
  );

  const onProceed = React.useCallback(() => {
    if (typeof proceedCallbackRef.current !== 'undefined') {
      proceedCallbackRef.current();
    }
  }, []);

  const onCancel = React.useCallback(() => {
    if (typeof cancelCallbackRef.current !== 'undefined') {
      cancelCallbackRef.current();
    }
  }, []);

  const onReport = React.useCallback(() => {
    if (typeof reportCallbackRef.current !== 'undefined') {
      reportCallbackRef.current();
    }
  }, []);

  const onAckExerciseCaution = React.useCallback(() => {
    if (typeof ackExerciseCautionCallbackRef.current !== 'undefined') {
      ackExerciseCautionCallbackRef.current();
    }
  }, []);

  return (
    <FrameTransactionsPromptsContext.Provider
      value={{
        register,
        severity,
        warnings,
        stateChanges,
        errors,
        frameDomain,
        chain,
        onProceed,
        onCancel,
        onReport,
        registerExerciseCaution,
        onAckExerciseCaution,
      }}
    >
      {children}
    </FrameTransactionsPromptsContext.Provider>
  );
};

FrameTransactionsPromptsProvider.displayName =
  'FrameTransactionsPromptsProvider';

const useFrameTransactionsPrompts = () =>
  React.useContext(FrameTransactionsPromptsContext);

export { FrameTransactionsPromptsProvider, useFrameTransactionsPrompts };
