import React from 'react';

const NotSupportedDirectCast: React.FC = () => {
  return (
    <>
      <div className="mb-2 max-w-[80%] self-center">
        <div className="shadow-xs rounded px-2 py-1 bg-overlay-light">
          <div className="line-clamp-1 text-center text-sm text-muted">
            Message is not supported — please update Farcaster
          </div>
        </div>
      </div>
    </>
  );
};

NotSupportedDirectCast.displayName = 'NotSupportedDirectCast';

export { NotSupportedDirectCast };
