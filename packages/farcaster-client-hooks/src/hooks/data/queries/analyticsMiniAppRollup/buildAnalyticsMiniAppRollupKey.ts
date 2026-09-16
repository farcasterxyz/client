import { ApiAnalyticsMiniAppRollupRequestBody } from 'farcaster-client-data';

const buildAnalyticsMiniAppRollupKey = ({
  request,
}: {
  request: ApiAnalyticsMiniAppRollupRequestBody;
}) => ['analyticsMiniAppRollup', request];

export { buildAnalyticsMiniAppRollupKey };
