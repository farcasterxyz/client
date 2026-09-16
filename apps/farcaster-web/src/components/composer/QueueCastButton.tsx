import classNames from 'classnames';
import React from 'react';

function QueueCastButton({
  canQueueCast,
  addCast,
}: {
  canQueueCast: boolean;
  addCast: () => void;
}) {
  return (
    <button
      className={classNames([
        'relative',
        !canQueueCast && 'opacity-55',
        'border-l',
        'border-default',
        'h-[100%]',
        'pl-4',
        '!ml-4',
        'pr-2',
      ])}
      disabled={!canQueueCast}
      onClick={addCast}
    >
      <div
        className="absolute bg-white"
        style={{
          borderRadius: '16px',
          width: '16px',
          height: '16px',
          top: '8px',
          left: '17px',
        }}
      />
      <svg
        viewBox="64 64 896 896"
        style={{
          width: '20px',
          height: '20px',
        }}
        className={classNames([
          'relative',
          'fill-[#7c65c1]',
          canQueueCast && 'hover:fill-[#6944ba]',
        ])}
      >
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z"></path>
      </svg>
    </button>
  );
}

export { QueueCastButton };
