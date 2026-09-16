import {
  ApiGetOnboardingStateAndAuthToken200Response,
  ApiGetOnboardingStateAndAuthTokenRequestBody,
  DEFAULT_TIMEOUT_ONBOARDING_STATE,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildOnboardingStateAndAuthTokenFetcher =
  ({
    apiClient,
    custodyBearerPayload,
    custodyBearerToken,
  }: {
    apiClient: FarcasterApiClient;
    custodyBearerPayload: ApiGetOnboardingStateAndAuthTokenRequestBody['authRequest'];
    custodyBearerToken: string;
  }) =>
  async (): Promise<ApiGetOnboardingStateAndAuthToken200Response> => {
    const response = await apiClient.getOnboardingStateAndAuthToken(
      { authRequest: custodyBearerPayload },
      {
        timeout: DEFAULT_TIMEOUT_ONBOARDING_STATE,
        headers: { Authorization: `Bearer ${custodyBearerToken}` },
      },
    );

    return response.data;
  };

export { buildOnboardingStateAndAuthTokenFetcher };
