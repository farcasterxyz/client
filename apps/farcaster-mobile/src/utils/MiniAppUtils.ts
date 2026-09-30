import { ApiFrame } from 'farcaster-client-data';
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isHex as isHexViem } from 'viem';
import { z } from 'zod';

import {
  ManifestLaunchMiniAppConfig,
  StandaloneLaunchMiniAppConfig,
} from '~/components/MiniApp/types';

import {
  getMiniAppLastPressedTimestamp,
  setMiniAppLastPressedTimestamp,
} from './FastStorageUtils';

export function useHeightForExpandingBottomSheet() {
  const { height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  return Platform.select({
    ios: height - top,
    default: height,
  });
}

type SuperRefineCtx = Parameters<Parameters<z.ZodString['superRefine']>[0]>[1];

const isHex = (string: string, ctx: SuperRefineCtx) => {
  if (!isHexViem(string)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Not a hex string`,
    });
  }
};

const isPositiveBigInt = (string: string, ctx: SuperRefineCtx) => {
  try {
    const val = BigInt(string);
    if (val < 1n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be positive integer`,
      });
    }
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Not a valid integer`,
    });
  }
};

const isEthChainId = (string: string, ctx: SuperRefineCtx) => {
  if (!string.startsWith('eip155:')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Must be an Ethereum chain ID`,
    });
  }
};

const isNonNegativeBigInt = (string: string, ctx: SuperRefineCtx) => {
  try {
    const val = BigInt(string);
    if (val < 0n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be non-negative integer`,
      });
    }
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Not a valid integer`,
    });
  }
};

export const ethSendTransactionActionSchema = z.object({
  method: z.literal('eth_sendTransaction'),
  chainId: z.string().superRefine(isEthChainId),
  attribution: z.boolean().optional(),
  params: z.object({
    to: z.string().superRefine(isHex),
    data: z.string().superRefine(isHex).optional(),
    value: z.string().superRefine(isNonNegativeBigInt).optional(),
    gas: z.string().superRefine(isPositiveBigInt).optional(),
  }),
});

export const ethSignTypedDataV4ActionSchema = z.object({
  method: z.literal('eth_signTypedData_v4'),
  chainId: z.string().superRefine(isEthChainId),
  params: z.object({
    domain: z
      .object({
        chainId: z.coerce.number().optional(),
        name: z.string().optional(),
        salt: z.string().optional(),
        verifyingContract: z.string().superRefine(isHex).optional(),
        version: z.string().optional(),
      })
      .optional(),
    types: z.unknown(),
    primaryType: z.string(),
    message: z.record(z.string(), z.unknown()),
  }),
});

export const walletActionSchema = z.discriminatedUnion('method', [
  ethSendTransactionActionSchema,
  ethSignTypedDataV4ActionSchema,
]);

export type EthSendTransaction = z.infer<typeof ethSendTransactionActionSchema>;
export type EthSignTypedDataV4 = z.infer<typeof ethSignTypedDataV4ActionSchema>;

export const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  method: z.string(),
  params: z.any(),
});

export const jsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  result: z.any().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.any().optional(),
    })
    .optional(),
});

export const createCastMessageV1 = z.object({
  type: z.literal('cast'),
  cast: z.object({
    text: z.string(),
    embeds: z.array(z.string()),
    parent: z
      .union([
        z.object({
          hash: z.string().startsWith('0x'),
        }),
        z.string().startsWith('0x'),
      ])
      .optional(),
    channelKey: z.string().optional(),
  }),
});

export const createCastMessageV2 = z.object({
  type: z.literal('createCast'),
  data: z.object({
    cast: z.object({
      text: z.string(),
      embeds: z.array(z.string()),
      parent: z
        .union([
          z.object({
            hash: z.string().startsWith('0x'),
          }),
          z.string().startsWith('0x'),
        ])
        .optional(),
      channelKey: z.string().optional(),
    }),
  }),
});

export const createCastMessageV3 = jsonRpcRequestSchema.extend({
  method: z.literal('fc_createCast'),
  params: z.object({
    text: z.string(),
    embeds: z.array(z.string()),
    parent: z
      .union([
        z.object({
          hash: z.string().startsWith('0x'),
        }),
        z.string().startsWith('0x'),
      ])
      .optional(),
    channelKey: z.string().optional(),
  }),
});

export const getContextMessage = jsonRpcRequestSchema.extend({
  method: z.literal('fc_getContext'),
});

export const closeMessage = jsonRpcRequestSchema.extend({
  method: z.literal('fc_close'),
});

export const hideSplashScreen = jsonRpcRequestSchema.extend({
  method: z.literal('fc_hide_splash_screen'),
});

export const requestWalletActionMessage = jsonRpcRequestSchema.extend({
  method: z.literal('fc_requestWalletAction'),
  params: z.object({
    action: walletActionSchema,
  }),
});

export const setPrimaryButton = jsonRpcRequestSchema.extend({
  method: z.literal('fc_setPrimaryButton'),
  params: z.object({
    text: z.string(),
  }),
});

export const legacyMessageSchema = z.union([
  createCastMessageV1,
  createCastMessageV2,
]);

export const jsonRpcMessageSchema = z.union([
  createCastMessageV3,
  requestWalletActionMessage,
  getContextMessage,
  closeMessage,
  hideSplashScreen,
  setPrimaryButton,
]);

export const miniAppMessageSchema = z.union([
  legacyMessageSchema,
  jsonRpcMessageSchema,
]);

export const validateMiniAppMessage = (rawMessage: unknown) =>
  miniAppMessageSchema.safeParse(rawMessage);

export const isJsonRpcRequest = (
  message: MiniAppMessage,
): message is JsonRpcRequest => {
  return (
    typeof message === 'object' && message !== null && 'jsonrpc' in message
  );
};

export const jsonRpcResponse = (
  result: unknown,
  id: string | number | null,
) => {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
};

export const jsonRpcError = (error: unknown, id: string | number | null) => {
  return {
    jsonrpc: '2.0',
    error,
    id,
  };
};

export type LegacyRequest = z.infer<
  typeof createCastMessageV1 | typeof createCastMessageV2
>;

export type JsonRpcRequest = z.infer<typeof jsonRpcMessageSchema>;

export type LegacyCreateCastMessage = z.infer<
  typeof createCastMessageV1 | typeof createCastMessageV2
>;

export type CreateCastMessage = z.infer<typeof createCastMessageV3>;

export type GetContextMessage = z.infer<typeof getContextMessage>;
export type CloseMessage = z.infer<typeof closeMessage>;
export type HideSplashScreen = z.infer<typeof hideSplashScreen>;
export type SetPrimaryButtonMessage = z.infer<typeof setPrimaryButton>;
export type RequestWalletActionMessage = z.infer<
  typeof requestWalletActionMessage
>;
export type MiniAppMessage = z.infer<typeof miniAppMessageSchema>;

export function getDomainFromMiniAppLaunchConfig(
  launchConfig: StandaloneLaunchMiniAppConfig | ManifestLaunchMiniAppConfig,
): string | undefined {
  return launchConfig.type === 'manifest'
    ? (launchConfig.domain ?? undefined)
    : new URL(launchConfig.url).hostname;
}

export function sortMiniAppsAlphabetically(miniApps: ApiFrame[]): ApiFrame[] {
  return [...miniApps].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sorts mini apps by last pressed timestamp (most recent first),
 * then alphabetically by domain for apps that haven't been pressed
 */
export function sortMiniAppsByUsage(miniApps: ApiFrame[]): ApiFrame[] {
  return [...miniApps].sort((a, b) => {
    const aTimestamp = getMiniAppLastPressedTimestamp({ miniAppId: a.id });
    const bTimestamp = getMiniAppLastPressedTimestamp({ miniAppId: b.id });

    // Both have timestamps: sort by most recent
    if (aTimestamp && bTimestamp) {
      return bTimestamp - aTimestamp;
    }

    // Only a has timestamp: a comes first
    if (aTimestamp) {
      return -1;
    }

    // Only b has timestamp: b comes first
    if (bTimestamp) {
      return 1;
    }

    // Neither has timestamp: sort alphabetically by domain
    return a.domain.localeCompare(b.domain);
  });
}

/**
 * Custom hook for tracking mini app usage
 */
export function useMiniAppUsageTracking() {
  const trackMiniAppUsage = React.useCallback((miniApp: ApiFrame) => {
    if (miniApp.id) {
      setMiniAppLastPressedTimestamp({
        miniAppId: miniApp.id,
        timestamp: Date.now(),
      });
    }
  }, []);

  return { trackMiniAppUsage };
}
