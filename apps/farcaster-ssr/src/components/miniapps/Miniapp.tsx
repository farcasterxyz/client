import {
  ApiFrame,
  ApiFrameEmbedNextExtended,
  ApiOpenGraphMetadata,
} from 'farcaster-client-data';
import Link from 'next/link';

import { getMiniappMetadata } from '~/utils/miniappUtils';

export const MiniApp = ({
  isInCollection,
  frame,
  embed,
  ogMetadata,
  description,
}: {
  isInCollection?: boolean;
  frame: ApiFrame;
  embed: ApiFrameEmbedNextExtended | null;
  ogMetadata: ApiOpenGraphMetadata | null;
  description: string | null;
}) => {
  const metadata = getMiniappMetadata({ frame, embed, ogMetadata });

  if (!metadata) {
    return null;
  }

  const path = new URL(metadata.url).pathname;

  return (
    <>
      <div
        style={{
          padding: '20px',
          fontFamily: 'sans-serif',
          maxWidth: '800px',
          margin: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            alignItems: 'flex-start',
          }}
        >
          {metadata.imageUrl && (
            <img
              src={metadata.imageUrl}
              alt={metadata.pageTitle}
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flex: 1,
            }}
          >
            {!isInCollection ? (
              <h1 style={{ margin: 0 }}>{metadata.pageTitle}</h1>
            ) : (
              <a
                href={path}
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <h2 style={{ margin: 0 }}>{metadata.pageTitle}</h2>
              </a>
            )}
            {metadata.authorProfileUrl ? (
              <Link
                href={metadata.authorProfileUrl}
                target="_blank"
                rel="noopener noreferrer author"
                style={{ fontSize: '0.9em', color: '#666' }}
              >
                by {metadata.authorUsername}
              </Link>
            ) : (
              <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                by {metadata.authorUsername}
              </p>
            )}
            {description && (
              <p style={{ margin: 0, fontSize: '0.9em' }}>
                <strong>Description:</strong> {description}
              </p>
            )}
            {metadata.primaryCategory && (
              <p style={{ margin: 0, fontSize: '0.9em' }}>
                <strong>Category:</strong> {metadata.primaryCategory}
              </p>
            )}
            {metadata.tags && metadata.tags.length > 0 && (
              <p style={{ margin: 0, fontSize: '0.9em' }}>
                <strong>Tags:</strong> {metadata.tags.join(', ')}
              </p>
            )}
            <h2>What are Farcaster mini apps?</h2>
            <p>
              Farcaster mini apps are lightweight, onchain applications that run
              natively inside the Farcaster feed, giving users interactive
              experiences—such as games, trading tools, analytics dashboards,
              and utility apps—without leaving the social wallet. Built with
              standard HTML, CSS, and JavaScript, they offer richer
              functionality than the older Farcaster Frames while staying
              tightly integrated with the network’s decentralized social graph
              and real-time feed. For users, mini apps provide a seamless way to
              discover and use new onchain experiments; for developers, they
              offer a fast path to shipping crypto-native products directly into
              the Farcaster ecosystem.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
