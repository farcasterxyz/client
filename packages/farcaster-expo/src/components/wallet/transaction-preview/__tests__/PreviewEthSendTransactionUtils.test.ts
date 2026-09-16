import { EvmPreviewRequest } from '../../../../types';
import { resolveEvmPreviewRequestAddress } from '../PreviewEthSendTransactionUtils';

const FALLBACK_ADDRESS = '0xcA1269d161647Bd461546a7e7C19A16Df5179446';
const REQUEST_ADDRESS = '0x1111111111111111111111111111111111111111';

function makePreviewRequest<T extends EvmPreviewRequest['request']['method']>(
  request: unknown,
): EvmPreviewRequest<T> {
  return {
    request,
    approve: jest.fn(),
    reject: jest.fn(),
  } as unknown as EvmPreviewRequest<T>;
}

describe('resolveEvmPreviewRequestAddress', () => {
  it('uses eth_sendTransaction from when present', () => {
    expect(
      resolveEvmPreviewRequestAddress(
        makePreviewRequest({
          method: 'eth_sendTransaction',
          params: [
            {
              chainId: '0x2105',
              from: REQUEST_ADDRESS,
              to: '0x4200000000000000000000000000000000000006',
              data: '0x',
              value: '0x0',
            },
          ],
        }),
        FALLBACK_ADDRESS,
      ),
    ).toBe(REQUEST_ADDRESS);
  });

  it('falls back for snap eth_sendTransaction requests without from', () => {
    expect(
      resolveEvmPreviewRequestAddress(
        makePreviewRequest({
          method: 'eth_sendTransaction',
          params: [
            {
              chainId: '0x2105',
              to: '0x4200000000000000000000000000000000000006',
              data: '0x',
              value: '0x0',
            },
          ],
        }),
        FALLBACK_ADDRESS,
      ),
    ).toBe(FALLBACK_ADDRESS);
  });

  it('falls back for snap wallet_sendCalls requests without from', () => {
    expect(
      resolveEvmPreviewRequestAddress(
        makePreviewRequest({
          method: 'wallet_sendCalls',
          params: [
            {
              chainId: '0x2105',
              version: '1.0',
              atomicRequired: false,
              calls: [
                {
                  to: '0x4200000000000000000000000000000000000006',
                  data: '0x',
                  value: '0x0',
                },
              ],
            },
          ],
        }),
        FALLBACK_ADDRESS,
      ),
    ).toBe(FALLBACK_ADDRESS);
  });
});
