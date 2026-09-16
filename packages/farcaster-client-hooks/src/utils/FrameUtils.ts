import {
  ApiDomainFrameConfig,
  ApiDomainManifest,
  ApiFrame,
} from 'farcaster-client-data';
import { ByteArray } from 'viem';

import { base64UrlEncode } from './SyncChannelUtils';

export type TransactionFailureReason =
  | 'user_rejected'
  | 'insufficient_funds'
  | 'unknown';

export type SendTransactionResult = {
  method: 'eth_sendTransaction';
  transactionHash: string;
  transactionChainId: string;
  transactionDataCorrelationId: string | undefined;
  address: string;
};

export type SignTypedDataV4Result = {
  method: 'eth_signTypedData_v4';
  signature: string;
  transactionDataCorrelationId: string | undefined;
  address: string;
};

export type WalletActionResult = SendTransactionResult | SignTypedDataV4Result;

export type FrameTransaction = {
  actionIndex: number;
  actionText: string;
  actionPostUrl: string | undefined;
  target: string;
  onSuccess: (params: {
    scaffold: FrameTransaction;
    result: WalletActionResult;
  }) => Promise<void>;
  onFailure: (params: {
    transactionDataCorrelationId: string | undefined;
    reason: TransactionFailureReason;
    message?: string;
    details?: string;
  }) => void;
};

export function frameUrlToDomain(url: string): string {
  const structuredUrl = new URL(url);
  const hostname = structuredUrl.hostname;
  const dubDubDubDot = 'www.';

  if (hostname.startsWith(dubDubDubDot))
    return hostname.slice(dubDubDubDot.length);

  return hostname;
}

export const DEFAULT_CAST_FID = 1;
export const DEFAULT_CAST_HASH = '0x0000000000000000000000000000000000000000';

export async function generateDomainManifest({
  domain,
  fid,
  custodyAddress,
  frameConfig,
}: {
  domain: string;
  fid: number;
  custodyAddress: string;
  frameConfig?: ApiDomainFrameConfig;
}) {
  const header = {
    fid: fid,
    type: 'custody',
    key: custodyAddress,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));

  const payload = {
    domain: domain,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const manifest: ApiDomainManifest = {
    accountAssociation: {
      header: encodedHeader,
      payload: encodedPayload,
      signature: '',
    },
  };

  if (frameConfig) {
    manifest.frame = frameConfig;
  } else {
    manifest.frame = {
      version: '1',
      name: 'Example Frame',
      iconUrl: `https://${domain}/icon.png`,
      homeUrl: `https://${domain}`,
      imageUrl: `https://${domain}/image.png`,
      buttonTitle: 'Check this out',
      splashImageUrl: `https://${domain}/splash.png`,
      splashBackgroundColor: '#eeccff',
      webhookUrl: `https://${domain}/api/webhook`,
    };
  }

  return manifest;
}

export async function generateSignedDomainManifest({
  domain,
  fid,
  address,
  signMessage,
  type,
  includeFrameConfig,
}: {
  domain: string;
  fid: number;
  address: string;
  signMessage: (message: string) => Promise<ByteArray>;
  type: 'custody' | 'auth';
  includeFrameConfig: boolean;
}) {
  const header = {
    fid: fid,
    type,
    key: address,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));

  const payload = {
    domain: domain,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await signMessage(message);

  const encodedSignature = Buffer.from(signature).toString('base64');

  const manifest: ApiDomainManifest = {
    accountAssociation: {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature,
    },
  };

  if (includeFrameConfig) {
    manifest.frame = {
      version: '1',
      name: 'Example Frame',
      iconUrl: `https://${domain}/icon.png`,
      homeUrl: `https://${domain}`,
      imageUrl: `https://${domain}/image.png`,
      buttonTitle: 'Check this out',
      splashImageUrl: `https://${domain}/splash.png`,
      splashBackgroundColor: '#eeccff',
      webhookUrl: `https://${domain}/api/webhook`,
    };
  }

  return manifest;
}

export const frameKeyExtractor = (item: ApiFrame) => {
  return item.domain;
};
