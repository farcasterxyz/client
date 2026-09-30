import { ApiAudioRoom } from 'farcaster-client-data';
import { FC } from 'react';

import { SpaceHead } from './SpaceHead';

type SpaceProps = {
  room: ApiAudioRoom;
};

/**
 * Minimal SSR landing for a Space URL. Real users land in the full client
 * app; this page exists primarily to emit OG metadata for link previews.
 */
const Space: FC<SpaceProps> = ({ room }) => {
  return (
    <>
      <SpaceHead room={room} />
      <div>{room.title}</div>
      {room.description && <div>{room.description}</div>}
      <div>Hosted by {room.host.displayName}</div>
    </>
  );
};

Space.displayName = 'Space';

export { Space };
