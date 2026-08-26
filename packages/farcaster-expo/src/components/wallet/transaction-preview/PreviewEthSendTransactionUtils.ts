import { EvmPreviewRequest } from '../../../types';

type WalletTransactionRequest = EvmPreviewRequest<
  | 'eth_sendTransaction'
  | 'eth_signTypedData_v4'
  | 'personal_sign'
  | 'wallet_sendCalls'
>;

type EvmAddress = `0x${string}`;

function asEvmAddress(value: string | undefined): EvmAddress | undefined {
  if (!value?.startsWith('0x')) {
    return undefined;
  }
  return value as EvmAddress;
}

export function resolveEvmPreviewRequestAddress(
  request: WalletTransactionRequest,
  fallbackAddress?: string,
): EvmAddress | undefined {
  const fallback = asEvmAddress(fallbackAddress);
  if (request.request.method === 'eth_sendTransaction') {
    return asEvmAddress(request.request.params[0].from) ?? fallback;
  }
  if (request.request.method === 'eth_signTypedData_v4') {
    return asEvmAddress(request.request.params[0]) ?? fallback;
  }
  if (request.request.method === 'personal_sign') {
    const [, address] = request.request.params;
    return asEvmAddress(address) ?? fallback;
  }
  if (request.request.method === 'wallet_sendCalls') {
    return asEvmAddress(request.request.params[0].from) ?? fallback;
  }
  return fallback;
}
