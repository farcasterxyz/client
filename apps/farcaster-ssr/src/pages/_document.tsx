import { Head, Html, Main, NextScript } from 'next/document';

import { FallbackOGHead } from '~/components/meta/FallbackOGHead';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <FallbackOGHead />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebApplication',
                  name: 'Farcaster',
                  url: 'https://farcaster.xyz/',
                  applicationCategory: 'FinanceApplication',
                  operatingSystem: 'iOS, Android, Web',
                  description:
                    'Farcaster is a decentralized crypto social network and wallet on Base, Solana, Monad, BSC and more for discovering people, projects and tokens.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'What is Farcaster?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Farcaster is a decentralized, open crypto social network and wallet. It runs on an open protocol and helps you discover new people, projects and ideas while trading across chains like Base, Solana, Monad, BSC and more.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Which blockchains does Farcaster support?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Farcaster supports cross-chain swaps across Base, Solana, Monad, BSC and additional EVM and non-EVM chains, so you can trade without manually bridging.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How are trading fees on Farcaster?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Farcaster offers near-zero trading fees so you stop paying 1% or more to other wallets to swap tokens.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What are Farcaster Mini Apps?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Mini Apps are lightweight onchain apps that run directly inside the Farcaster feed. Developers build them with HTML, CSS and JavaScript to ship native-feeling experiences like games, trading tools and social products.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Is Farcaster useful for the Base airdrop?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. Using Farcaster is one of the best ways to build up your onchain Base profile, making sure you are ready for potential Base airdrop opportunities.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
