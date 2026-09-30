import { BaseError, UserRejectedRequestError } from 'viem';

export const parseEip155ChainId = (chainId: string) => {
  const [namespace, id] = chainId.split(':');
  if (namespace !== 'eip155' || typeof id === 'undefined') {
    throw new Error(`Unsupported storage chain id: ${chainId}`);
  }

  const parsedId = Number(id);
  if (!Number.isInteger(parsedId)) {
    throw new Error(`Unsupported storage chain id: ${chainId}`);
  }

  return parsedId;
};

export const getStoragePurchaseErrorMessage = (error: unknown) => {
  if (error instanceof BaseError) {
    const rejectError = error.walk(
      (err) => err instanceof UserRejectedRequestError,
    );
    if (rejectError) {
      return 'Transaction rejected in wallet.';
    }

    if (error.details.toLowerCase().includes('insufficient funds')) {
      return 'Insufficient funds for storage and gas on Optimism.';
    }

    return error.shortMessage || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'There was a problem purchasing storage.';
};
