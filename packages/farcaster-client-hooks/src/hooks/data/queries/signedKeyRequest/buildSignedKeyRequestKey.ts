import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSignedKeyRequestKey = ({
  token,
  deadline,
}: {
  token: string;
  deadline?: number;
}) =>
  compactQueryKey(['signedKeyRequest', token, deadline]) as Array<
    string | number
  >;

export { buildSignedKeyRequestKey };
