import { ApiGetKeyTransactionQueryParams } from 'farcaster-client-data';

const buildKeyTransactionKey = ({
  keyTransactionId,
}: ApiGetKeyTransactionQueryParams) => ['keyTransaction', keyTransactionId];

export { buildKeyTransactionKey };
