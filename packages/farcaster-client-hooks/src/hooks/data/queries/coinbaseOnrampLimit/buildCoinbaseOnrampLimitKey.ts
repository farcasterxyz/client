import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCoinbaseOnrampLimitKey = ({
  fidOverride,
}: {
  fidOverride?: number;
}) => compactQueryKey(['coinbaseOnrampLimit', fidOverride]);

export { buildCoinbaseOnrampLimitKey };
