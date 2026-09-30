import { AnalyticsEvent } from 'farcaster-analytics';
import React, { FC, memo, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { trackError } from '~/utils/errorUtils';

type ComposerErrorBoundaryDebugData = Record<
  string,
  string | boolean | number | undefined
>;

type ComposerErrorFallbackProps = {
  onTryAgain: () => void;
  resetErrorBoundary: () => void;
};

const ComposerErrorFallback: FC<ComposerErrorFallbackProps> = memo(
  ({ onTryAgain, resetErrorBoundary }) => {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-1 text-base font-semibold text-default">
          Something went wrong
        </div>
        <div className="mb-4 text-sm text-faint">
          The composer hit an unexpected error. Please try again.
        </div>
        <DefaultButton
          className="min-w-[140px]"
          onClick={() => {
            onTryAgain();
            resetErrorBoundary();
          }}
        >
          Try again
        </DefaultButton>
      </div>
    );
  },
);

ComposerErrorFallback.displayName = 'ComposerErrorFallback';

type ComposerErrorBoundaryProps = {
  children: ReactNode;
  debugData?: ComposerErrorBoundaryDebugData;
  getDebugData?: () => ComposerErrorBoundaryDebugData;
};

const truncate = (value: string | undefined, maxLength = 5000) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

const serializeError = (error: unknown): ComposerErrorBoundaryDebugData => {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: truncate(error.stack),
      error_cause:
        error.cause instanceof Error
          ? `${error.cause.name}: ${error.cause.message}`
          : typeof error.cause === 'string'
            ? error.cause
            : undefined,
    };
  }

  return {
    error_name: typeof error,
    error_message: typeof error === 'string' ? error : 'Non-Error value thrown',
  };
};

const getRouteDebugData = (): ComposerErrorBoundaryDebugData => {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    route_pathname: window.location.pathname,
    route_search_keys: Array.from(
      new URLSearchParams(window.location.search).keys(),
    )
      .sort()
      .join(','),
    document_visibility_state: document.visibilityState,
    navigator_on_line: navigator.onLine,
  };
};

const ComposerErrorBoundary: FC<ComposerErrorBoundaryProps> = memo(
  ({ children, debugData, getDebugData }) => {
    const { trackEvent } = useAnalytics();

    const getEventData = () => {
      let lazyDebugData: ComposerErrorBoundaryDebugData = {};

      try {
        lazyDebugData = getDebugData?.() ?? {};
      } catch (error) {
        lazyDebugData = {
          debug_data_error:
            error instanceof Error ? error.message : 'Unknown debug data error',
        };
      }

      return {
        ...getRouteDebugData(),
        ...debugData,
        ...lazyDebugData,
      };
    };

    return (
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <ComposerErrorFallback
            resetErrorBoundary={resetErrorBoundary}
            onTryAgain={() => {
              trackEvent(
                AnalyticsEvent.CastComposerErrorBoundaryTryAgainPressed,
                getEventData(),
              );
            }}
          />
        )}
        onError={(error, info) => {
          trackError({
            context: 'ComposerErrorBoundary',
            error,
            componentStack: info.componentStack,
          });

          trackEvent(AnalyticsEvent.CastComposerErrorBoundaryCaught, {
            ...getEventData(),
            ...serializeError(error),
            component_stack: truncate(info.componentStack),
          });
        }}
      >
        {children}
      </ErrorBoundary>
    );
  },
);

ComposerErrorBoundary.displayName = 'ComposerErrorBoundary';

export { ComposerErrorBoundary };
