import { ApiOnchainTransactionType } from 'farcaster-client-data';

const buildWarpsOfferingKey = ({
  onchainTransactionType,
}: {
  onchainTransactionType: ApiOnchainTransactionType;
}) => ['warpsOffering', onchainTransactionType];

export { buildWarpsOfferingKey };
