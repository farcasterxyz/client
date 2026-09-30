import React from 'react';

type AnnouncementDirectCastProps = {
  text: string | React.ReactNode;
};

const AnnouncementDirectCast: React.FC<AnnouncementDirectCastProps> = ({
  text,
}) => {
  return (
    <>
      <div className="mb-2 max-w-[80%] self-center">
        <div className="shadow-xs rounded-[11px] px-2.5 py-1 bg-overlay-light">
          <div className="line-clamp-2 text-center text-xs">{text}</div>
        </div>
      </div>
    </>
  );
};

AnnouncementDirectCast.displayName = 'AnnouncementDirectCast';

export { AnnouncementDirectCast };
