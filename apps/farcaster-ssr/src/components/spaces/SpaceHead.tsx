import { ApiAudioRoom } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

type SpaceHeadProps = {
  room: ApiAudioRoom;
};

const SpaceHead: FC<SpaceHeadProps> = ({ room }) => {
  const { host: requestHost } = useRequest();

  const title = useMemo(() => {
    if (room.state === 'live') {
      return `${room.title} — Live Space hosted by ${room.host.displayName}`;
    }
    if (room.state === 'scheduled') {
      return `${room.title} — Scheduled Space hosted by ${room.host.displayName}`;
    }
    return `${room.title} — Space hosted by ${room.host.displayName}`;
  }, [room.title, room.host.displayName, room.state]);

  const description = useMemo(() => {
    const base = room.description?.trim();

    if (room.state === 'live') {
      const listening =
        typeof room.listenerCount !== 'undefined'
          ? `${room.listenerCount.toLocaleString()} listening now. `
          : '';
      return base
        ? `${base} — ${listening}Tap to join the live audio Space on Farcaster.`
        : `${listening}Tap to join the live audio Space on Farcaster.`;
    }

    if (room.state === 'scheduled' && room.scheduledAt) {
      const when = new Date(room.scheduledAt).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      return base
        ? `${base} — Scheduled for ${when} on Farcaster.`
        : `Scheduled for ${when} on Farcaster.`;
    }

    return base
      ? `${base} — Audio Space on Farcaster.`
      : 'Audio Space on Farcaster.';
  }, [room.description, room.listenerCount, room.scheduledAt, room.state]);

  const url = useMemo(() => {
    return `https://${requestHost}/~/spaces/${room.id}`;
  }, [requestHost, room.id]);

  const imageUrl = useMemo(() => {
    return (
      room.host.pfp?.url ||
      getImageUrl({
        host: requestHost,
        path: defaultOGImagePath,
      })
    );
  }, [room.host.pfp?.url, requestHost]);

  const extras = useMemo(() => {
    const list: Array<{ property: string; content: string }> = [
      { property: 'warpcast:space:id', content: room.id },
      { property: 'warpcast:space:state', content: room.state },
      { property: 'warpcast:space:host_fid', content: String(room.hostFid) },
    ];
    if (room.state === 'live') {
      list.push({
        property: 'warpcast:space:listener_count',
        content: String(room.listenerCount),
      });
    }
    if (room.scheduledAt) {
      list.push({
        property: 'warpcast:space:scheduled_at',
        content: room.scheduledAt,
      });
    }
    return list;
  }, [room.id, room.state, room.hostFid, room.listenerCount, room.scheduledAt]);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      title={title}
      type="website"
      url={url}
      extras={extras}
    />
  );
};

SpaceHead.displayName = 'SpaceHead';

export { SpaceHead };
