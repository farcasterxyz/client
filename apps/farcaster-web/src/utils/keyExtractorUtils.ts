import { ApiLocation, ApiNotificationGroup } from 'farcaster-client-data';

import { ApiCastWithContext } from '~/types';

const delimiter = '|';

const castWithContextKeyExtractor = ({ cast }: ApiCastWithContext) =>
  [cast.author.fid, cast.hash, cast.recast ? 'true' : 'false'].join(delimiter);

const notificationGroupKeyExtractor = (group: ApiNotificationGroup) => group.id;

const locationKeyExtractor = (location: ApiLocation) => location.placeId;

export {
  castWithContextKeyExtractor,
  locationKeyExtractor,
  notificationGroupKeyExtractor,
};
