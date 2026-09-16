import {
  ApiEnsVerificationError,
  ApiErrorBody,
  ApiErrorResponse,
  ApiWrongCustodyAddressError,
} from './api';
import { EndpointName } from './client';
import { RequestMethod } from './requests';

export const isError = (error: unknown): error is Error =>
  error instanceof Error;

export const isFarcasterError = (error: unknown): error is FarcasterError =>
  error instanceof FarcasterError;

export type BaseErrorParameters = {
  cause?: BaseError | Error | unknown | undefined;
  details?: string | undefined;
  name?: string | undefined;
};

/** Extend this to create custom error types. */
export class BaseError extends Error {
  details: string;
  shortMessage: string;
  tracked: boolean = false;

  override name = this.constructor.name;

  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    const details = (() => {
      if (args.cause instanceof BaseError) {
        return args.cause.details;
      }
      if (args.cause instanceof Error) {
        if (args.cause?.message) {
          return args.cause.message;
        }
      }
      return args.details!;
    })();

    const message = [
      shortMessage || 'An error occurred.',
      '',
      ...(details ? [`Details: ${details}`] : []),
    ].join('\n');

    super(message, args.cause ? { cause: args.cause } : undefined);

    this.details = details;
    this.name = args.name ?? this.name;
    this.shortMessage = shortMessage;
  }

  get errorContext() {
    return {};
  }
}

interface AppErrorParameters extends BaseErrorParameters {
  location?: string;
  name: string;
}

/** Create one-off application errors */
export class AppError extends BaseError {
  location: string | undefined;

  constructor(shortMessage: string, args: AppErrorParameters) {
    super(shortMessage, args);
    this.location = args.location;
  }

  override get errorContext() {
    return {
      location: this.location,
    };
  }
}

export type FarcasterErrorOptions<T extends object = object> = {
  error?: unknown;
} & T;

export class FarcasterError extends BaseError {
  constructor(shortMessage: string, options: BaseErrorParameters) {
    super(shortMessage, options);
  }
}

export interface FetchErrorOptions {
  absoluteUrl: string | undefined;
  body: string | undefined;
  endpointName: EndpointName;
  hasTimedOut: boolean;
  isNetworkError: boolean;
  message?: string;
  method: RequestMethod;
  relativeUrl: string;
  resolvedTimeout: number;
  response: Response | undefined;
  responseData: unknown | undefined;
  status?: number;
  timeout: number | undefined;
  error?: unknown;
  isHandled: boolean;
  isOffline: boolean;
}

export class UnhandledFetchError extends BaseError {
  absoluteUrl: string | undefined;
  body: string | undefined;
  endpointName: EndpointName;
  hasTimedOut: boolean;
  isNetworkError: boolean;
  method: RequestMethod;
  relativeUrl: string;
  resolvedTimeout: number;
  response: Response | undefined;
  responseData: unknown | undefined;
  status: number | undefined;
  timeout: number | undefined;
  isOffline: boolean;

  constructor(
    shortMessage: string,
    options: FarcasterErrorOptions<FetchErrorOptions>,
  ) {
    const details = [
      shortMessage || 'Unhandled fetch error.',
      '',
      `Request: ${options.method} ${options.relativeUrl}`,
      ...(options.response
        ? [
            `Response: ${options.response.status} ${options.response.statusText}`,
          ]
        : []),
    ].join('\n');

    super(shortMessage, {
      details,
      cause: options.error instanceof Error ? options.error : undefined,
    });

    this.absoluteUrl = options.absoluteUrl;
    this.body = options.body;
    this.endpointName = options.endpointName;
    this.hasTimedOut = options.hasTimedOut;
    this.isNetworkError = options.isNetworkError;
    this.method = options.method;
    this.relativeUrl = options.relativeUrl;
    this.resolvedTimeout = options.resolvedTimeout;
    this.response = options.response;
    this.responseData = options.responseData;
    this.status = options.status;
    this.timeout = options.timeout;
    this.isOffline = options.isOffline;
  }

  override get errorContext() {
    return {
      endpointName: this.endpointName,
      hasTimedOut: this.hasTimedOut,
      isNetworkError: this.isNetworkError,
      method: this.method,
      relativeUrl: this.relativeUrl,
      status: this.status,
      isOffline: this.isOffline,
    };
  }
}

interface HandledFetchErrorOptions extends FetchErrorOptions {
  responseData: ApiErrorResponse;
  status: number;
}

export class HandledFetchError extends UnhandledFetchError {
  responseData: ApiErrorResponse;
  status: number;

  constructor(
    shortMessage: string,
    options: FarcasterErrorOptions<HandledFetchErrorOptions>,
  ) {
    super(shortMessage, options);
    this.responseData = options.responseData;
    this.status = options.status;
  }

  override get errorContext() {
    return {
      endpointName: this.endpointName,
      hasTimedOut: this.hasTimedOut,
      isNetworkError: this.isNetworkError,
      method: this.method,
      relativeUrl: this.relativeUrl,
      status: this.status,
      isOffline: this.isOffline,
      responseData: this.responseData,
    };
  }
}

export type FetchError = HandledFetchError | UnhandledFetchError;

export function isHandledFetchError(
  error: unknown,
): error is HandledFetchError {
  return !!(error && (error as Error).constructor === HandledFetchError);
}

export function isUnhandledFetchError(
  error: unknown,
): error is UnhandledFetchError {
  return !!(error && (error as Error).constructor === UnhandledFetchError);
}

export function isFarcasterApiError(
  error: unknown,
): error is HandledFetchError | UnhandledFetchError {
  return isHandledFetchError(error) || isUnhandledFetchError(error);
}

export class UndefinedFetchFunctionError extends BaseError {
  constructor() {
    super('The API client requires a valid fetch function.');
  }
}

export function getFirstApiErrorBody(error: unknown): ApiErrorBody | undefined {
  if (isHandledFetchError(error)) {
    const errors = error.responseData.errors;
    if (errors && errors[0]) {
      return errors[0];
    }
  }
  return undefined;
}

export function getApiTokenAuthError(
  error: Error,
): ApiWrongCustodyAddressError | undefined {
  if (isHandledFetchError(error)) {
    const farcasterError = getFirstApiErrorBody(error);

    if (farcasterError?.reason === 'address_potentially_obsolete') {
      return farcasterError;
    }
  }

  return undefined;
}

export function isApiTokenAuthError(error: Error): boolean {
  return !!getApiTokenAuthError(error);
}

export function isRetryableError(error: Error): boolean {
  return !getApiTokenAuthError(error);
}

export function getEnsVerificationError(
  error: Error,
): ApiEnsVerificationError | undefined {
  if (isHandledFetchError(error)) {
    const farcasterError = getFirstApiErrorBody(error);

    if (farcasterError?.reason === 'ens_verification') {
      return farcasterError;
    }
  }

  return undefined;
}

export function isEnsVerificationError(error: Error): boolean {
  return !!getEnsVerificationError(error);
}

export function getUnknownErrorMessage(e: unknown): string | undefined {
  const apiError = getFirstApiErrorBody(e);
  if (apiError) {
    return apiError.message;
  }

  if (e instanceof Error) {
    return e.message;
  }

  if (typeof e === 'string') {
    return e;
  }

  return undefined;
}

export function isInsufficientWarpsError(error: unknown): boolean {
  return isHandledFetchError(error)
    ? getFirstApiErrorBody(error)?.reason === 'insufficient_warps'
    : false;
}
