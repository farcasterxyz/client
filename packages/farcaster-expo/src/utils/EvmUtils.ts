import {
  ApiChainId,
  ApiEthWalletSendCallsRequest,
} from 'farcaster-client-data';
import type { Default, ExtractRequest } from 'ox/RpcSchema';

export function parseSendCalls(
  request: ExtractRequest<Default, 'wallet_sendCalls'>,
  chainId: ApiChainId,
  address: `0x${string}` | undefined,
): ApiEthWalletSendCallsRequest {
  const params = request.params[0];
  return {
    method: 'wallet_sendCalls',
    params: {
      version: '1.0',
      atomicRequired: false,
      chainId: chainId.toString(),
      from: address,
      calls: params.calls.map((call) => ({
        to: call.to,
        data: call.data,
        value: call.value,
      })),
    },
  };
}
