import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath, defaultOGKeywords } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';
import { getAbsoluteUrl } from '~/utils/urlUtils';

const FallbackOGHead: React.FC = () => {
  const { host } = useRequest();

  return (
    <OGHead
      description={
        'Share updates, ideas, and launches directly into a real-time feed designed for traders, builders, and creators across Base, Solana, Monad, and other modern chains.'
      }
      imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
      title={'Farcaster: The Onchain Social Network'}
      type="website"
      url={getAbsoluteUrl({ host })}
      keywords={defaultOGKeywords}
      imageHeight={630}
      imageWidth={1200}
    />
  );
};

export default function ComposePage() {
  return (
    <>
      <FallbackOGHead />
      <main>
        <section id="overview">
          <h1>Farcaster: The Onchain Social Network</h1>

          <h2>Post Onchain to Reach Crypto-Native Audiences</h2>
          <p>
            Share updates, ideas, and launches directly into a real-time feed
            designed for traders, builders, and creators across Base, Solana,
            Monad, and other modern chains.
          </p>

          <h2>Discover Signals Through Conversation</h2>
          <p>
            See early narratives, tokens, apps, and communities emerge by
            following what people are discussing, trading, and building in real
            time.
          </p>

          <h2>Make Posts Interactive with Mini Apps</h2>
          <p>
            Embed tools, mints, games, analytics, and other interactive
            experiences directly inside your posts using simple HTML, CSS, and
            JavaScript.
          </p>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 Farcaster. All rights reserved.</p>
      </footer>
    </>
  );
}
