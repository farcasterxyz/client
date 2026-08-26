import { FC, memo } from 'react';

// Renders in place of a cast whose embed URL hostname matches the harmful-domain
// blocklist. Only mounted for admins (see `Cast.tsx`) — non-admins see nothing.
// Lets the moderation team confirm a block landed and audit what's being hidden.
const BlockedByDomainPlaceholder: FC = memo(() => (
  <div className="border-b px-4 py-3 text-center text-sm italic !border-surface-secondary text-faint">
    Hidden — embed matches a blocked domain. Visible to admins only.
  </div>
));

BlockedByDomainPlaceholder.displayName = 'BlockedByDomainPlaceholder';

export { BlockedByDomainPlaceholder };
