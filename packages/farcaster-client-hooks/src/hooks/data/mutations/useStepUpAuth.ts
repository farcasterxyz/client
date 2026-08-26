import { useMutation } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { generateSiweMessage } from '../../../utils';
import type { LocalAccountWithSign } from '../account';

export interface StepUpAuthParams {
  account: LocalAccountWithSign;
}

export const useStepUpAuth = (): {
  stepUpAuthOrThrow: (params: StepUpAuthParams) => Promise<void>;
} => {
  const { apiClient } = useFarcasterApiClient();
  async function stepUpAuthOrThrow({
    account,
  }: StepUpAuthParams): Promise<void> {
    const { data } = await apiClient.getStepUpMessage();

    const message = generateSiweMessage({
      address: account.address,
      chainId: 1,
      domain: 'farcaster.xyz',
      nonce: data.result.nonce,
      message: '__STEP_UP_AUTH__',
      origin: 'https://farcaster.xyz/siwe',
    });
    const signature = await account.signMessage({ message });
    const result = await apiClient.postStepUpMessage({
      message,
      signature,
    });
    if (result.data.result.success !== true) {
      throw new Error('Step up auth failed');
    }
  }

  const { mutateAsync } = useMutation({
    mutationFn: stepUpAuthOrThrow,
  });
  return { stepUpAuthOrThrow: mutateAsync };
};
