// Mocked data for getNotificationsForTab
import { ApiGetNotificationsForTab200Response } from '../types/api';

export const mockedGetNotificationsForTab200Response =
  (): ApiGetNotificationsForTab200Response => {
    return {
      result: {
        notifications: [
          {
            id: 'moderate!token-alert:019adb2b-09ca-ecde-d521-6aafd2bc0229',
            isUnread: true,
            latestTimestamp: 1764613622215,
            previewItems: [
              {
                content: {
                  metadata: {
                    currentPriceUsd: 0.0000923959310354,
                    lowerTargetPriceUsd: 0.000083119352265105,
                    percentChange: 0.05,
                    startingPriceUsd: 0.0000874940550159,
                    upperTargetPriceUsd: 0.000091868757766695,
                  },
                  token: {
                    blockaidQuality: 'Benign',
                    ca: '0x06f71fb90f84b35302d132322a3c90e4477333b0',
                    chain: 'base',
                    circulatingSupply: '88606373287.77942',
                    decimals: 18,
                    description:
                      '$BRACKY is the native token of Bracky, a Sports Agent on Farcaster and beyond. Stake your claim in the inevitable transition of predictive power.',
                    fdv: 9212913,
                    features: { canTrade: true, isTestnet: false },
                    holderCount: 7483,
                    imageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/ec9609ea-07f5-4be3-18ab-e3da03b95400/original',
                    isHighRisk: false,
                    liquidity: 488222,
                    marketCap: 8163228,
                    name: 'BRACKY',
                    priceChangePct: {
                      h24: -11.346954688461405,
                      h6: 1.5850905632182877,
                    },
                    priceUpdatedAt: 1764615780619,
                    priceUsd: '0.0000921291263414',
                    source: {
                      createdAt: 1736625041000,
                      platform: 'clanker',
                      platformUrl:
                        'https://www.clanker.world/clanker/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                    },
                    ticker: 'BRACKY',
                    totalSupply: '100000000000',
                    urls: {
                      blockExplorer:
                        'https://basescan.org/address/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      coingecko: 'https://www.coingecko.com/en/coins/bracky',
                      dexscreener:
                        'https://dexscreener.com/base/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      geckoterminal:
                        'https://www.geckoterminal.com/base/pools/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      twitter: 'https://x.com/brackyHQ',
                      website: 'https://bracket.game',
                    },
                    verifications: [
                      {
                        platform: 'coingecko',
                        platformUrl:
                          'https://www.coingecko.com/en/coins/bracky',
                      },
                    ],
                    volume: { h24: 49739, h6: 27099 },
                    warningType: 'safe',
                  },
                  tokenSubscriptionId: '01993e05-a86f-6b69-bdc8-e6f2bf6c2290',
                  type: 'price-movement-pct',
                },
                id: '019adb2b-09ca-ecde-d521-6aafd2bc0229',
                timestamp: 1764613622215,
                type: 'token-alert',
              },
            ],
            totalItemCount: 1,
            type: 'token-alert',
          },
          {
            id: 'moderate!follow:1183152_1_11_2025',
            isUnread: false,
            latestTimestamp: 1764592180000,
            previewItems: [
              {
                actor: {
                  displayName: 'Nuraline',
                  fid: 307723,
                  followerCount: 844,
                  followingCount: 39,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/24d46c27-61c3-4020-23f9-a5eee8a0e100/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Enabling AI systems to self-improve in production.',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    url: 'https://www.nuraline.ai/',
                  },
                  username: 'nuraline.eth',
                  viewerContext: { followedBy: true, following: false },
                },
                id: '307723',
                timestamp: 1764592180000,
                type: 'follow',
              },
            ],
            totalItemCount: 1,
            type: 'follow',
          },
          {
            id: 'moderate!cast-reaction:0x8c04abc08097d516f6a02539cb0de7887499cc8496fa4aebea8c08e178c0ca9f',
            isUnread: false,
            latestTimestamp: 1764536648000,
            previewItems: [
              {
                actor: {
                  displayName: 'aremu_praise.base.eth',
                  fid: 1413984,
                  followerCount: 559,
                  followingCount: 536,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/00ce9824-d622-465d-928e-111443d2b600/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: ['zora'],
                      text: 'ð Web3 Creator | Building Aremup Coin on @zora\nð Bridging art, nature & innovation\nð Turning vision into value â one cast at a time',
                    },
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                        chain: 'base',
                        imageUrl:
                          'https://ipfs.decentralized-content.com/ipfs/bafybeieg2ffdjdfjpntoyz5sgcd5xsqwyynqcptuh47borwszwpt5qtoei',
                        name: 'aremup',
                        symbol: 'aremup',
                        ticker: 'aremup',
                        tokenId: '01999bd9-f8c4-94c7-a261-5203e5b389e0',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                    },
                    url: '',
                  },
                  username: 'aremup',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x1d23f4b67c4dfa713eda32e4bf1bf7bd771e7827b991c693e0ec6b6271bf1dcc',
                    reactor: {
                      displayName: 'aremu_praise.base.eth',
                      fid: 1413984,
                      followerCount: 559,
                      followingCount: 536,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/00ce9824-d622-465d-928e-111443d2b600/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: ['zora'],
                          text: 'ð Web3 Creator | Building Aremup Coin on @zora\nð Bridging art, nature & innovation\nð Turning vision into value â one cast at a time',
                        },
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                            chain: 'base',
                            imageUrl:
                              'https://ipfs.decentralized-content.com/ipfs/bafybeieg2ffdjdfjpntoyz5sgcd5xsqwyynqcptuh47borwszwpt5qtoei',
                            name: 'aremup',
                            symbol: 'aremup',
                            ticker: 'aremup',
                            tokenId: '01999bd9-f8c4-94c7-a261-5203e5b389e0',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                        },
                        url: '',
                      },
                      username: 'aremup',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764536648000,
                    type: 'like',
                  },
                },
                id: '0x1d23f4b67c4dfa713eda32e4bf1bf7bd771e7827b991c693e0ec6b6271bf1dcc',
                timestamp: 1764536648000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'DropMechanics',
                  fid: 1445880,
                  followerCount: 150,
                  followingCount: 787,
                  pfp: {
                    url: 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1764171337/a1999a4c-63d4-4998-9856-ec6653c398de.jpg',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Lets show love on base. follow me i follow you.. like and i shall return the favor!  https://zora.co/@dropmechanics',
                    },
                    location: { description: '', placeId: '' },
                  },
                  username: '0xd00m.base.eth',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0xb680df836e7e9a967e1ef4f6a13d80653f1220d331605dd01f543f22172d7abb',
                    reactor: {
                      displayName: 'DropMechanics',
                      fid: 1445880,
                      followerCount: 150,
                      followingCount: 787,
                      pfp: {
                        url: 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1764171337/a1999a4c-63d4-4998-9856-ec6653c398de.jpg',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Lets show love on base. follow me i follow you.. like and i shall return the favor!  https://zora.co/@dropmechanics',
                        },
                        location: { description: '', placeId: '' },
                      },
                      username: '0xd00m.base.eth',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1764324395000,
                    type: 'like',
                  },
                },
                id: '0xb680df836e7e9a967e1ef4f6a13d80653f1220d331605dd01f543f22172d7abb',
                timestamp: 1764324395000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Pueyo',
                  fid: 946813,
                  followerCount: 29,
                  followingCount: 96,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4e9e5bcd-f108-4812-37bb-46b3c42a6e00/rectcrop3',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'All about cripto. \n\nWagmi',
                    },
                    location: { description: '', placeId: '' },
                  },
                  username: 'pueyo',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0xc0606e3b18a96253206cf0aca7f3ca4d0cfee6c73e176be08e6efcc23e0c4218',
                    reactor: {
                      displayName: 'Pueyo',
                      fid: 946813,
                      followerCount: 29,
                      followingCount: 96,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4e9e5bcd-f108-4812-37bb-46b3c42a6e00/rectcrop3',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'All about cripto. \n\nWagmi',
                        },
                        location: { description: '', placeId: '' },
                      },
                      username: 'pueyo',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764252194000,
                    type: 'like',
                  },
                },
                id: '0xc0606e3b18a96253206cf0aca7f3ca4d0cfee6c73e176be08e6efcc23e0c4218',
                timestamp: 1764252194000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Eranga.base.eth',
                  fid: 314523,
                  followerCount: 182,
                  followingCount: 1389,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/67470f61-bd4e-41fa-e12b-579c98a65700/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'hello ,',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                        chain: 'base',
                        imageUrl:
                          'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        ticker: 'USDC',
                        tokenId: '0198d322-6e02-d83d-f1fd-09a5338e8a4a',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                    },
                    url: '',
                  },
                  username: 'bandara',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x13ec26e39a99ebb328e479bf5cdd330139947e812613275b2d2815aaaca23605',
                    reactor: {
                      displayName: 'Eranga.base.eth',
                      fid: 314523,
                      followerCount: 182,
                      followingCount: 1389,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/67470f61-bd4e-41fa-e12b-579c98a65700/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'hello ,',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                            chain: 'base',
                            imageUrl:
                              'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
                            name: 'USD Coin',
                            symbol: 'USDC',
                            ticker: 'USDC',
                            tokenId: '0198d322-6e02-d83d-f1fd-09a5338e8a4a',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                        },
                        url: '',
                      },
                      username: 'bandara',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1764226260000,
                    type: 'like',
                  },
                },
                id: '0x13ec26e39a99ebb328e479bf5cdd330139947e812613275b2d2815aaaca23605',
                timestamp: 1764226260000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Harold Holness',
                  fid: 868055,
                  followerCount: 1143,
                  followingCount: 213,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1db3425f-09b2-47eb-33a7-437bf6c80000/rectcrop3',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Fitness lifestyle, proud husband/father, and a sneakerhead. Specializing in Human Performance. BS Exercise Science\nNASM: CPT-CES-PES-GPTS',
                    },
                    location: {
                      description: 'Los Angeles, CA, USA',
                      placeId: 'ChIJE9on3F3HwoAR9AhGJW_fL-I',
                    },
                  },
                  username: 'coach-holness',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x92ba677d93c4d47817921ec73764269250e391a29c3f5381a24923ade57abc7c',
                    reactor: {
                      displayName: 'Harold Holness',
                      fid: 868055,
                      followerCount: 1143,
                      followingCount: 213,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1db3425f-09b2-47eb-33a7-437bf6c80000/rectcrop3',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Fitness lifestyle, proud husband/father, and a sneakerhead. Specializing in Human Performance. BS Exercise Science\nNASM: CPT-CES-PES-GPTS',
                        },
                        location: {
                          description: 'Los Angeles, CA, USA',
                          placeId: 'ChIJE9on3F3HwoAR9AhGJW_fL-I',
                        },
                      },
                      username: 'coach-holness',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764217736000,
                    type: 'like',
                  },
                },
                id: '0x92ba677d93c4d47817921ec73764269250e391a29c3f5381a24923ade57abc7c',
                timestamp: 1764217736000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'monadeleinemcann',
                  fid: 1448033,
                  followerCount: 59,
                  followingCount: 51,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/dee54090-af03-46b9-a1d4-530f57c3e000/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'monad needs naddies',
                    },
                    location: { description: '', placeId: '' },
                    profileToken: { tokenUri: '' },
                    url: '',
                  },
                  username: 'monadeleinemcann',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x4a5469c868876d3efb645bf028b74e1b219f573508d96d9353770d1000204b0b',
                    reactor: {
                      displayName: 'monadeleinemcann',
                      fid: 1448033,
                      followerCount: 59,
                      followingCount: 51,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/dee54090-af03-46b9-a1d4-530f57c3e000/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'monad needs naddies',
                        },
                        location: { description: '', placeId: '' },
                        profileToken: { tokenUri: '' },
                        url: '',
                      },
                      username: 'monadeleinemcann',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764196880000,
                    type: 'like',
                  },
                },
                id: '0x4a5469c868876d3efb645bf028b74e1b219f573508d96d9353770d1000204b0b',
                timestamp: 1764196880000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'akshaan',
                  fid: 9052,
                  followerCount: 2211,
                  followingCount: 444,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a878be9d-ce55-4d65-eb2e-d2fd0a424d00/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/fab9d3a5-47a5-4c6b-17a1-6065fb592400/original',
                    bio: {
                      channelMentions: [],
                      mentions: ['farcaster'],
                      text: 'working on @farcaster',
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'New York, NY, USA',
                      placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                    },
                    url: '',
                  },
                  username: 'akshaan',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x8718e9e1efcf081ce32377f8561f38358fde2468125a01819fc352ed58917a2e',
                    reactor: {
                      displayName: 'akshaan',
                      fid: 9052,
                      followerCount: 2211,
                      followingCount: 444,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a878be9d-ce55-4d65-eb2e-d2fd0a424d00/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/fab9d3a5-47a5-4c6b-17a1-6065fb592400/original',
                        bio: {
                          channelMentions: [],
                          mentions: ['farcaster'],
                          text: 'working on @farcaster',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'New York, NY, USA',
                          placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                        },
                        url: '',
                      },
                      username: 'akshaan',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764192845000,
                    type: 'like',
                  },
                },
                id: '0x8718e9e1efcf081ce32377f8561f38358fde2468125a01819fc352ed58917a2e',
                timestamp: 1764192845000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'The Dude Bartðð³ ââ¨-â¨',
                  fid: 13874,
                  followerCount: 9726,
                  followingCount: 5728,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/77692cb0-6fb5-40c7-ced3-42353e178b00/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/45756155-8aaf-4370-a37c-c14ced997400/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Digital Media Producer. I like particles and waves too. I like art.',
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'New York, NY, USA',
                      placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                    },
                    profileToken: {
                      token: {
                        ca: '0x014d482f8403227cf65e1512e94d95606d536b07',
                        chain: 'arbitrum',
                        imageUrl:
                          'https://imagedelivery.net/Jdikl5mtCqTt4eK2PPpTlA/5f9758b9-3927-48f4-9d46-5a73efbad800/public',
                        name: 'Bribe',
                        symbol: 'bribe',
                        ticker: 'bribe',
                        tokenId: '01991d99-d187-09f3-f17c-b7627ad4753f',
                      },
                      tokenUri:
                        'eip155:42161/erc20:0x014d482f8403227cf65e1512e94d95606d536b07',
                    },
                    url: '',
                  },
                  username: 'thedude',
                  viewerContext: { followedBy: true, following: true },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x5a06c8082dd5703b61e1821ace84458f6da698930caf8858a1558b9424a5585e',
                    reactor: {
                      displayName: 'The Dude Bartðð³ ââ¨-â¨',
                      fid: 13874,
                      followerCount: 9726,
                      followingCount: 5728,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/77692cb0-6fb5-40c7-ced3-42353e178b00/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/45756155-8aaf-4370-a37c-c14ced997400/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Digital Media Producer. I like particles and waves too. I like art.',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'New York, NY, USA',
                          placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                        },
                        profileToken: {
                          token: {
                            ca: '0x014d482f8403227cf65e1512e94d95606d536b07',
                            chain: 'arbitrum',
                            imageUrl:
                              'https://imagedelivery.net/Jdikl5mtCqTt4eK2PPpTlA/5f9758b9-3927-48f4-9d46-5a73efbad800/public',
                            name: 'Bribe',
                            symbol: 'bribe',
                            ticker: 'bribe',
                            tokenId: '01991d99-d187-09f3-f17c-b7627ad4753f',
                          },
                          tokenUri:
                            'eip155:42161/erc20:0x014d482f8403227cf65e1512e94d95606d536b07',
                        },
                        url: '',
                      },
                      username: 'thedude',
                      viewerContext: { followedBy: true, following: true },
                    },
                    timestamp: 1764188366000,
                    type: 'like',
                  },
                },
                id: '0x5a06c8082dd5703b61e1821ace84458f6da698930caf8858a1558b9424a5585e',
                timestamp: 1764188366000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: "Larxzy's",
                  fid: 1149403,
                  followerCount: 138,
                  followingCount: 417,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/c0ed6067-3db6-4138-e080-463b321b3200/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: "I'm still learning about What's Web3 is and keep trying to learn a new things.\nZora : https://zora.co/@archernarlz\nTwitter : https://x.com/gentapalapaa?t=eYaRCi",
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: 'F3EF3t4g7FmfiLXD8ZcHBLE8fZezUy7GdLtVs2kwpump',
                        chain: 'solana',
                        imageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d269fdd3-b83d-4cf7-3e40-590b55330100/original',
                        name: 'TikTok Meme',
                        symbol: 'MEME',
                        ticker: 'MEME',
                        tokenId: '019ace22-e3cf-6117-5ef7-0f0fd7dbc5fb',
                      },
                      tokenUri:
                        'solana:101/address:F3EF3t4g7FmfiLXD8ZcHBLE8fZezUy7GdLtVs2kwpump',
                    },
                    url: '',
                  },
                  username: 'larxzy',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x9bfc5369e7f644195f87fd4a4d35ed9355ff8cefa3d7cfa5ee110eea1e735756',
                    reactor: {
                      displayName: "Larxzy's",
                      fid: 1149403,
                      followerCount: 138,
                      followingCount: 417,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/c0ed6067-3db6-4138-e080-463b321b3200/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: "I'm still learning about What's Web3 is and keep trying to learn a new things.\nZora : https://zora.co/@archernarlz\nTwitter : https://x.com/gentapalapaa?t=eYaRCi",
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: 'F3EF3t4g7FmfiLXD8ZcHBLE8fZezUy7GdLtVs2kwpump',
                            chain: 'solana',
                            imageUrl:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d269fdd3-b83d-4cf7-3e40-590b55330100/original',
                            name: 'TikTok Meme',
                            symbol: 'MEME',
                            ticker: 'MEME',
                            tokenId: '019ace22-e3cf-6117-5ef7-0f0fd7dbc5fb',
                          },
                          tokenUri:
                            'solana:101/address:F3EF3t4g7FmfiLXD8ZcHBLE8fZezUy7GdLtVs2kwpump',
                        },
                        url: '',
                      },
                      username: 'larxzy',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764184331000,
                    type: 'like',
                  },
                },
                id: '0x9bfc5369e7f644195f87fd4a4d35ed9355ff8cefa3d7cfa5ee110eea1e735756',
                timestamp: 1764184331000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'tabledadrian',
                  fid: 1406368,
                  followerCount: 1098,
                  followingCount: 1484,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0d9e007d-2b5d-4677-6c66-aa5a4120bd00/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4c8346b2-2836-4067-1eff-1905cc925800/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Private chef. Founder Table dâAdrian. Wellness, nutrition, blockchain.',
                    },
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07',
                        chain: 'base',
                        imageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1a01ac71-a507-498d-7099-60ca6c6a9200/original',
                        name: 'ta',
                        symbol: 'tabledadrian',
                        ticker: 'tabledadrian',
                        tokenId: '019abb8e-ad91-5060-2695-a585e4353790',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07',
                    },
                    url: 'https://tabledadrian.com',
                  },
                  username: 'adrsteph.base.eth',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x8d98b130cf0ac9506e7c93ea4e5186722a5af31a7e7b31928a372bc39dc7eab7',
                    reactor: {
                      displayName: 'tabledadrian',
                      fid: 1406368,
                      followerCount: 1098,
                      followingCount: 1484,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0d9e007d-2b5d-4677-6c66-aa5a4120bd00/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4c8346b2-2836-4067-1eff-1905cc925800/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Private chef. Founder Table dâAdrian. Wellness, nutrition, blockchain.',
                        },
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07',
                            chain: 'base',
                            imageUrl:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1a01ac71-a507-498d-7099-60ca6c6a9200/original',
                            name: 'ta',
                            symbol: 'tabledadrian',
                            ticker: 'tabledadrian',
                            tokenId: '019abb8e-ad91-5060-2695-a585e4353790',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07',
                        },
                        url: 'https://tabledadrian.com',
                      },
                      username: 'adrsteph.base.eth',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764175673000,
                    type: 'like',
                  },
                },
                id: '0x8d98b130cf0ac9506e7c93ea4e5186722a5af31a7e7b31928a372bc39dc7eab7',
                timestamp: 1764175673000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'horsefacts',
                  fid: 3621,
                  followerCount: 214764,
                  followingCount: 6360,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4e2117ec-3a6e-4a96-127c-591fd0057f00/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/709c5d59-7025-4840-7c8d-8adc4095b000/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'I work at the posts office.',
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'New York, NY, USA',
                      placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                    },
                    profileToken: {
                      token: {
                        ca: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                        chain: 'base',
                        imageUrl:
                          'https://coin-images.coingecko.com/coins/images/53103/large/superbridge-bridged-wsteth-base.png?1735227990',
                        name: 'Wrapped liquid staked Ether 2.0',
                        symbol: 'wstETH',
                        ticker: 'wstETH',
                        tokenId: '0198e8ed-d6ac-7b0f-3a46-a5820af82b39',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                    },
                    url: 'https://terminally.online',
                  },
                  referrerUsername: 'dwr',
                  username: 'horsefacts.eth',
                  viewerContext: { followedBy: true, following: true },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764430495895,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764430409495,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x3986fde922939024fac767fd468998902b346d0a',
                      tokenId:
                        '328422892533654127395019425559354394692642172170',
                    },
                    combinedRecastCount: 2,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 426,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                            version: '2',
                            width: 640,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original',
                        },
                      ],
                      processedCastText:
                        "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0x3986fde922939024fac767fd468998902b346d0a',
                    quoteCount: 0,
                    reactions: { count: 14 },
                    recasts: {
                      count: 2,
                      recasters: [
                        {
                          displayName: 'The Dude Bartðð³ ââ¨-â¨',
                          fid: 13874,
                          recastHash:
                            '0x83413860d30b0222ec5abd3cf0f58c33faf39b01',
                          username: 'thedude',
                        },
                      ],
                    },
                    replies: { count: 1 },
                    tags: [],
                    text: "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures",
                    textWithEmbeds:
                      "Here's documentation of some UI components, I've not included a screenshot because a word is worth a thousand pictures https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/429aa13b-3411-456c-47cd-b2094e58b400/original",
                    threadHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    timestamp: 1764171143000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0x3986fde922939024fac767fd468998902b346d0a',
                    hash: '0x8b5ac4605f5d1d944d079b066da450c621abb7684d3834aadc131d544caad1e7',
                    reactor: {
                      displayName: 'horsefacts',
                      fid: 3621,
                      followerCount: 214764,
                      followingCount: 6360,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4e2117ec-3a6e-4a96-127c-591fd0057f00/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/709c5d59-7025-4840-7c8d-8adc4095b000/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I work at the posts office.',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'New York, NY, USA',
                          placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                        },
                        profileToken: {
                          token: {
                            ca: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                            chain: 'base',
                            imageUrl:
                              'https://coin-images.coingecko.com/coins/images/53103/large/superbridge-bridged-wsteth-base.png?1735227990',
                            name: 'Wrapped liquid staked Ether 2.0',
                            symbol: 'wstETH',
                            ticker: 'wstETH',
                            tokenId: '0198e8ed-d6ac-7b0f-3a46-a5820af82b39',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                        },
                        url: 'https://terminally.online',
                      },
                      referrerUsername: 'dwr',
                      username: 'horsefacts.eth',
                      viewerContext: { followedBy: true, following: true },
                    },
                    timestamp: 1764174252000,
                    type: 'like',
                  },
                },
                id: '0x8b5ac4605f5d1d944d079b066da450c621abb7684d3834aadc131d544caad1e7',
                timestamp: 1764174252000,
                type: 'cast-reaction',
              },
            ],
            totalItemCount: 12,
            type: 'cast-reaction',
          },
          {
            id: 'moderate!cast-reaction:0x22670848f0704136a99cef3929197fbfdd0f2888ea28fbf7d2e9763c2710b212',
            isUnread: false,
            latestTimestamp: 1764536646000,
            previewItems: [
              {
                actor: {
                  displayName: 'aremu_praise.base.eth',
                  fid: 1413984,
                  followerCount: 559,
                  followingCount: 536,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/00ce9824-d622-465d-928e-111443d2b600/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: ['zora'],
                      text: 'ð Web3 Creator | Building Aremup Coin on @zora\nð Bridging art, nature & innovation\nð Turning vision into value â one cast at a time',
                    },
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                        chain: 'base',
                        imageUrl:
                          'https://ipfs.decentralized-content.com/ipfs/bafybeieg2ffdjdfjpntoyz5sgcd5xsqwyynqcptuh47borwszwpt5qtoei',
                        name: 'aremup',
                        symbol: 'aremup',
                        ticker: 'aremup',
                        tokenId: '01999bd9-f8c4-94c7-a261-5203e5b389e0',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                    },
                    url: '',
                  },
                  username: 'aremup',
                  viewerContext: { followedBy: false, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0xfb28cf2bcc1fa1d34ed802a7c315e880769151041fba9516c1cdcabe873b2449',
                    reactor: {
                      displayName: 'aremu_praise.base.eth',
                      fid: 1413984,
                      followerCount: 559,
                      followingCount: 536,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/00ce9824-d622-465d-928e-111443d2b600/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: ['zora'],
                          text: 'ð Web3 Creator | Building Aremup Coin on @zora\nð Bridging art, nature & innovation\nð Turning vision into value â one cast at a time',
                        },
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                            chain: 'base',
                            imageUrl:
                              'https://ipfs.decentralized-content.com/ipfs/bafybeieg2ffdjdfjpntoyz5sgcd5xsqwyynqcptuh47borwszwpt5qtoei',
                            name: 'aremup',
                            symbol: 'aremup',
                            ticker: 'aremup',
                            tokenId: '01999bd9-f8c4-94c7-a261-5203e5b389e0',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xd7cc6567e5e445a7d84b62e5e7d98f88fd3baf48',
                        },
                        url: '',
                      },
                      username: 'aremup',
                      viewerContext: { followedBy: false, following: false },
                    },
                    timestamp: 1764536646000,
                    type: 'like',
                  },
                },
                id: '0xfb28cf2bcc1fa1d34ed802a7c315e880769151041fba9516c1cdcabe873b2449',
                timestamp: 1764536646000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'DropMechanics',
                  fid: 1445880,
                  followerCount: 150,
                  followingCount: 787,
                  pfp: {
                    url: 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1764171337/a1999a4c-63d4-4998-9856-ec6653c398de.jpg',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Lets show love on base. follow me i follow you.. like and i shall return the favor!  https://zora.co/@dropmechanics',
                    },
                    location: { description: '', placeId: '' },
                  },
                  username: '0xd00m.base.eth',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0x5bbc0250b0a863fe44d39b06b9e3f59af5cdd7e3c9cf0342bd2669f00afb9d24',
                    reactor: {
                      displayName: 'DropMechanics',
                      fid: 1445880,
                      followerCount: 150,
                      followingCount: 787,
                      pfp: {
                        url: 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1764171337/a1999a4c-63d4-4998-9856-ec6653c398de.jpg',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Lets show love on base. follow me i follow you.. like and i shall return the favor!  https://zora.co/@dropmechanics',
                        },
                        location: { description: '', placeId: '' },
                      },
                      username: '0xd00m.base.eth',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1764324400000,
                    type: 'like',
                  },
                },
                id: '0x5bbc0250b0a863fe44d39b06b9e3f59af5cdd7e3c9cf0342bd2669f00afb9d24',
                timestamp: 1764324400000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Coin Mining vs Airdrop',
                  fid: 353186,
                  followerCount: 170,
                  followingCount: 753,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/c39237ff-b4d4-4091-4914-e24f8ec3b300/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/cd00bab4-e293-46bf-de7d-5b541e2b6000/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Love mining coins and investing in cryptocurrencies.',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                        chain: 'base',
                        imageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/01074a7e-9228-420f-3f58-7649ef889500/original',
                        name: 'Degen',
                        symbol: 'DEGEN',
                        ticker: 'DEGEN',
                        tokenId: '0198cf9a-efd8-6b2b-d06a-3913d55ebbd3',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                    },
                  },
                  username: 'coinminer',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0xfbbc0e4a6cdb8dcc3bb8a8d965216d703844ce2de723d1bc6ace94e24eb13082',
                    reactor: {
                      displayName: 'Coin Mining vs Airdrop',
                      fid: 353186,
                      followerCount: 170,
                      followingCount: 753,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/c39237ff-b4d4-4091-4914-e24f8ec3b300/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/cd00bab4-e293-46bf-de7d-5b541e2b6000/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Love mining coins and investing in cryptocurrencies.',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                            chain: 'base',
                            imageUrl:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/01074a7e-9228-420f-3f58-7649ef889500/original',
                            name: 'Degen',
                            symbol: 'DEGEN',
                            ticker: 'DEGEN',
                            tokenId: '0198cf9a-efd8-6b2b-d06a-3913d55ebbd3',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                        },
                      },
                      username: 'coinminer',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1763523790000,
                    type: 'like',
                  },
                },
                id: '0xfbbc0e4a6cdb8dcc3bb8a8d965216d703844ce2de723d1bc6ace94e24eb13082',
                timestamp: 1763523790000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Saba2552.base.eth',
                  fid: 311327,
                  followerCount: 1857,
                  followingCount: 4681,
                  pfp: {
                    url: 'https://ipfs.decentralized-content.com/ipfs/bafybeieeas5p7uc2uj6xozmrlxxl5wpa7ribw5s6dxaad2qseljc6x6aha',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/eef5a17d-0b30-41d0-dd3b-7a068e334900/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Trading the markets, capturing life through my lens, climbing mountains to find new perspectives, and collecting treasures that tell stories. Always exploring.',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                        chain: 'base',
                        imageUrl:
                          'https://coin-images.coingecko.com/coins/images/34515/large/android-chrome-512x512.png?1706198225',
                        name: 'Degen',
                        symbol: 'DEGEN',
                        ticker: 'DEGEN',
                        tokenId: '0198cf9a-efd8-6b2b-d06a-3913d55ebbd3',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                    },
                    url: '',
                  },
                  username: 'saba2552',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0xff80cd390023696a2f083db07a5793495e4d3c5daa22c3480adcc1034a01be5b',
                    reactor: {
                      displayName: 'Saba2552.base.eth',
                      fid: 311327,
                      followerCount: 1857,
                      followingCount: 4681,
                      pfp: {
                        url: 'https://ipfs.decentralized-content.com/ipfs/bafybeieeas5p7uc2uj6xozmrlxxl5wpa7ribw5s6dxaad2qseljc6x6aha',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/eef5a17d-0b30-41d0-dd3b-7a068e334900/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Trading the markets, capturing life through my lens, climbing mountains to find new perspectives, and collecting treasures that tell stories. Always exploring.',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                            chain: 'base',
                            imageUrl:
                              'https://coin-images.coingecko.com/coins/images/34515/large/android-chrome-512x512.png?1706198225',
                            name: 'Degen',
                            symbol: 'DEGEN',
                            ticker: 'DEGEN',
                            tokenId: '0198cf9a-efd8-6b2b-d06a-3913d55ebbd3',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                        },
                        url: '',
                      },
                      username: 'saba2552',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1762537512000,
                    type: 'like',
                  },
                },
                id: '0xff80cd390023696a2f083db07a5793495e4d3c5daa22c3480adcc1034a01be5b',
                timestamp: 1762537512000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Joy',
                  fid: 1044514,
                  followerCount: 608,
                  followingCount: 77,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1e43f678-f7a8-4797-9107-819179276600/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: "Building a cure for cancer onchain ð©ââï¸\nI'm also an expert in tokenomics and brand design. dm for collabs",
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'Paris, France',
                      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
                    },
                    newUserBadge: false,
                    profileToken: {
                      token: {
                        ca: '0xad9e7fe5b2d33e52ff0d65e1290846c6cb6452f3',
                        chain: 'base',
                        imageUrl:
                          'https://ipfs.decentralized-content.com/ipfs/bafybeiegz2lmcuflrpw4nr4wazcg4ge3jajmjyjwr2by5vgbowayxjrqhq',
                        name: 'thecryptobaddie',
                        symbol: 'thecryptobaddie',
                        ticker: 'thecryptobaddie',
                        tokenId: '0198ed71-25c1-77d1-4d51-1047522cc359',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xad9e7fe5b2d33e52ff0d65e1290846c6cb6452f3',
                    },
                    url: '',
                  },
                  username: 'cryptobaddie',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0x9e6f7eec494d8e4a895f92a14f02ebcccb425436d1e083fa0ac60dbff4a8529b',
                    reactor: {
                      displayName: 'Joy',
                      fid: 1044514,
                      followerCount: 608,
                      followingCount: 77,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1e43f678-f7a8-4797-9107-819179276600/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: "Building a cure for cancer onchain ð©ââï¸\nI'm also an expert in tokenomics and brand design. dm for collabs",
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'Paris, France',
                          placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
                        },
                        newUserBadge: false,
                        profileToken: {
                          token: {
                            ca: '0xad9e7fe5b2d33e52ff0d65e1290846c6cb6452f3',
                            chain: 'base',
                            imageUrl:
                              'https://ipfs.decentralized-content.com/ipfs/bafybeiegz2lmcuflrpw4nr4wazcg4ge3jajmjyjwr2by5vgbowayxjrqhq',
                            name: 'thecryptobaddie',
                            symbol: 'thecryptobaddie',
                            ticker: 'thecryptobaddie',
                            tokenId: '0198ed71-25c1-77d1-4d51-1047522cc359',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xad9e7fe5b2d33e52ff0d65e1290846c6cb6452f3',
                        },
                        url: '',
                      },
                      username: 'cryptobaddie',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1762439969000,
                    type: 'like',
                  },
                },
                id: '0x9e6f7eec494d8e4a895f92a14f02ebcccb425436d1e083fa0ac60dbff4a8529b',
                timestamp: 1762439969000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'Chermin ð¤',
                  fid: 1332446,
                  followerCount: 20,
                  followingCount: 1,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b38cd589-7280-4371-ab1b-84d876234900/original',
                    verified: false,
                  },
                  profile: {
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'My husband is developing this app so I get to enjoy it like a regular user ââ ðð»ð¥ðð·â¥ï¸\nââ xx Living, Investing and Growing! xx',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    url: '',
                  },
                  username: 'chermin23',
                  viewerContext: { followedBy: true, following: true },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0xb46eecff4f882f1bc3bbc2cdf8dd8ef62cc709ca6f47cd6217fbb8ee573b0777',
                    reactor: {
                      displayName: 'Chermin ð¤',
                      fid: 1332446,
                      followerCount: 20,
                      followingCount: 1,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b38cd589-7280-4371-ab1b-84d876234900/original',
                        verified: false,
                      },
                      profile: {
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'My husband is developing this app so I get to enjoy it like a regular user ââ ðð»ð¥ðð·â¥ï¸\nââ xx Living, Investing and Growing! xx',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        url: '',
                      },
                      username: 'chermin23',
                      viewerContext: { followedBy: true, following: true },
                    },
                    timestamp: 1761961356000,
                    type: 'like',
                  },
                },
                id: '0xb46eecff4f882f1bc3bbc2cdf8dd8ef62cc709ca6f47cd6217fbb8ee573b0777',
                timestamp: 1761961356000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'tani',
                  fid: 2341,
                  followerCount: 7466,
                  followingCount: 1095,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0a1dc0bd-cdf3-4bc7-af2e-28ce90b0dd00/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d1259b20-d006-44ba-e452-eecd95900800/original',
                    bio: {
                      channelMentions: ['tanishq', 'neo-revival'],
                      mentions: ['farcaster'],
                      text: '@farcaster. self-notes /tanishq. art /neo-revival.',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        chain: 'base',
                        imageUrl:
                          'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                        name: 'Ethereum',
                        symbol: 'ETH',
                        ticker: 'ETH',
                        tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                    },
                    url: 'https://tanishq.xyz',
                  },
                  referrerUsername: 'dwr',
                  username: 'tanishq',
                  viewerContext: { followedBy: true, following: true },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0x993db68596a1b91026ed7eec6ca1a40ecb734ddab6bf8c375b8bf77dcc5e2567',
                    reactor: {
                      displayName: 'tani',
                      fid: 2341,
                      followerCount: 7466,
                      followingCount: 1095,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0a1dc0bd-cdf3-4bc7-af2e-28ce90b0dd00/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d1259b20-d006-44ba-e452-eecd95900800/original',
                        bio: {
                          channelMentions: ['tanishq', 'neo-revival'],
                          mentions: ['farcaster'],
                          text: '@farcaster. self-notes /tanishq. art /neo-revival.',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: 'https://tanishq.xyz',
                      },
                      referrerUsername: 'dwr',
                      username: 'tanishq',
                      viewerContext: { followedBy: true, following: true },
                    },
                    timestamp: 1761830021000,
                    type: 'like',
                  },
                },
                id: '0x993db68596a1b91026ed7eec6ca1a40ecb734ddab6bf8c375b8bf77dcc5e2567',
                timestamp: 1761830021000,
                type: 'cast-reaction',
              },
              {
                actor: {
                  displayName: 'The Black Swordsman',
                  fid: 615647,
                  followerCount: 1017,
                  followingCount: 889,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/6bd47abd-0692-44a8-d85b-34f5ea497600/original',
                    verified: false,
                  },
                  profile: {
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/9bc1b153-aacf-46bc-702c-7cb5546aff00/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Learning Blockchain || Gymrat || Posting 10/10 brainrots on zora',
                    },
                    earlyWalletAdopter: true,
                    location: { description: '', placeId: '' },
                    profileToken: {
                      token: {
                        ca: '0xa4ae1d270516e7695d57b8ffeda73787cf4f898c',
                        chain: 'base',
                        imageUrl:
                          'https://ipfs.decentralized-content.com/ipfs/bafybeiaqowyh7oz5f4vmn44ah5bawl4lhemxklwsap2w275nugwoq4mria',
                        name: 'legendsword',
                        symbol: 'legendsword',
                        ticker: 'legendsword',
                        tokenId: '0198f99d-adb5-2079-5d38-81f7fe74dab1',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xa4ae1d270516e7695d57b8ffeda73787cf4f898c',
                    },
                    url: 'https://zora.co/@genzbrainrot',
                  },
                  username: 'legendsword.eth',
                  viewerContext: { followedBy: true, following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 378,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764421542270,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764421455870,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                      tokenId:
                        '1409816930461452205859914139288409449898608244383',
                    },
                    combinedRecastCount: 0,
                    embeds: {
                      groupInvites: [],
                      images: [
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 78,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                            version: '2',
                            width: 308,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original',
                        },
                        {
                          alt: 'Cast image embed',
                          media: {
                            height: 66,
                            mimeType: 'image/jpeg',
                            staticRaster:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                            version: '2',
                            width: 290,
                          },
                          sourceUrl:
                            'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                          type: 'image',
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                        },
                      ],
                      processedCastText: '1% better every day',
                      transactions: [],
                      unknowns: [],
                      urls: [],
                      videos: [],
                    },
                    hash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    quoteCount: 0,
                    reactions: { count: 11 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [],
                    text: '1% better every day',
                    textWithEmbeds:
                      '1% better every day https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/739c22ce-3ccb-4740-0302-eb5003633100/original https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e750cfe9-68f7-4c90-78a5-e64413b0ae00/original',
                    threadHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    timestamp: 1761828438000,
                    viewCount: 300,
                    watches: { count: 0 },
                  },
                  reaction: {
                    castHash: '0xf6f260a9a0acd1fd488526c8fe65d0e42b3d369f',
                    hash: '0xc693edc57f37d4abc669f22affccf49124c7242abcef3dd062409b2b7a191148',
                    reactor: {
                      displayName: 'The Black Swordsman',
                      fid: 615647,
                      followerCount: 1017,
                      followingCount: 889,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/6bd47abd-0692-44a8-d85b-34f5ea497600/original',
                        verified: false,
                      },
                      profile: {
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/9bc1b153-aacf-46bc-702c-7cb5546aff00/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Learning Blockchain || Gymrat || Posting 10/10 brainrots on zora',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xa4ae1d270516e7695d57b8ffeda73787cf4f898c',
                            chain: 'base',
                            imageUrl:
                              'https://ipfs.decentralized-content.com/ipfs/bafybeiaqowyh7oz5f4vmn44ah5bawl4lhemxklwsap2w275nugwoq4mria',
                            name: 'legendsword',
                            symbol: 'legendsword',
                            ticker: 'legendsword',
                            tokenId: '0198f99d-adb5-2079-5d38-81f7fe74dab1',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xa4ae1d270516e7695d57b8ffeda73787cf4f898c',
                        },
                        url: 'https://zora.co/@genzbrainrot',
                      },
                      username: 'legendsword.eth',
                      viewerContext: { followedBy: true, following: false },
                    },
                    timestamp: 1761829387000,
                    type: 'like',
                  },
                },
                id: '0xc693edc57f37d4abc669f22affccf49124c7242abcef3dd062409b2b7a191148',
                timestamp: 1761829387000,
                type: 'cast-reaction',
              },
            ],
            totalItemCount: 8,
            type: 'cast-reaction',
          },
          {
            id: 'moderate!trader-alert:019ad0c9-9698-5aeb-abb6-bec2ec776d35',
            isUnread: false,
            latestTimestamp: 1764439463243,
            previewItems: [
              {
                content: {
                  metadata: {
                    receivedAmount: 1.7104244167076668,
                    receivedToken: {
                      blockaidQuality: 'Benign',
                      ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                      chain: 'base',
                      circulatingSupply: 120706552,
                      coingeckoId: 'ethereum',
                      decimals: 18,
                      fdv: 359294544833.1731,
                      features: { canTrade: true, isTestnet: false },
                      id: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                      imageUrl:
                        'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/42b0e48e-b77e-4c48-8770-4621d5f75700/original',
                      isHighRisk: false,
                      marketCap: 359294544833.1731,
                      name: 'Ethereum',
                      priceChangePct: {
                        h24: -1.7673359247106537,
                        h6: -0.6791131118487483,
                      },
                      priceUpdatedAt: 1764439442198,
                      priceUsd: 2976.59521277,
                      source: { createdAt: 1438228800000 },
                      symbol: 'ETH',
                      totalSupply: 120706552,
                      updatedAt: 1764439382558,
                      urls: {
                        coingecko:
                          'https://www.coingecko.com/en/coins/ethereum',
                      },
                      verifications: [
                        {
                          platform: 'coingecko',
                          platformUrl:
                            'https://www.coingecko.com/en/coins/ethereum',
                        },
                      ],
                    },
                    sentAmount: 108653.96381850861,
                    sentToken: {
                      blockaidQuality: 'Benign',
                      ca: '0xae4a37d554c6d6f3e398546d8566b25052e0169c',
                      chain: 'base',
                      circulatingSupply: 7541592,
                      decimals: 18,
                      fdv: 396148,
                      features: { canTrade: true, isTestnet: false },
                      id: '019a6f7b-5be4-a91b-95d8-056bbeb6a311',
                      imageUrl:
                        'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/902452da-6609-4085-1c1e-5215ea6bdc00/original',
                      isHighRisk: false,
                      liquidity: 47751,
                      marketCap: 396148,
                      name: 'Donut',
                      priceChangePct: {
                        h24: -0.7661370564343202,
                        h6: -6.026859503210969,
                      },
                      priceUpdatedAt: 1764439441997,
                      priceUsd: 0.0525284520193,
                      source: { createdAt: 1762804333000 },
                      symbol: 'DONUT',
                      totalSupply: 7541592,
                      updatedAt: 1764439375461,
                      urls: {
                        blockExplorer:
                          'https://basescan.org/address/0xae4a37d554c6d6f3e398546d8566b25052e0169c',
                        dexscreener:
                          'https://dexscreener.com/base/0xae4a37d554c6d6f3e398546d8566b25052e0169c',
                        geckoterminal:
                          'https://www.geckoterminal.com/base/pools/0xae4a37d554c6d6f3e398546d8566b25052e0169c',
                        website:
                          'https://farcaster.xyz/miniapps/fOIgVq2bFKru/glazecorp',
                      },
                      volume: { h24: 190502, h6: 69123 },
                    },
                  },
                  targetUser: {
                    displayName: 'six',
                    fid: 7143,
                    followerCount: 50908,
                    followingCount: 1599,
                    pfp: {
                      url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/369e589f-411d-4f79-33d7-23db67792e00/original',
                      verified: false,
                    },
                    profile: {
                      accountLevel: 'pro',
                      bannerImageUrl:
                        'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d75abafd-83e2-471b-79d9-c6e4c809bb00/original',
                      bio: { channelMentions: [], mentions: [], text: '' },
                      earlyWalletAdopter: true,
                      location: { description: '', placeId: '' },
                      profileToken: { tokenUri: '' },
                      url: '',
                    },
                    username: 'six',
                    viewerContext: {
                      castNotificationsType: 'priority',
                      enableNotifications: true,
                      followedBy: true,
                      following: true,
                      traderNotificationThreshold: 1000,
                      traderNotificationsType: 'token-algo',
                    },
                  },
                  traderSubscriptionId: '019a851d-7594-8ca4-0eff-6967ea610d29',
                  type: 'token-swapped',
                },
                id: '019ad0c9-9698-5aeb-abb6-bec2ec776d35',
                timestamp: 1764439463243,
                type: 'trader-alert',
              },
            ],
            totalItemCount: 1,
            type: 'trader-alert',
          },
          {
            id: 'moderate!cast-reply:0x020bcb219a9d192725e25a1005480e34500c1d3b',
            isUnread: false,
            latestTimestamp: 1764173621000,
            previewItems: [
              {
                actor: {
                  displayName: 'Raspberry Shake',
                  fid: 372916,
                  followerCount: 180,
                  followingCount: 81,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0b4a5d2f-9cfe-4793-5b34-832227f6e300/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/dbfbfcc7-69db-42c1-9b6c-edde3483e400/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'Citizen science-powered earthquake monitoring network. We share our journey of going bankless, advocate for what our biz needs onchain & experiment. "warp warp"',
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'Boquete, ChiriquÃ­ Province, Panama',
                      placeId: 'ChIJWYPOC9_spY8RdI653z0wmMA',
                    },
                    profileToken: {
                      token: {
                        ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        chain: 'ethereum',
                        imageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/42b0e48e-b77e-4c48-8770-4621d5f75700/original',
                        name: 'Ethereum',
                        symbol: 'ETH',
                        ticker: 'ETH',
                        tokenId: '0198d3c5-362b-bc05-1ba0-9e5744febc19',
                      },
                      tokenUri:
                        'eip155:1/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                    },
                    url: 'https://raspberryshake.org',
                  },
                  username: 'raspishake',
                  viewerContext: { following: false },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'Raspberry Shake',
                      fid: 372916,
                      followerCount: 180,
                      followingCount: 81,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0b4a5d2f-9cfe-4793-5b34-832227f6e300/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/dbfbfcc7-69db-42c1-9b6c-edde3483e400/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Citizen science-powered earthquake monitoring network. We share our journey of going bankless, advocate for what our biz needs onchain & experiment. "warp warp"',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'Boquete, ChiriquÃ­ Province, Panama',
                          placeId: 'ChIJWYPOC9_spY8RdI653z0wmMA',
                        },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'ethereum',
                            imageUrl:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/42b0e48e-b77e-4c48-8770-4621d5f75700/original',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d3c5-362b-bc05-1ba0-9e5744febc19',
                          },
                          tokenUri:
                            'eip155:1/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: 'https://raspberryshake.org',
                      },
                      username: 'raspishake',
                      viewerContext: { following: false },
                    },
                    channel: {
                      authorContext: {
                        banned: false,
                        restricted: false,
                        role: 'none',
                      },
                      authorRole: 'none',
                      imageUrl:
                        'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/51ffff68-b05c-4465-37a3-38e0c9a21300/original',
                      key: 'farcaster',
                      name: 'Farcaster',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0x020bcb219a9d192725e25a1005480e34500c1d3b',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764434694028,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764434607628,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0x020bcb219a9d192725e25a1005480e34500c1d3b',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0x020bcb219a9d192725e25a1005480e34500c1d3b',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0x020bcb219a9d192725e25a1005480e34500c1d3b',
                      tokenId:
                        '11680984967710583743591769219626099452827934011',
                    },
                    combinedRecastCount: 0,
                    hash: '0x020bcb219a9d192725e25a1005480e34500c1d3b',
                    parentAuthor: {
                      displayName: 'Alex Risch',
                      fid: 1183152,
                      followerCount: 464,
                      followingCount: 32,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I ~~break~~ make apps',
                        },
                        earlyWalletAdopter: true,
                        location: { description: '', placeId: '' },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'base',
                            imageUrl:
                              'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: '',
                      },
                      username: 'bigolal',
                    },
                    parentHash: '0x9760578244a1885ee474d716b882f61a89ff6173',
                    quoteCount: 0,
                    reactions: { count: 0 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 0 },
                    tags: [
                      {
                        id: 'farcaster',
                        imageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/51ffff68-b05c-4465-37a3-38e0c9a21300/original',
                        name: 'Farcaster',
                        type: 'channel',
                      },
                    ],
                    text: 'dont mind you reaching out at all\n\nyes still happens\n\nrefreshing the feed doesnt solve it. need to kill fc app and reopen\n\nhit me up in DM if you need any details',
                    threadHash: '0xe64657d13582e42594ef27f5e36a8042b0b56c3d',
                    timestamp: 1764173621000,
                    viewerContext: {},
                    watches: { count: 0 },
                  },
                },
                id: '0x020bcb219a9d192725e25a1005480e34500c1d3b',
                timestamp: 1764173621000,
                type: 'cast-reply',
              },
            ],
            totalItemCount: 1,
            type: 'cast-reply',
          },
          {
            id: 'moderate!cast-mention:0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
            isUnread: false,
            latestTimestamp: 1764173317000,
            previewItems: [
              {
                actor: {
                  displayName: 'horsefacts',
                  fid: 3621,
                  followerCount: 214766,
                  followingCount: 6360,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4e2117ec-3a6e-4a96-127c-591fd0057f00/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/709c5d59-7025-4840-7c8d-8adc4095b000/original',
                    bio: {
                      channelMentions: [],
                      mentions: [],
                      text: 'I work at the posts office.',
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'New York, NY, USA',
                      placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                    },
                    profileToken: {
                      token: {
                        ca: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                        chain: 'base',
                        imageUrl:
                          'https://coin-images.coingecko.com/coins/images/53103/large/superbridge-bridged-wsteth-base.png?1735227990',
                        name: 'Wrapped liquid staked Ether 2.0',
                        symbol: 'wstETH',
                        ticker: 'wstETH',
                        tokenId: '0198e8ed-d6ac-7b0f-3a46-a5820af82b39',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                    },
                    url: 'https://terminally.online',
                  },
                  username: 'horsefacts.eth',
                  viewerContext: { following: true },
                },
                content: {
                  cast: {
                    author: {
                      displayName: 'horsefacts',
                      fid: 3621,
                      followerCount: 214766,
                      followingCount: 6360,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4e2117ec-3a6e-4a96-127c-591fd0057f00/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/709c5d59-7025-4840-7c8d-8adc4095b000/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'I work at the posts office.',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'New York, NY, USA',
                          placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
                        },
                        profileToken: {
                          token: {
                            ca: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                            chain: 'base',
                            imageUrl:
                              'https://coin-images.coingecko.com/coins/images/53103/large/superbridge-bridged-wsteth-base.png?1735227990',
                            name: 'Wrapped liquid staked Ether 2.0',
                            symbol: 'wstETH',
                            ticker: 'wstETH',
                            tokenId: '0198e8ed-d6ac-7b0f-3a46-a5820af82b39',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                        },
                        url: 'https://terminally.online',
                      },
                      username: 'horsefacts.eth',
                      viewerContext: { following: true },
                    },
                    channel: {
                      authorContext: {
                        banned: false,
                        restricted: false,
                        role: 'member',
                      },
                      authorRole: 'member',
                      imageUrl:
                        'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/51ffff68-b05c-4465-37a3-38e0c9a21300/original',
                      key: 'farcaster',
                      name: 'Farcaster',
                    },
                    collectible: {
                      artifactUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=3186/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fimage%3FcastHash%3D0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
                      auction: {
                        bidToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                        contract: '0xfc52e33f48dd3fcd5ee428c160722efda645d74a',
                        duration: 86400,
                        end: 1764434499502,
                        extension: 900,
                        extensionThreshold: 900,
                        minBid: '1000000',
                        minBidIncrement: '1000',
                        minBidIncrementBps: 1000,
                        protocolFeeBps: 1000,
                        start: 1764434413102,
                        totalBids: 0,
                        viewerContext: { canBid: true },
                      },
                      backgroundImageUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1062/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fbackground-image%3FcastHash%3D0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
                      ca: '0xc011ec7ca575d4f0a2eda595107ab104c7af7a09',
                      castHash: '0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
                      chain: 'base',
                      state: 'auction-pending',
                      thumbnailUrl:
                        'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=1593/https%3A%2F%2Fclient.warpcast.com%2Fv2%2Fcast-collectibles%2Fthumbnail%3FcastHash%3D0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
                      tokenId:
                        '1092092326631466614811182905109719933969160768859',
                    },
                    combinedRecastCount: 0,
                    hash: '0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
                    mentions: [
                      {
                        displayName: 'Alex Risch',
                        fid: 1183152,
                        followerCount: 378,
                        followingCount: 32,
                        pfp: {
                          url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
                          verified: false,
                        },
                        profile: {
                          accountLevel: 'pro',
                          bio: {
                            channelMentions: [],
                            mentions: [],
                            text: 'I ~~break~~ make apps',
                          },
                          earlyWalletAdopter: true,
                          location: { description: '', placeId: '' },
                          profileToken: {
                            token: {
                              ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                              chain: 'base',
                              imageUrl:
                                'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
                              name: 'Ethereum',
                              symbol: 'ETH',
                              ticker: 'ETH',
                              tokenId: '0198d322-89f9-f515-3baa-e4b497ba9a91',
                            },
                            tokenUri:
                              'eip155:8453/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                          },
                          url: '',
                        },
                        username: 'bigolal',
                      },
                    ],
                    parentAuthor: {
                      displayName: 'Raspberry Shake',
                      fid: 372916,
                      followerCount: 218,
                      followingCount: 81,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0b4a5d2f-9cfe-4793-5b34-832227f6e300/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/dbfbfcc7-69db-42c1-9b6c-edde3483e400/original',
                        bio: {
                          channelMentions: [],
                          mentions: [],
                          text: 'Citizen science-powered earthquake monitoring network. We share our journey of going bankless, advocate for what our biz needs onchain & experiment. "warp warp"',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'Boquete, ChiriquÃ­ Province, Panama',
                          placeId: 'ChIJWYPOC9_spY8RdI653z0wmMA',
                        },
                        profileToken: {
                          token: {
                            ca: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            chain: 'ethereum',
                            imageUrl:
                              'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/42b0e48e-b77e-4c48-8770-4621d5f75700/original',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            ticker: 'ETH',
                            tokenId: '0198d3c5-362b-bc05-1ba0-9e5744febc19',
                          },
                          tokenUri:
                            'eip155:1/erc20:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        },
                        url: 'https://raspberryshake.org',
                      },
                      username: 'raspishake',
                    },
                    parentHash: '0x94714cd43a73328c21512977d07ceefc5e8017d8',
                    quoteCount: 0,
                    reactions: { count: 1 },
                    recasts: { count: 0, recasters: [] },
                    replies: { count: 1 },
                    tags: [
                      {
                        id: 'farcaster',
                        imageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/51ffff68-b05c-4465-37a3-38e0c9a21300/original',
                        name: 'Farcaster',
                        type: 'channel',
                      },
                    ],
                    text: '@bigolal is looking into this, mind if he reaches out to you?',
                    threadHash: '0xe64657d13582e42594ef27f5e36a8042b0b56c3d',
                    timestamp: 1764173317000,
                    viewerContext: {},
                    watches: { count: 0 },
                  },
                },
                id: '0xbf4b1d155442c0405b8d85e7400ac47ca4c48d5b',
                timestamp: 1764173317000,
                type: 'cast-mention',
              },
            ],
            totalItemCount: 1,
            type: 'cast-mention',
          },
          {
            id: 'moderate!token-alert:019abff2-f5e8-26b6-400e-35b00b8cc993',
            isUnread: false,
            latestTimestamp: 1764156962277,
            previewItems: [
              {
                content: {
                  metadata: {
                    currentPriceUsd: 0.000105062403913,
                    lowerTargetPriceUsd: 0.00010874208421095,
                    percentChange: 0.05,
                    startingPriceUsd: 0.000114465351801,
                    upperTargetPriceUsd: 0.00012018861939105,
                  },
                  token: {
                    blockaidQuality: 'Benign',
                    ca: '0x06f71fb90f84b35302d132322a3c90e4477333b0',
                    chain: 'base',
                    circulatingSupply: '88606373287.77942',
                    decimals: 18,
                    description:
                      '$BRACKY is the native token of Bracky, a Sports Agent on Farcaster and beyond. Stake your claim in the inevitable transition of predictive power.',
                    fdv: 9212913,
                    features: { canTrade: true, isTestnet: false },
                    holderCount: 7482,
                    imageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/ec9609ea-07f5-4be3-18ab-e3da03b95400/original',
                    isHighRisk: false,
                    liquidity: 488222,
                    marketCap: 8163228,
                    name: 'BRACKY',
                    priceChangePct: {
                      h24: -11.335808746439666,
                      h6: 1.7321606707213877,
                    },
                    priceUpdatedAt: 1764616829515,
                    priceUsd: '0.0000921291263414',
                    source: {
                      createdAt: 1736625041000,
                      platform: 'clanker',
                      platformUrl:
                        'https://www.clanker.world/clanker/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                    },
                    ticker: 'BRACKY',
                    totalSupply: '100000000000',
                    urls: {
                      blockExplorer:
                        'https://basescan.org/address/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      coingecko: 'https://www.coingecko.com/en/coins/bracky',
                      dexscreener:
                        'https://dexscreener.com/base/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      geckoterminal:
                        'https://www.geckoterminal.com/base/pools/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      twitter: 'https://x.com/brackyHQ',
                      website: 'https://bracket.game',
                    },
                    verifications: [
                      {
                        platform: 'coingecko',
                        platformUrl:
                          'https://www.coingecko.com/en/coins/bracky',
                      },
                    ],
                    volume: { h24: 49642, h6: 26672 },
                    warningType: 'safe',
                  },
                  tokenSubscriptionId: '01993e05-a86f-6b69-bdc8-e6f2bf6c2290',
                  type: 'price-movement-pct',
                },
                id: '019abff2-f5e8-26b6-400e-35b00b8cc993',
                timestamp: 1764156962277,
                type: 'token-alert',
              },
            ],
            totalItemCount: 1,
            type: 'token-alert',
          },
          {
            id: 'moderate!follow:1183152_25_10_2025',
            isUnread: false,
            latestTimestamp: 1764102272000,
            previewItems: [
              {
                actor: {
                  displayName: 'Maximus âª',
                  fid: 16333,
                  followerCount: 11152,
                  followingCount: 10436,
                  pfp: {
                    url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/f85a0d49-e596-491a-8c11-10cb22cfe300/original',
                    verified: false,
                  },
                  profile: {
                    accountLevel: 'pro',
                    bannerImageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/9e0846fd-c766-4d45-e9c3-501f695a6400/original',
                    bio: {
                      channelMentions: ['innerview'],
                      mentions: [],
                      text: 'In the market, we trust. Forex & crypto trader since 2016, driven by strategy |||| \nððð: #16333 ||||  Content Creator ||||\nCreator of /innerview',
                    },
                    earlyWalletAdopter: true,
                    location: {
                      description: 'Ottawa, ON, Canada',
                      placeId: 'ChIJrxNRX7IFzkwR7RXdMeFRaoo',
                    },
                    profileToken: {
                      token: {
                        ca: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                        chain: 'base',
                        imageUrl:
                          'https://coin-images.coingecko.com/coins/images/34515/large/android-chrome-512x512.png?1706198225',
                        name: 'Degen',
                        symbol: 'DEGEN',
                        ticker: 'DEGEN',
                        tokenId: '0198cf9a-efd8-6b2b-d06a-3913d55ebbd3',
                      },
                      tokenUri:
                        'eip155:8453/erc20:0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
                    },
                    totalEarned: 964.384908496498,
                    url: '',
                  },
                  username: 'm--',
                  viewerContext: { followedBy: true, following: false },
                },
                id: '16333',
                timestamp: 1764102272000,
                type: 'follow',
              },
            ],
            totalItemCount: 1,
            type: 'follow',
          },
          {
            id: 'moderate!mini-app:1183152_clankermon.com_24_10_2025',
            isUnread: false,
            latestTimestamp: 1764024079289,
            previewItems: [
              {
                content: {
                  body: 'Check it out in app now',
                  miniapp: {
                    author: {
                      displayName: 'Matthew Fox ð',
                      fid: 4282,
                      followerCount: 13130,
                      followingCount: 1795,
                      pfp: {
                        url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/51d7292f-2cd5-4ffd-7ef4-1e48dd052900/original',
                        verified: false,
                      },
                      profile: {
                        accountLevel: 'pro',
                        bannerImageUrl:
                          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/f39223b6-4835-44b5-4910-e9afc088a200/original',
                        bio: {
                          channelMentions: ['clankermon'],
                          mentions: [],
                          text: 'Mini apps will eat the internet | building /clankermon $clankermon',
                        },
                        earlyWalletAdopter: true,
                        location: {
                          description: 'Dublin, Ireland',
                          placeId: 'ChIJL6wn6oAOZ0gRoHExl6nHAAo',
                        },
                        profileToken: {
                          token: {
                            ca: '0x1cdbb57b12f732cfb4dc06f690acef476485b2a5',
                            chain: 'base',
                            imageUrl:
                              'https://clanker.world/image-overrides/clankermon.avif',
                            name: 'Clankermon',
                            symbol: 'Clankermon',
                            ticker: 'Clankermon',
                            tokenId: '0198db94-e776-11ab-6b1b-cbf9c16d986d',
                          },
                          tokenUri:
                            'eip155:8453/erc20:0x1cdbb57b12f732cfb4dc06f690acef476485b2a5',
                        },
                        totalEarned: 9175.814527562889,
                        url: 'https://clankermon.com',
                      },
                      referrerUsername: 'jasonkeath',
                      username: 'matthewfox',
                      viewerContext: { followedBy: false, following: false },
                    },
                    buttonTitle: 'Play Now',
                    description:
                      'where your favourite tokens literally come to life',
                    domain: 'clankermon.com',
                    heroImageUrl:
                      'https://storage.googleapis.com/clankermon/metatags/pinkGirl_1200x630.jpeg',
                    homeUrl: 'https://clankermon.com',
                    iconUrl:
                      'https://proxy.wrpcd.net/?url=https%3A%2F%2Fclankermon.com%2FclankermonIcon.png&s=d4b36c5d4d7b2d57af7c557d4b69b7ecec980c97ca0abc7228905f836110bca2',
                    id: '0197901a-d4bb-b381-5c9a-50066d1731a9',
                    imageUrl:
                      'https://proxy.wrpcd.net/?url=https%3A%2F%2Fstorage.googleapis.com%2Fclankermon%2Fmetatags%2FpinkGirl_1200x630.jpeg&s=72a2ed4ceec7f4cb83a777d869aa8e8a1831c33d14a840df1d99be276100e2c7',
                    name: 'Clankermon',
                    ogDescription:
                      'where your favourite tokens literally come to life',
                    ogImageUrl:
                      'https://storage.googleapis.com/clankermon/metatags/pinkGirl_1200x630.jpeg',
                    ogTitle: 'Clankermon',
                    primaryCategory: 'games',
                    screenshotUrls: [
                      'https://storage.googleapis.com/clankermon/metatags/pinkGirl_1200x630.jpeg',
                    ],
                    shortId: 'RssPhFeD24W_',
                    splashBackgroundColor: '#19111E',
                    splashImageUrl:
                      'https://proxy.wrpcd.net/?url=https%3A%2F%2Fstorage.googleapis.com%2Fclankermon%2Fmetatags%2Fclankermonaltlogo.png&s=849eb4de7e9074fdc4bb4c9318ef467dc2d9bccd9a0d7cccae11115b10c62521',
                    subtitle: 'Believe in something',
                    supportsNotifications: true,
                    tagline: 'Believe in something',
                    tags: ['clankermon', 'game', 'monsters', 'rpg', 'idle'],
                    viewerContext: {
                      favorited: true,
                      notificationDetails: {
                        token: '0198e6cc-8f56-2e96-bf34-abaa124388ca',
                        url: 'https://api.farcaster.xyz/v1/frame-notifications',
                      },
                      notificationsEnabled: true,
                    },
                  },
                  notificationId: '8d167185-abcf-4f6d-bc56-31c37e31f2a0',
                  targetUrl: 'https://clankermon.com',
                  title: 'gmon community tab',
                },
                id: '019ab807-53ba-a4e5-064e-34e8c81ced78',
                timestamp: 1764024079289,
                type: 'mini-app',
              },
            ],
            totalItemCount: 1,
            type: 'mini-app',
          },
          {
            id: 'moderate!token-alert:019ab7af-7041-1b40-2f09-d87c2e8b9cb0',
            isUnread: false,
            latestTimestamp: 1764018319421,
            previewItems: [
              {
                content: {
                  metadata: {
                    currentPriceUsd: 0.000114465351801,
                    lowerTargetPriceUsd: 0.0001028110152597,
                    percentChange: 0.05,
                    startingPriceUsd: 0.000108222121326,
                    upperTargetPriceUsd: 0.0001136332273923,
                  },
                  token: {
                    blockaidQuality: 'Benign',
                    ca: '0x06f71fb90f84b35302d132322a3c90e4477333b0',
                    chain: 'base',
                    circulatingSupply: '88606373287.77942',
                    decimals: 18,
                    description:
                      '$BRACKY is the native token of Bracky, a Sports Agent on Farcaster and beyond. Stake your claim in the inevitable transition of predictive power.',
                    fdv: 9212913,
                    features: { canTrade: true, isTestnet: false },
                    holderCount: 7482,
                    imageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/ec9609ea-07f5-4be3-18ab-e3da03b95400/original',
                    isHighRisk: false,
                    liquidity: 488222,
                    marketCap: 8163228,
                    name: 'BRACKY',
                    priceChangePct: {
                      h24: -11.335808746439666,
                      h6: 1.7321606707213877,
                    },
                    priceUpdatedAt: 1764616829515,
                    priceUsd: '0.0000921291263414',
                    source: {
                      createdAt: 1736625041000,
                      platform: 'clanker',
                      platformUrl:
                        'https://www.clanker.world/clanker/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                    },
                    ticker: 'BRACKY',
                    totalSupply: '100000000000',
                    urls: {
                      blockExplorer:
                        'https://basescan.org/address/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      coingecko: 'https://www.coingecko.com/en/coins/bracky',
                      dexscreener:
                        'https://dexscreener.com/base/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      geckoterminal:
                        'https://www.geckoterminal.com/base/pools/0x06f71fb90f84b35302d132322a3c90e4477333b0',
                      twitter: 'https://x.com/brackyHQ',
                      website: 'https://bracket.game',
                    },
                    verifications: [
                      {
                        platform: 'coingecko',
                        platformUrl:
                          'https://www.coingecko.com/en/coins/bracky',
                      },
                    ],
                    volume: { h24: 49642, h6: 26672 },
                    warningType: 'safe',
                  },
                  tokenSubscriptionId: '01993e05-a86f-6b69-bdc8-e6f2bf6c2290',
                  type: 'price-movement-pct',
                },
                id: '019ab7af-7041-1b40-2f09-d87c2e8b9cb0',
                timestamp: 1764018319421,
                type: 'token-alert',
              },
            ],
            totalItemCount: 1,
            type: 'token-alert',
          },
          {
            id: 'moderate!swap-failed:019ab779-2702-3c83-015b-0d162bcca278',
            isUnread: false,
            latestTimestamp: 1764014792449,
            previewItems: [
              {
                content: {
                  buyToken: {
                    ca: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    chain: 'monad',
                    decimals: 18,
                    imageUrl:
                      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d5f76de5-c052-4714-c4a8-03438c7c2c00/original',
                    marketCap: 386317955.769948,
                    name: 'Monad',
                    priceUsd: 0.0356710947156,
                    symbol: 'MON',
                  },
                  sellAmount: '1800000',
                  sellToken: {
                    ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                    chain: 'base',
                    decimals: 6,
                    imageUrl:
                      'https://api.sim.dune.com/beta/token/logo/8453/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                    marketCap: 0,
                    name: 'USD Coin',
                    priceUsd: 1,
                    symbol: 'USDC',
                  },
                },
                id: '019ab779-2702-3c83-015b-0d162bcca278',
                timestamp: 1764014792449,
                type: 'swap-failed',
              },
            ],
            totalItemCount: 1,
            type: 'swap-failed',
          },
        ],
      },
    };
  };
