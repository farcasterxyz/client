import { z } from 'zod';

const WarpsIneligibleSchema = z.object({
  status: z.literal('ineligible'),
});

export const WarpsEligibleSchema = z.object({
  status: z.literal('eligible'),
  redeemableWarps: z.number(),
  exchangeUsdcAmount: z.number(),
  expiresAt: z.coerce.date(),
});

const WarpsTradePendingSchema = z.object({
  status: z.literal('pending'),
  redeemableWarps: z.number(),
  exchangeUsdcAmount: z.number(),
  submittedAt: z.coerce.date(),
});

const WarpsTradeCompleteSchema = z.object({
  status: z.literal('complete'),
  transactionHash: z.string(),
});

export const WarpsTradeSchema = z.discriminatedUnion('status', [
  WarpsIneligibleSchema,
  WarpsEligibleSchema,
  WarpsTradePendingSchema,
  WarpsTradeCompleteSchema,
]);
export type WarpsTrade = z.infer<typeof WarpsTradeSchema>;
export type WarpsEligible = z.infer<typeof WarpsEligibleSchema>;
