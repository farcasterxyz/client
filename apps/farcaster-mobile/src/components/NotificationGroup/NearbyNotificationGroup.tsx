import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ApiNearbyNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type NearbyNotificationGroupProps = {
  group: ApiNearbyNotificationGroup;
};

const NearbyNotificationGroup: FC<NearbyNotificationGroupProps> = memo(
  ({ group }) => {
    const push = usePush();

    // We'll presume the backend has done its job correctly such that all items in the
    // group have the same location. Therefore we can take the first preview item's
    // location description as representative for the group.
    const locationDescription =
      group.previewItems[0].content.location.description;

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('NotificationActorsInGroup', {
            groupId: group.id,
            type: group.type,
            locationDescription,
          });
        }}
      >
        <NotificationIcon variant="brown">
          {(iconColor) => (
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={20}
              style={[{ color: iconColor }]}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate={
              group.previewItems.length === 1
                ? `is now in ${locationDescription}`
                : `are now in ${locationDescription}`
            }
            totalItemCount={group.totalItemCount}
            type={group.type}
            locationDescription={locationDescription}
          />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

NearbyNotificationGroup.displayName = 'NearbyNotificationGroup';

export { NearbyNotificationGroup };
