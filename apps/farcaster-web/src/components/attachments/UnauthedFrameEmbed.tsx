import React from 'react';

const UnauthedFrameEmbed: React.FC = React.memo(() => {
  return (
    <div className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-2 text-sm text-muted border-default">
      <div className="flex flex-row items-center">
        <div className="text-sm">Log in to interact with this frame</div>
      </div>
      <div className="flex size-6 items-center justify-center rounded-full bg-highlight-gray text-default">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      </div>
    </div>
  );
});

UnauthedFrameEmbed.displayName = 'UnauthedFrameEmbed';

export { UnauthedFrameEmbed };
