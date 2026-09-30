import { ApiOnchainTransactionType } from 'farcaster-client-data';

const buildOfferingKey = ({
  onchainTransactionType,
}: {
  onchainTransactionType: ApiOnchainTransactionType;
}) => ['offering', onchainTransactionType];

export { buildOfferingKey };
