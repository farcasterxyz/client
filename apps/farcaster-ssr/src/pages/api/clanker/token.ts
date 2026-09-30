import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Clanker token data response type
 */
export type ClankerTokenResponse = {
  id?: number;
  createdAt?: string;
  lastIndexed?: string;
  contractAddress: string;
  name: string;
  symbol: string;
  description?: string;
  socialLinks?: Array<{ name?: string; link?: string }>;
  imgUrl?: string;
  type?: 'clanker_v3' | 'clanker_v3_1' | 'clanker_v4';
  pair?: string;
  chainId?: number;
  deployedAt?: string;
  poolAddress?: string;
  lockerAddress?: string;
  supply?: string;
  admin?: string;
  tags?: {
    champagne?: boolean;
    verified?: boolean;
  };
  warnings?: Array<{
    type?: string;
    message?: string;
  }>;
  extensions?: {
    devBuy?: {
      amountEth?: string;
    };
    fees?: {
      type?: 'static' | 'dynamic';
      clankerFee?: number;
      pairedFee?: number;
      hookAddress?: string;
      recipients?: Array<{
        bps?: number;
        admin?: string;
        recipient?: string;
      }>;
    };
    airdrop?: {
      amount?: string;
      lockup?: {
        startedAt?: number;
        lockDuration?: number;
        vestDuration?: number;
      };
    };
    vault?: {
      amount?: string;
      lockup?: {
        startedAt?: number;
        lockDuration?: number;
        vestDuration?: number;
      };
    };
    sniperTax?: {
      startingFee?: number;
      endingFee?: number;
      secondsToDecay?: string;
    };
    positions?: Array<{
      tickLower?: number;
      tickUpper?: number;
      positionBps?: number;
    }>;
  };
  socialContext?: {
    platform?: string;
    messageId?: string;
    interface?: string;
  };
  metadata?:
    | {
        description?: string;
        socialMediaUrls?: Array<{ platform: string; url: string }>;
      }
    | Record<string, unknown>;
  market?: {
    startingMarketCap?: number;
  };
  twitterUrl?: string | null;
  farcasterUrl?: string | null;
};

type ApiResponse = { result: ClankerTokenResponse } | { error: string };

/**
 * Proxy endpoint for Clanker API
 * GET /api/clanker/token?ca=CONTRACT_ADDRESS
 *
 * Uses get-clanker-by-address to keep the API key server-side
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ca } = req.query;

  if (!ca || typeof ca !== 'string') {
    return res.status(400).json({ error: 'Contract address (ca) is required' });
  }

  // Validate contract address format (basic check)
  if (!/^0x[a-fA-F0-9]{40}$/.test(ca)) {
    return res.status(400).json({ error: 'Invalid contract address format' });
  }

  const apiKey = process.env.CLANKER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const clankerUrl = new URL(
      'https://www.clanker.world/api/get-clanker-by-address',
    );
    clankerUrl.searchParams.set('address', ca);

    const response = await fetch(clankerUrl.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Clanker API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    const token = data.data;

    if (!token || token.contract_address?.toLowerCase() !== ca.toLowerCase()) {
      return res.status(404).json({ error: 'Token not found' });
    }

    let parsedMetadata: ClankerTokenResponse['metadata'];
    if (typeof token.metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(token.metadata);
      } catch {
        parsedMetadata = undefined;
      }
    } else if (token.metadata && typeof token.metadata === 'object') {
      parsedMetadata = token.metadata;
    }

    // Transform snake_case to camelCase and format the response
    const result: ClankerTokenResponse = {
      id: token.id,
      createdAt: token.created_at,
      lastIndexed: token.last_indexed,
      contractAddress: token.contract_address,
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      socialLinks: token.socialLinks,
      imgUrl: token.img_url,
      type: token.type,
      pair: token.pair,
      chainId: token.chain_id,
      deployedAt: token.deployed_at,
      poolAddress: token.pool_address,
      lockerAddress: token.locker_address,
      supply: token.supply,
      warnings: token.warnings,
      admin: token.admin,
      tags: token.tags,
      extensions: token.extensions
        ? {
            devBuy: token.extensions.devBuy
              ? {
                  amountEth: token.extensions.devBuy.amountEth,
                }
              : undefined,
            fees: token.extensions.fees
              ? {
                  type: token.extensions.fees.type,
                  clankerFee: token.extensions.fees.clankerFee,
                  pairedFee: token.extensions.fees.pairedFee,
                  hookAddress:
                    token.extensions.fees.hookAddress ??
                    token.extensions.fees.hook_address,
                  recipients: token.extensions.fees.recipients,
                }
              : undefined,
            airdrop: token.extensions.airdrop
              ? {
                  amount: token.extensions.airdrop.amount,
                  lockup: token.extensions.airdrop.lockup
                    ? {
                        startedAt:
                          token.extensions.airdrop.lockup.startedAt ??
                          token.extensions.airdrop.lockup.started_at,
                        lockDuration:
                          token.extensions.airdrop.lockup.lockDuration ??
                          token.extensions.airdrop.lockup.lock_duration,
                        vestDuration:
                          token.extensions.airdrop.lockup.vestDuration ??
                          token.extensions.airdrop.lockup.vest_duration,
                      }
                    : undefined,
                }
              : undefined,
            vault: token.extensions.vault
              ? {
                  amount: token.extensions.vault.amount,
                  lockup: token.extensions.vault.lockup
                    ? {
                        startedAt:
                          token.extensions.vault.lockup.startedAt ??
                          token.extensions.vault.lockup.started_at,
                        lockDuration:
                          token.extensions.vault.lockup.lockDuration ??
                          token.extensions.vault.lockup.lock_duration,
                        vestDuration:
                          token.extensions.vault.lockup.vestDuration ??
                          token.extensions.vault.lockup.vest_duration,
                      }
                    : undefined,
                }
              : undefined,
            sniperTax: token.extensions.sniperTax
              ? {
                  startingFee:
                    token.extensions.sniperTax.startingFee ??
                    token.extensions.sniperTax.starting_fee,
                  endingFee:
                    token.extensions.sniperTax.endingFee ??
                    token.extensions.sniperTax.ending_fee,
                  secondsToDecay:
                    token.extensions.sniperTax.secondsToDecay ??
                    token.extensions.sniperTax.seconds_to_decay,
                }
              : undefined,
            positions: token.extensions.positions,
          }
        : undefined,
      socialContext: token.social_context
        ? {
            platform: token.social_context.platform,
            interface: token.social_context.interface,
            messageId:
              token.social_context.messageId ?? token.social_context.message_id,
          }
        : undefined,
      metadata: parsedMetadata,
      market: token.related?.market
        ? {
            startingMarketCap:
              token.related.market.startingMarketCap ??
              token.related.market.starting_market_cap,
          }
        : undefined,
      twitterUrl: token.twitter_url,
      farcasterUrl: token.farcaster_url,
    };

    // Cache the response for 5 minutes
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600',
    );

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch token data' });
  }
}
