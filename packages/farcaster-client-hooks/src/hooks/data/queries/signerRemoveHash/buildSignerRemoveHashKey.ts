import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSignerRemoveHashKey = ({
  publicKey,
  deadline,
}: {
  publicKey: string;
  deadline: number;
}) => compactQueryKey(['signerRemoveHash', publicKey, deadline]);

export { buildSignerRemoveHashKey };
