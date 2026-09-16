import React from 'react';

const NewMessagesMarker: React.FC = () => {
  return (
    <div className="my-1 mb-3 flex w-full select-none flex-row items-center py-1 text-center text-sm text-muted">
      <span className="h-[4px] grow border-b border-default" />
      <span className="px-4">New messages</span>
      <span className="h-[4px] grow border-b border-default" />
    </div>
  );
};

export { NewMessagesMarker };
