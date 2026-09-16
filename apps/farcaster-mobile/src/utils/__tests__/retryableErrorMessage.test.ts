import { UnhandledFetchError } from 'farcaster-client-data';

import {
  getRetryableErrorDescription,
  isConnectionError,
} from '../retryableErrorMessage';

const buildFetchError = ({
  endpointName = 'getClientConfig',
  hasTimedOut = false,
  isNetworkError = false,
  isOffline = false,
}: {
  endpointName?: 'getClientConfig' | 'getUser';
  hasTimedOut?: boolean;
  isNetworkError?: boolean;
  isOffline?: boolean;
}) =>
  new UnhandledFetchError('Network request failed', {
    absoluteUrl: 'https://api.farcaster.xyz/v2/client-config',
    body: undefined,
    endpointName,
    hasTimedOut,
    isNetworkError,
    isOffline,
    isHandled: false,
    method: 'GET',
    relativeUrl: '/v2/client-config',
    resolvedTimeout: 8000,
    response: undefined,
    responseData: undefined,
    status: undefined,
    timeout: 8000,
  });

describe('retryableErrorMessage', () => {
  describe('isConnectionError', () => {
    it('detects network, offline, and timeout failures', () => {
      expect(
        isConnectionError(buildFetchError({ isNetworkError: true })),
      ).toEqual(true);
      expect(isConnectionError(buildFetchError({ isOffline: true }))).toEqual(
        true,
      );
      expect(isConnectionError(buildFetchError({ hasTimedOut: true }))).toEqual(
        true,
      );
    });

    it('ignores non-connection API failures', () => {
      expect(isConnectionError(buildFetchError({}))).toEqual(false);
      expect(isConnectionError(new Error('boom'))).toEqual(false);
    });
  });

  describe('getRetryableErrorDescription', () => {
    it('returns an empty description for connection failures on getClientConfig', () => {
      expect(
        getRetryableErrorDescription(
          buildFetchError({
            endpointName: 'getClientConfig',
            isNetworkError: true,
          }),
        ),
      ).toEqual('');
    });

    it('keeps endpoint-specific descriptions for non-connection failures', () => {
      expect(
        getRetryableErrorDescription(
          buildFetchError({ endpointName: 'getClientConfig' }),
        ),
      ).toEqual('We were unable to retrieve the client config.');
      expect(
        getRetryableErrorDescription(
          buildFetchError({ endpointName: 'getUser' }),
        ),
      ).toEqual('We were unable to retrieve the user.');
    });
  });
});
