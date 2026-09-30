import { DdRum, ErrorSource } from '@datadog/mobile-react-native';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { BaseError, isError, stringifyError } from 'farcaster-client-data';
import { useEffect } from 'react';

import { analyticsClient } from '~/analyticsClient';
import { isDev } from '~/constants/Env';
import { FullParamList } from '~/types';

// Hermes transpiles `class X extends Error` (BaseError/FarcasterError/…) through
// native helpers — Reflect.construct surfaces as `construct (native)`, plus
// Babel's `_callSuper`/`_wrapNativeSuper` — which put native frames on TOP of a
// subclassed Error's captured stack. Datadog derives error.file from the top
// frame, sees `native`, and skips JS source-map symbolication for the whole
// error. Strip those leading construction frames (native helpers + the error's
// own constructor frames, found via its prototype chain) so the top frame is the
// real JS throw site and Datadog symbolicates. Defensive: returns the original
// if it would strip nothing or everything. Applied only to the Datadog stack;
// PostHog's captureException still gets the raw error.
const NATIVE_CONSTRUCTION_HELPER_RE =
  /^\s*at (?:construct|apply) \(native\)\s*$|^\s*at (?:_callSuper|_construct|_createSuperInternal|_wrapNativeSuper|_possibleConstructorReturn|_assertThisInitialized|Wrapper)\b/;

function errorClassChainNames(error: unknown): Set<string> {
  const names = new Set<string>();
  if (!(error instanceof Error)) {
    return names;
  }
  let proto: unknown = Object.getPrototypeOf(error);
  let guard = 0;
  while (proto && guard < 20) {
    const name = (proto as { constructor?: { name?: string } }).constructor
      ?.name;
    if (!name || name === 'Object') {
      break;
    }
    names.add(name);
    if (name === 'Error') {
      break;
    }
    proto = Object.getPrototypeOf(proto);
    guard += 1;
  }
  return names;
}

function stripConstructionFrames(error: unknown, stack: string): string {
  if (!stack) {
    return stack;
  }
  const lines = stack.split('\n');
  const firstFrame = lines.findIndex((line) => /^\s*at /.test(line));
  if (firstFrame === -1) {
    return stack;
  }
  const classNames = errorClassChainNames(error);
  const isConstructionFrame = (line: string): boolean => {
    if (NATIVE_CONSTRUCTION_HELPER_RE.test(line)) {
      return true;
    }
    const match = line.match(/^\s*at ([^\s(]+)/);
    return match ? classNames.has(match[1]) : false;
  };
  let i = firstFrame;
  while (i < lines.length && isConstructionFrame(lines[i])) {
    i += 1;
  }
  // Keep the original if it would strip everything (paranoia) or nothing.
  if (i === firstFrame || i >= lines.length) {
    return stack;
  }
  return [...lines.slice(0, firstFrame), ...lines.slice(i)].join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trackError = (error: any, context?: Record<string, unknown>) => {
  if (!error) {
    return;
  }

  if (isDev) {
    // eslint-disable-next-line no-console
    console.error(stringifyError(error));
  }

  if (error instanceof BaseError && error.tracked) {
    return;
  }

  const mergedContext =
    error instanceof BaseError
      ? { ...context, ...error.errorContext }
      : context;

  const datadogStack = stripConstructionFrames(error, `${error?.stack ?? ''}`);

  try {
    if (error instanceof BaseError) {
      DdRum.addError(
        error.message,
        ErrorSource.CUSTOM,
        datadogStack,
        mergedContext,
      );
    } else if (isError(error)) {
      DdRum.addError(
        error.message,
        ErrorSource.CUSTOM,
        datadogStack,
        mergedContext,
      );
    } else {
      DdRum.addError(
        stringifyError(error),
        ErrorSource.CUSTOM,
        datadogStack,
        mergedContext,
      );
    }
  } catch (datadogError) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn('[ErrorUtils] Datadog addError failed:', datadogError);
    }
  }

  try {
    analyticsClient.captureException(
      error,
      mergedContext as Parameters<typeof analyticsClient.captureException>[1],
    );
  } catch (analyticsError) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ErrorUtils] analytics captureException failed:',
        analyticsError,
      );
    }
  }

  if (error instanceof BaseError) {
    error.tracked = true;
  }
};

const reportAndRethrow = <T>(promise: Promise<T>) =>
  promise.catch((err) => {
    trackError(err);
    throw err;
  });

const originalHandler = ErrorUtils.getGlobalHandler?.();

function useLogErrors({
  navigationRef,
}: {
  navigationRef: NavigationContainerRefWithCurrent<FullParamList>;
}) {
  useEffect(() => {
    ErrorUtils.setGlobalHandler((e, isFatal) => {
      try {
        DdRum.addError(
          e?.message ?? 'Unknown JS Error',
          ErrorSource.SOURCE,
          stripConstructionFrames(e, (e instanceof Error && e.stack) || ''),
          {
            fc: true,
            isFatal: isFatal,
            currentRoute: navigationRef.current?.getCurrentRoute(),
            stack: e?.stack,
            stackStack: e?.error?.stack,
            // Serialize non-enumerable Error properties (message, stack, name) for full context
            full: JSON.stringify(e, Object.getOwnPropertyNames(e)),
          },
        );
      } catch (datadogError) {
        // Don't let Datadog reporting crash the global error handler
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn('[ErrorUtils] Datadog addError failed:', datadogError);
        }
      }

      try {
        analyticsClient.captureException(e, {
          isFatal: isFatal ?? false,
          currentRoute: navigationRef.current?.getCurrentRoute()?.name ?? '',
        });
      } catch (analyticsError) {
        // Don't let analytics reporting crash the global error handler
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn(
            '[ErrorUtils] analytics captureException failed:',
            analyticsError,
          );
        }
      }

      // In production, only re-raise when the error is truly fatal. The default
      // RN handler crashes the process for any reported error, which surfaces
      // as ExceptionsManagerModule.reportException in Play Console — many of
      // those are recoverable async/event-handler errors that we've already
      // logged above.
      if (isDev || isFatal) {
        originalHandler?.(e, isFatal);
      }
    });

    return () => {
      if (originalHandler) {
        ErrorUtils.setGlobalHandler(originalHandler);
      }
    };
  }, [navigationRef]);
}

export { reportAndRethrow, trackError, useLogErrors };
