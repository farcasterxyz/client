import { InfoIcon } from '@primer/octicons-react';
import React from 'react';

const DeprecatedFrameBanner: React.FC = React.memo(() => {
  return (
    <div className="flex flex-row items-center gap-2 rounded-lg border p-2 bg-faint border-default">
      <InfoIcon size={16} className="text-muted" />
      <div className="text-xs text-muted">Frames v1 have been deprecated.</div>
    </div>
  );
});

DeprecatedFrameBanner.displayName = 'DeprecatedFrameBanner';

export { DeprecatedFrameBanner };
