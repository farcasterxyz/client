import { z } from 'zod';

/**
 * Schema for wallet_sendCalls RPC response
 * Used to validate the response from wallet_sendCalls method
 */
export const TxResultSchema = z.object({
  id: z.string(),
});

export type TxResult = z.infer<typeof TxResultSchema>;
