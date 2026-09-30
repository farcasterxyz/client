import { isAddress } from 'viem';
import { z } from 'zod';

export const EvmAddressSchema = z.string().refine(isAddress, {
  message: 'Invalid Ethereum address',
});

export const GetCapabilitiesSingleSchema = z.tuple([EvmAddressSchema]);
export const GetCapabilitiesMultipleSchema = z.tuple([
  EvmAddressSchema,
  z.array(z.string().regex(/^0x[0-9a-f]+$/i, { message: 'Invalid chain ID' })),
]);

export const WalletGetCapabilitiesParamsSchema = z.union([
  GetCapabilitiesSingleSchema,
  GetCapabilitiesMultipleSchema,
]);

export type WalletGetCapabilitiesParams = z.infer<
  typeof WalletGetCapabilitiesParamsSchema
>;

// Hex string validation
const HexSchema = z.string().regex(/^0x[0-9a-fA-F]*$/, {
  message: 'Must be a valid hex string',
});

// Call schema for wallet_sendCalls
const CallSchema = z.object({
  to: EvmAddressSchema.optional(),
  value: HexSchema.optional(),
  data: HexSchema.optional(),
  capabilities: z.record(z.string(), z.any()).optional(),
});

// Capability schema
const CapabilitySchema = z.record(
  z.string(),
  z.object({
    optional: z.boolean().optional(),
  }),
);

// Main wallet_sendCalls parameters schema
const WalletSendCallsParamsObjectSchema = z.object({
  id: z
    .string()
    .regex(/^0x[0-9a-fA-F]*$/, {
      message: 'ID must be a hex string starting with 0x',
    })
    .max(8194)
    .optional(),
  chainId: HexSchema,
  from: EvmAddressSchema.optional(),
  atomicRequired: z.boolean(),
  calls: z.array(CallSchema).min(1),
  capabilities: CapabilitySchema.optional(),
});

export const WalletSendCallsParamsSchema = z.tuple([
  WalletSendCallsParamsObjectSchema,
]);

export type WalletSendCallsParams = z.infer<typeof WalletSendCallsParamsSchema>;

// Response schema for wallet_sendCalls
export const WalletSendCallsResponseSchema = z.object({
  id: z.string(),
  capabilities: z.record(z.string(), z.any()).optional(),
});

export type WalletSendCallsResponse = z.infer<
  typeof WalletSendCallsResponseSchema
>;

export type Call = z.infer<typeof CallSchema>;

// Log schema for transaction receipts
const LogSchema = z.object({
  address: HexSchema,
  topics: z.array(HexSchema),
  data: HexSchema,
});

// Receipt schema for a single transaction
export const CallReceiptSchema = z.object({
  logs: z.array(LogSchema),
  status: HexSchema,
  blockHash: HexSchema,
  blockNumber: HexSchema,
  gasUsed: HexSchema,
  transactionHash: HexSchema,
});

// Call status response schema
export const CallStatusResponseSchema = z.object({
  receipts: z.array(CallReceiptSchema),
});

export type CallStatusResponse = z.infer<typeof CallStatusResponseSchema>;
export type CallReceipt = z.infer<typeof CallReceiptSchema>;

// wallet_getCallsStatus response schema
export const WalletGetCallsStatusResponseSchema = z.object({
  version: z.literal('1.0'),
  chainId: HexSchema,
  id: HexSchema,
  status: z.number(),
  atomic: z.boolean(),
  receipts: z.array(CallReceiptSchema),
  capabilities: z.record(z.string(), z.any()).optional(),
});

export type WalletGetCallsStatusResponse = z.infer<
  typeof WalletGetCallsStatusResponseSchema
>;
