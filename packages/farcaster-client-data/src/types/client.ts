import { ApiEndpointName } from './endpointName';
import { FetchError } from './errors';
import {
  RequestData,
  RequestHeaders,
  RequestMethod,
  RequestParams,
} from './requests';

export type EndpointName = ApiEndpointName;

export type Fetcher = typeof fetch;

export interface RequestInfo {
  absoluteUrl: string;
  body: RequestData;
  endpointName: EndpointName;
  method: RequestMethod;
  relativeUrl: string;
}

export type OnFetchStart = (params: { requestInfo: RequestInfo }) => void;

export type OnSuccess = (params: {
  requestInfo: RequestInfo;
  responseData: unknown;
  responseStatus: number;
}) => void;

export type OnError = (params: {
  requestInfo: RequestInfo;
  error: FetchError;
  responseStatus: number | undefined;
}) => void;

export type OnTimeout = (params: {
  requestInfo: RequestInfo;
  timeSinceRequestStart: number;
}) => void;

export type AuthToken = {
  expiresAt: number;
  secret: string;
};

export interface FarcasterApiClientOptions {
  readonly baseUrl?: string;
  readonly wsUrl?: string;
  readonly baseWalletUrl?: string;
  readonly debug?: boolean;
  readonly getFetch?: () => Fetcher;
  readonly authToken?: AuthToken;
  readonly meta?: FarcasterApiClientMetaOptions;
  readonly mutateTimeout?: number;
  readonly onError?: OnError;
  readonly onFetchStart?: OnFetchStart;
  readonly onSuccess?: OnSuccess;
  readonly onTimeout?: OnTimeout;
  readonly readTimeout?: number;
  readonly getDeviceId?: () => string | undefined;
  readonly getSessionId?: () => string | undefined;
  readonly timeoutRetryDecayFactor?: number;
  readonly isOffline?: boolean;
}

export interface FarcasterApiClientMetaOptions {
  readonly address?: string;
  readonly deviceId?: string; // e.g. 125425b3-aaff-445f-82cd-25dd1e619a62
  readonly deviceModel?: string; // e.g. iPhone 12 Pro Max
  readonly deviceOs?: string; // e.g. ios
  readonly fid?: number;
  readonly nativeApplicationVersion?: string; // e.g. 0.0.22
  readonly nativeBuildVersion?: string; // e.g. 90
}

export interface FetchOptions {
  readonly baseUrl?: string;
  readonly body?: RequestData;
  readonly endpointName: EndpointName;
  readonly headers?: RequestHeaders;
  readonly method: RequestMethod;
  readonly params?: RequestParams;
  readonly timeout?: number;
}

export type FetchOptionsWithoutMethod = Omit<FetchOptions, 'method'>;
export type FetchOptionsWithoutMethodOrBody = Omit<
  FetchOptionsWithoutMethod,
  'body'
>;

export type MutateFetchOptions = FetchOptionsWithoutMethod & {
  retryLimit?: number;
};

export type DeleteOptions = MutateFetchOptions;
export type GetOptions = FetchOptionsWithoutMethodOrBody;
export type PatchOptions = MutateFetchOptions;
export type PostOptions = MutateFetchOptions;
export type PutOptions = MutateFetchOptions;

export interface FetchResponse<T> {
  readonly data: T;
  readonly status: number;
}
