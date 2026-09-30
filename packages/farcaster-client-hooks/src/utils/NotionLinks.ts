type NotionLink =
  | 'channel-updates'
  | 'home-feed-updates'
  | 'nerfs'
  | 'trx-limit-exceeded'
  | 'channels'
  | 'cast-actions'
  | 'connect-wallet'
  | 'trx-simulations'
  | 'power-badge'
  | 'spammy-replies'
  | 'creator-rewards'
  | 'follows'
  | 'boosts'
  | 'token-links'
  | 'signers'
  | 'user-blocking'
  | 'priority-mode'
  | 'direct-casts-requests'
  | 'nft-collections'
  | 'earnings'
  | 'warpcast-recovery-address'
  | 'usernames'
  | 'non-supported-farcaster-accounts'
  | 'fees'
  | 'passkeys'
  | 'advanced-protection'
  | 'storage'
  | 'trending-topics'
  | 'verifications'
  | 'warps'
  | 'username-policy'
  | 'community-guidelines'
  | 'reporting-casts'
  | 'what-is-gas'
  | 'collectible-casts'
  | 'referrals'
  | 'deposit-bonuses'
  | 'alternative-farcaster-clients'
  | 'token-validation';

type ExternalAccessFarcasterNotionTarget =
  `https://farcasterhq.notion.site/${string}`;

export function getNotionLinkTarget({
  to,
}: {
  to: NotionLink;
}): ExternalAccessFarcasterNotionTarget {
  switch (to) {
    case 'channel-updates':
      return 'https://farcasterhq.notion.site/Upcoming-channel-changes-1056a6c0c101800caee6ea8133f8f966';
    case 'home-feed-updates':
      return 'https://farcasterhq.notion.site/Updates-to-home-13c6a6c0c10180189a95d379924f41c0';
    case 'nerfs':
      return 'https://farcasterhq.notion.site/Nerfs-3226885de1554031b2902ac2d3f9b15c';
    case 'trx-limit-exceeded':
      return 'https://farcasterhq.notion.site/Transaction-Limit-Exceeded-51a2d50123484f7e8a899b8748806726';
    case 'channels':
      return 'https://farcasterhq.notion.site/Channels-10a6a6c0c101809f99c7d9add462f699';
    case 'cast-actions':
      return 'https://farcasterhq.notion.site/Cast-Actions-6e1ac0cab0604962b01c826e497c85d3';
    case 'connect-wallet':
      return 'https://farcasterhq.notion.site/Connect-Wallet-d4471a64ac83402b8795d9bd64907d68';
    case 'trx-simulations':
      return 'https://farcasterhq.notion.site/Transaction-Simulations-e87cd3a1945e411a849db1c2cbf066ad';
    case 'spammy-replies':
      return 'https://farcasterhq.notion.site/Spammy-Replies-1046a6c0c1018083b7eac651c1dac9a6';
    case 'creator-rewards':
      return 'https://farcasterhq.notion.site/Public-Warpcast-Creator-Rewards-22ef8c4e782846dd88ea11195b1641a1';
    case 'follows':
      return 'https://farcasterhq.notion.site/Follows-8d142bd3e84e4ad899f0d2bfde5460fa';
    case 'boosts':
      return 'https://farcasterhq.notion.site/Warpcast-Boost-cfc555ea0df84616840931d2fa458f4c';
    case 'token-links':
      return 'https://farcasterhq.notion.site/Token-Links-17e6a6c0c10180a68c4dce055b64d12b';
    case 'signers':
      return 'https://farcasterhq.notion.site/Signers-d0eb8538588d49869c2826fd1164aea3';
    case 'user-blocking':
      return 'https://farcasterhq.notion.site/User-Blocking-d0465c4a082f46db8f38a380688f90c7';
    case 'priority-mode':
      return 'https://farcasterhq.notion.site/Priority-mode-7a9bccacc1474ccbba1e58dd2bec2dd3';
    case 'direct-casts-requests':
      return 'https://farcasterhq.notion.site/Direct-Cast-Requests-d42fa4dbd8d04664bbdabec0dbeb8dfa';
    case 'nft-collections':
      return 'https://farcasterhq.notion.site/NFT-collections-0f76abc16d344414b42fcfea5e55f86d';
    case 'earnings':
      return 'https://farcasterhq.notion.site/Farcaster-earnings-1bc6a6c0c10180749c0cc1dc0ee4810d';
    case 'warpcast-recovery-address':
      return 'https://farcasterhq.notion.site/Warpcast-Recovery-Address-f5406929a800467186b66f9e7dd90e75';
    case 'usernames':
      return 'https://farcasterhq.notion.site/Usernames-351eadc54c65411a8bff9f2d4e3b163b';
    case 'non-supported-farcaster-accounts':
      return 'https://farcasterhq.notion.site/Non-supported-Farcaster-accounts-bb422f7a42de4499a841e618236b6535';
    case 'fees':
      return 'https://farcasterhq.notion.site/Fees-319d923e80054e2e950306f40ba7f69e';
    case 'passkeys':
      return 'https://farcasterhq.notion.site/Passkeys-1283a615f57049ac8bcbdf9d8a37d21d';
    case 'advanced-protection':
      return 'https://farcasterhq.notion.site/Public-Advanced-Protection-1a16a6c0c10180099148f94c1112485d';
    case 'storage':
      return 'https://farcasterhq.notion.site/Storage-efa0387e183e4ffaa6dc86bebbfc41e2';
    case 'trending-topics':
      return 'https://farcasterhq.notion.site/Trending-Topics-1d26a6c0c101804488ffc0c97e865fad';
    case 'verifications':
      return 'https://farcasterhq.notion.site/Verifications-1af6a6c0c1018008804ef9a250020376';
    case 'warps':
      return 'https://farcasterhq.notion.site/Warps-ea98989b8a944a679c5b9e076e07efcd';
    case 'username-policy':
      return 'https://farcasterhq.notion.site/Username-policy-f4f3b1c024b24b3bbc8aaca609b3558e';
    case 'community-guidelines':
      return 'https://farcasterhq.notion.site/Community-Guidelines-d46d9faf569c4988a42fa0128988eeb0';
    case 'reporting-casts':
      return 'https://farcasterhq.notion.site/Reporting-Casts-dde59a66c8db4af2b31178ef260c79a2';
    case 'what-is-gas':
      return 'https://farcasterhq.notion.site/What-is-Gas-1dc6a6c0c101809184f8ed48ecdc8d8';
    case 'collectible-casts':
      return 'https://farcasterhq.notion.site/Collectibles-2306a6c0c10180d7a917c24892662a3c';
    case 'referrals':
      return 'https://farcasterhq.notion.site/Referrals-2756a6c0c101804d936be933bda21d20';
    case 'deposit-bonuses':
      return 'https://farcasterhq.notion.site/Deposit-Rewards-2846a6c0c10180a2b415d882132095a3';
    case 'alternative-farcaster-clients':
      return 'https://farcasterhq.notion.site/Alternative-Farcaster-clients-2936a6c0c101809b9594c5aa9001b6b1';
    case 'token-validation':
      return 'https://farcasterhq.notion.site/Token-Validation-Page-2b06a6c0c10180d48574cb92435d73b9';
    default:
      throw new Error('No target found for linking');
  }
}
